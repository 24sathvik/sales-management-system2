/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/store";

export function PwaInstallPrompt() {
  const setPwaPrompt = useUIStore((s) => s.setPwaPrompt);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Check if app is already installed
    window.addEventListener("appinstalled", () => {
      setPwaPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [setPwaPrompt]);

  return null;
}
