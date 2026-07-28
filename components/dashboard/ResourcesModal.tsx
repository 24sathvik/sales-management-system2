"use client";

import { X, Sparkles, Lightbulb, PlayCircle, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { changelogData } from "@/lib/changelog";

const QUICK_TIPS = [
  "Did you know you can search invoices by customer phone number?",
  "You can generate a PDF directly from any approved Quotation.",
  "Use the Kanban view in 'Work in Progress' to quickly update production stages.",
  "The Final Check screen ensures all required fields are validated before finalizing an invoice.",
  "Press the Help button in the bottom right corner to quickly access FAQ for your current page."
];

export function ResourcesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"resources" | "changelog">("resources");
  
  // Random tip on open
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTipIndex(Math.floor(Math.random() * QUICK_TIPS.length));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="absolute right-0 top-[calc(100%+0.5rem)] w-[320px] sm:w-[450px] bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-default)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] z-[100]"
    >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
          <h2 className="text-xl font-bold font-display text-[var(--text-heading)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--brand-primary)]" />
            Getting Started & Resources
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-card-hover)] rounded-full text-[var(--text-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-5 border-b border-[var(--border-default)] bg-[var(--bg-app)]">
          <button
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "resources"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
            }`}
            onClick={() => setActiveTab("resources")}
          >
            Resources
          </button>
          <button
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "changelog"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
            }`}
            onClick={() => setActiveTab("changelog")}
          >
            What's New
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === "resources" ? (
            <div className="space-y-6">
              <div className="bg-[var(--brand-primary-muted)] border border-[var(--brand-primary)]/20 p-4 rounded-xl flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)] mb-1">Quick Tip</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {QUICK_TIPS[tipIndex]}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-[var(--text-heading)] text-sm mb-2">Helpful Links</h3>
                
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new Event("replay-onboarding"));
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-app)] transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-heading)] text-sm">Replay Product Tour</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Learn the basics of using ZyOps</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new Event("open-help-center"));
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-app)] transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--status-info-bg)] flex items-center justify-center text-[var(--status-info)] group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-heading)] text-sm">Open Help Center</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Access FAQs and knowledge base</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {changelogData.map((log, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline line */}
                  {idx !== changelogData.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-[var(--border-default)]" />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[var(--brand-primary-muted)] border-2 border-[var(--bg-card)] flex items-center justify-center shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  </div>
                  
                  <div className="mb-1 flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-[var(--text-heading)]">{log.title}</h3>
                    <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-default)] px-2 py-0.5 rounded-full">{log.version}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mb-3">{log.date}</div>
                  
                  <ul className="space-y-2">
                    {log.description.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2 leading-relaxed">
                        <span className="text-[var(--text-muted)] mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
