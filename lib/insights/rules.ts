export type Severity = "info" | "warning" | "critical";

export interface Insight {
  severity: Severity;
  title: string;
  detail: string;
}

export type AIContext = {
  invoices: any[];
  activeInvoices: any[];
  wips: any[];
  purchases: any[];
  quotations: any[];
  currentMonthStr: string;
  prevMonthStr: string;
  pendingReceivables: number;
};

export type Rule = {
  evaluate: (context: AIContext) => Insight | null;
};

// Rule 1: Overdue Invoices
const overdueInvoicesRule: Rule = {
  evaluate: (context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = context.activeInvoices.filter(i => 
      i.finalDeliveryDate && new Date(i.finalDeliveryDate) < today
    );

    if (overdue.length === 0) return null;

    let totalDays = 0;
    let maxDaysOverdue = 0;

    overdue.forEach(i => {
      const days = Math.floor((today.getTime() - new Date(i.finalDeliveryDate).getTime()) / (1000 * 3600 * 24));
      totalDays += days;
      if (days > maxDaysOverdue) maxDaysOverdue = days;
    });

    const avgDays = Math.round(totalDays / overdue.length);
    const names = overdue.slice(0, 3).map(i => i.customerName).join(", ");
    const nameStr = overdue.length > 3 ? `${names} and ${overdue.length - 3} more` : names;

    const severity: Severity = maxDaysOverdue > 7 ? "critical" : "warning";

    return {
      severity,
      title: `${overdue.length} Overdue Invoice${overdue.length > 1 ? 's' : ''}`,
      detail: `Average ${avgDays} days overdue. Affects: ${nameStr}.`,
    };
  }
};

// Rule 2: WIP Bottleneck
// Note: Using updatedAt as an approximation for phaseEnteredAt as phase transitions update the record.
const wipBottleneckRule: Rule = {
  evaluate: (context) => {
    const today = new Date();
    const BOTTLENECK_THRESHOLD_DAYS = 3;

    const phaseStats: Record<string, { totalDays: number, count: number }> = {};

    context.wips.forEach(w => {
      const stageName = w.stage?.name || "Unknown";
      const daysInPhase = Math.floor((today.getTime() - new Date(w.updatedAt).getTime()) / (1000 * 3600 * 24));
      if (!phaseStats[stageName]) phaseStats[stageName] = { totalDays: 0, count: 0 };
      phaseStats[stageName].totalDays += daysInPhase;
      phaseStats[stageName].count += 1;
    });

    const bottleneckPhases: string[] = [];
    for (const [phase, stats] of Object.entries(phaseStats)) {
      const avgDays = stats.totalDays / stats.count;
      if (avgDays > BOTTLENECK_THRESHOLD_DAYS) {
        bottleneckPhases.push(`${phase.replace('_', ' ')} (avg ${Math.round(avgDays)} days)`);
      }
    }

    if (bottleneckPhases.length === 0) return null;

    return {
      severity: "warning",
      title: "WIP Bottlenecks Detected",
      detail: `Cards are stalling in: ${bottleneckPhases.join(", ")}. Consider reallocating resources.`,
    };
  }
};

// Rule 3: Conversion Rate Trend
const conversionRateTrendRule: Rule = {
  evaluate: (context) => {
    const { quotations, currentMonthStr, prevMonthStr } = context;
    
    const currentMonthQuos = quotations.filter(q => q.created_at?.startsWith(currentMonthStr));
    const prevMonthQuos = quotations.filter(q => q.created_at?.startsWith(prevMonthStr));

    const getRate = (quos: any[]) => {
      if (quos.length === 0) return 0;
      const accepted = quos.filter(q => q.status === 'accepted').length;
      return accepted / quos.length;
    };

    const currentRate = getRate(currentMonthQuos);
    const prevRate = getRate(prevMonthQuos);

    if (prevRate > 0 && currentRate < prevRate) {
      const dropPct = (prevRate - currentRate) * 100;
      if (dropPct > 15) {
        return {
          severity: "warning",
          title: "Conversion Rate Trend",
          detail: `Projection: Quotation conversion rate is trending down (dropped by ${dropPct.toFixed(1)}% compared to last month).`,
        };
      }
    }
    
    return null;
  }
};

// Rule 4: Margin Flag
const marginRule: Rule = {
  evaluate: (context) => {
    const lowMarginPurchases = context.purchases.filter(p => {
      // If profitPercentage is available, use it. Otherwise calculate it.
      if (p.profitPercentage !== null && p.profitPercentage !== undefined && Number(p.profitPercentage) < 10) return true;
      if (p.profit && p.totalProductionCost && Number(p.totalProductionCost) > 0) {
        const pct = (Number(p.profit) / Number(p.totalProductionCost)) * 100;
        if (pct < 10) return true;
      }
      return false;
    });

    if (lowMarginPurchases.length === 0) return null;

    const names = lowMarginPurchases.slice(0, 3).map(p => p.customerName || p.invoiceNumber).join(", ");
    const nameStr = lowMarginPurchases.length > 3 ? `${names} and ${lowMarginPurchases.length - 3} more` : names;

    return {
      severity: "critical",
      title: "Low Profit Margins Detected",
      detail: `${lowMarginPurchases.length} invoices have a profit margin below 10%. Examples: ${nameStr}.`,
    };
  }
};

// Rule 5: Pending Receivables
const receivablesRule: Rule = {
  evaluate: (context) => {
    if (context.pendingReceivables > 0) {
      // We only flag it if it's over 0, maybe could be a warning if over a threshold, but let's just make it info/warning
      const severity: Severity = context.pendingReceivables > 50000 ? "warning" : "info";
      
      return {
        severity,
        title: "Outstanding Receivables",
        detail: `₹${context.pendingReceivables.toLocaleString('en-IN')} total balance pending across all active invoices.`,
      };
    }
    return null;
  }
};

// Rule 6: Projected Revenue
const projectedRevenueRule: Rule = {
  evaluate: (context) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (currentDay < 3) return null; // Too early to project
    
    // Sum revenue for closed invoices this month
    const thisMonthClosed = context.invoices.filter(i => 
      i.status === "CLOSED" && i.createdAt?.startsWith(context.currentMonthStr)
    );
    
    const currentRev = thisMonthClosed.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
    if (currentRev === 0) return null;
    
    const runRate = currentRev / currentDay;
    const projected = runRate * daysInMonth;
    
    return {
      severity: "info",
      title: "Projected Revenue (Current Pace)",
      detail: `Based on your current daily pace, projected month-end revenue is ₹${projected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}.`,
    };
  }
};

// Rule 7: Projected Orders Closed
const projectedOrdersRule: Rule = {
  evaluate: (context) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (currentDay < 3) return null; // Too early to project
    
    const thisMonthClosedCount = context.invoices.filter(i => 
      i.status === "CLOSED" && i.createdAt?.startsWith(context.currentMonthStr)
    ).length;
    
    if (thisMonthClosedCount === 0) return null;
    
    const runRate = thisMonthClosedCount / currentDay;
    const projected = runRate * daysInMonth;
    
    return {
      severity: "info",
      title: "Projected Orders Closed (Current Pace)",
      detail: `Based on your current pace, you are on track to close ~${Math.round(projected)} orders this month.`,
    };
  }
};

export const rules: Rule[] = [
  overdueInvoicesRule,
  wipBottleneckRule,
  marginRule,
  conversionRateTrendRule,
  receivablesRule,
  projectedRevenueRule,
  projectedOrdersRule,
];
