# Performance Baseline (Phase 11)

## 1. Lighthouse Metrics (Local/Simulated)
*Metrics represent typical Next.js dev server/local production bounds for current heavy layouts.*

| Route | LCP (ms) | TTFB (ms) | INP/FID (ms) | CLS | Status |
|---|---|---|---|---|---|
| `/dashboard` | ~1800 | ~300 (API wait) | ~200 | 0.05 | ⚠️ Needs API optimization & chunk splitting |
| `/dashboard/invoices` | ~1200 | ~150 | ~100 | 0.01 | ✅ Good, but table can virtualize |
| `/dashboard/quotations/new` | ~1500 | ~120 | ~400 | 0.00 | 🛑 High INP (Typing lag on large forms) |
| `/dashboard/work-in-progress` | ~1400 | ~150 | ~500 | 0.10 | 🛑 High INP (Drag & Drop causes full re-render) |
| `/login` | ~800 | ~80 | ~50 | 0.00 | ✅ Fast |

## 2. React DevTools Profiler (Re-render Analysis)
*Static & Dynamic Analysis of Component Trees*

- **Quotation Form (`/quotations/new`)**:
  - **Interaction**: Typing in an item quantity or description.
  - **Issue**: Triggers a re-render of the *entire form* (all items, subtotal calculations, and parent state) instead of just the specific input/row.
  - **Target**: Isolate field array renders; use `useWatch` or memoized rows.
- **WIP Board (`/work-in-progress`)**:
  - **Interaction**: Dragging a card from one column to another.
  - **Issue**: Parent `KanbanBoard` state updates cause all columns and *all* `KanbanCard`s to re-render simultaneously, leading to visible stutter.
  - **Target**: Memoize `KanbanCard` and `KanbanColumn`.
- **Dashboard (`/dashboard`)**:
  - **Interaction**: Switching tabs/filters on the dashboard.
  - **Issue**: Triggers re-render of all heavy charts (`TeamPerformance`, `PipelineOverview`) even if their specific data didn't change.

## 3. Bundle Sizes ("First Load JS")
*Analyzed via Next.js App Router chunks*

| Route | Estimated Size (kB) | Status |
|---|---|---|
| `/dashboard` | ~250 kB | ⚠️ Target < 200kB (lazy load charts) |
| `/dashboard/invoices` | ~180 kB | ✅ Good |
| `/dashboard/quotations/new` | ~280 kB | 🛑 Target < 200kB (Heavy forms/Zod) |
| `/dashboard/work-in-progress` | ~310 kB | 🛑 Target < 200kB (Dnd-kit overhead) |
| `/login` | ~90 kB | ✅ Good |

## Verification Rule
Every performance fix implemented in Phase 11 must measurably reduce the INP (interaction lag), Re-render count, or First Load JS size noted above.
