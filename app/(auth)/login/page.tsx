/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
// TODO: Replace with the actual logo component when provided
// import { ZyOpsLogo } from "@/components/ui/ZyOpsLogo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
        setLoading(false);
        return;
      }
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-[var(--bg-app)]">
      
      {/* LEFT PANEL - Value Props (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-[var(--bg-sidebar-solid)] flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle abstract pattern in background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 10% 20%, var(--brand-accent) 0%, transparent 40%), radial-gradient(circle at 90% 80%, var(--brand-primary) 0%, transparent 40%)'
          }}
        />

        <div className="relative z-10">
          {/* LOGO PLACEHOLDER */}
          <div className="text-white text-3xl font-bold tracking-tight mb-2 font-display">
            ZyOps<span className="text-[var(--brand-primary)]">.</span>
            {/* <ZyOpsLogo size="lg" theme="dark" /> */}
          </div>
          <p className="text-[var(--text-sidebar)] text-[15px]">Enterprise Sales & Production Management</p>
        </div>

        <div className="relative z-10 space-y-10 max-w-[400px]">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight font-display tracking-tight">
            Operate smarter.<br/>
            <span className="text-[var(--brand-primary)]">Deliver faster.</span>
          </h2>
          
          <div className="space-y-7">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-[22px] h-[22px] text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold text-[15px]">End-to-End Pipeline</h3>
                <p className="text-[var(--text-sidebar)] text-sm mt-1 leading-relaxed">Track every order seamlessly from initial quotation to final delivery.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-[22px] h-[22px] text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold text-[15px]">Real-time Visibility</h3>
                <p className="text-[var(--text-sidebar)] text-sm mt-1 leading-relaxed">Monitor production bottlenecks and team performance at a glance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-[22px] h-[22px] text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold text-[15px]">Financial Clarity</h3>
                <p className="text-[var(--text-sidebar)] text-sm mt-1 leading-relaxed">Automated running balances, vendor cost tracking, and precise profit margins.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[var(--text-sidebar)] text-xs font-medium">
          {"\u00A9"} 2025 ZyOps. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="w-full md:w-1/2 lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 pointer-events-none md:hidden"
             style={{
               backgroundImage: 'radial-gradient(circle at 20% 20%, var(--brand-accent) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--brand-primary) 0%, transparent 35%)',
               opacity: 0.08
             }}
        />

        <div className="w-full max-w-[420px] bg-[var(--bg-card)] rounded-[var(--radius-xl)] p-8 sm:p-12 shadow-[var(--shadow-lg)] border border-[var(--border-default)] relative z-10 animate-in">
          
          <div className="md:hidden flex flex-col items-center justify-center mb-10">
            <div className="text-[var(--text-heading)] text-3xl font-bold tracking-tight mb-2 font-display">
              ZyOps<span className="text-[var(--brand-primary)]">.</span>
              {/* <ZyOpsLogo size="lg" theme="light" /> */}
            </div>
            <p className="text-[var(--text-secondary)] text-[14px] font-sans">
              Operate smarter. Deliver faster.
            </p>
          </div>

          <div className="mb-8 hidden md:block text-center">
            <h2 className="text-2xl font-bold text-[var(--text-heading)] font-display tracking-tight">Welcome back</h2>
            <p className="text-[var(--text-secondary)] text-[14.5px] mt-2">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 flex flex-col">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-[13.5px] font-semibold text-[var(--text-body)]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className={`input w-full ${error ? 'border-[var(--status-error)] ring-1 ring-[var(--status-error)]' : ''}`}
                placeholder="name@zyops.com"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="password" 
                  className="block text-[13.5px] font-semibold text-[var(--text-body)]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`input w-full pr-12 ${error ? 'border-[var(--status-error)] ring-1 ring-[var(--status-error)]' : ''}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {error && (
               <div className="text-[var(--status-error-text)] text-[13px] font-medium mt-1 flex items-center justify-center bg-[var(--status-error-bg)] p-3 rounded-lg border border-[var(--status-error)]/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 btn-cta btn-lg w-full text-[15px] font-bold rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Mobile Footer */}
          <div className="mt-8 text-center md:hidden">
            <p className="text-[var(--text-muted)] text-[12px] font-medium">
              {"\u00A9"} 2025 ZyOps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
