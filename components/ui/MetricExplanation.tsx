import { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

export function MetricExplanation({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={popoverRef}>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
        title="Explain this number"
        type="button"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <span className="font-semibold text-slate-200">How is this calculated?</span>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap font-mono text-[11px] text-slate-100">{text}</p>
          
          {/* Arrow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
