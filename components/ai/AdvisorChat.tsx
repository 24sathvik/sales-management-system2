/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState, useRef, useEffect } from "react";
import { BrainCircuit, Sparkles, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AdvisorChatProps {
  quickQuestions?: string[];
  onQuickQuestionClick?: (q: string) => void;
  className?: string;
  isDrawer?: boolean;
}

export function AdvisorChat({ quickQuestions = [], onQuickQuestionClick, className = "", isDrawer = false }: AdvisorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
     { id: "0", role: "assistant", content: "Hello! I am ZyOps Advisor. Based on your live dashboard metrics, how can I help you improve margins or operations today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Exposed API to trigger messages externally (like clicking a chip on a parent component)
  useEffect(() => {
     const handleExternalSend = async (e: any) => {
        if (e.detail?.question) {
           await handleSend(e.detail.question);
        }
     };
     window.addEventListener('ZyOps:advisor:ask', handleExternalSend);
     return () => window.removeEventListener('ZyOps:advisor:ask', handleExternalSend);
  }, []);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isTyping) return;
    
    setInput("");
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 1. Fetch AI Context dynamically (since data changes over time)
      const ctxRes = await fetch("/api/ai-context-cache");
      let context = {};
      if (ctxRes.ok) {
         context = await ctxRes.json();
      }

      // 2. Query the LLM
      const res = await fetch("/api/ai-advisor", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ message: textToSend, context })
      });

      const data = await res.json();
      
      if (res.ok) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: data.reply }]);
      } else {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Advisor is unavailable right now. Please try again." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Advisor is unavailable right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Quick Questions (Mobile or Drawer only if specified, else rendered in parent) */}
      {isDrawer && quickQuestions.length > 0 && (
        <div className="p-4 border-b border-card-border overflow-x-auto whitespace-nowrap scrollbar-hide">
             <div className="flex gap-2">
               {quickQuestions.map(q => (
                 <button 
                   key={q} 
                   onClick={() => handleSend(q)}
                   className="shrink-0 px-3 py-1.5 border border-primary text-primary rounded-full text-xs font-semibold hover:bg-accent hover:text-white transition-colors"
                 >
                   {q}
                 </button>
               ))}
             </div>
        </div>
      )}

      {/* Messages */}
      <div 
         ref={scrollRef}
         className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDrawer ? "max-h-[calc(100vh-200px)]" : "max-h-[380px]"}`}
      >
         {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-1 mr-3 shadow-sm">
                     PF
                  </div>
               )}
               <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user' 
                     ? 'bg-[var(--brand-primary-muted)] text-primary rounded-tr-sm' 
                     : 'bg-[var(--brand-accent-muted)] text-text-primary rounded-tl-sm'
               }`}>
                  {m.role === 'user' ? (
                     <p>{m.content}</p>
                  ) : (
                     <div className="prose prose-sm prose-p:leading-relaxed prose-li:my-0.5 text-text-primary max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                     </div>
                  )}
               </div>
            </div>
         ))}
         
         {isTyping && (
            <div className="flex justify-start">
               <div className="w-8 h-8 rounded-full bg-primary text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-1 mr-3 shadow-sm">
                  PF
               </div>
               <div className="bg-[var(--brand-accent-muted)] text-text-primary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
         )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-card-border bg-slate-50">
         <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
         >
            <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Ask ZyOps Advisor anything..."
               className="flex-1 px-4 py-2.5 bg-white border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            <button 
               type="submit"
               disabled={!input.trim() || isTyping}
               className="p-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
               <Send className="w-4 h-4" />
            </button>
         </form>
      </div>
    </div>
  );
}


