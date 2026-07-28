import type { Metadata } from "next";
import { Manrope, Fraunces, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ZyOps",
  description: "Generic operations management platform by ZyOps",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZyOps",
  },
};

export const viewport = {
  themeColor: "#14161C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans text-body`}>
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-body)',
                fontFamily: 'var(--font-body)',
                fontSize: '13.5px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-md)'
              },
              classNames: {
                success: 'border-l-4 !border-l-[var(--status-success)]',
                error: 'border-l-4 !border-l-[var(--status-error)]',
                warning: 'border-l-4 !border-l-[var(--status-warning)]',
                info: 'border-l-4 !border-l-[var(--status-info)]'
              }
            }}
          />
        </Providers>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
