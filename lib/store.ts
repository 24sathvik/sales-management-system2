import { create } from "zustand";

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  pwaPrompt: any;
  setPwaPrompt: (prompt: any) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
  pwaPrompt: null,
  setPwaPrompt: (prompt) => set({ pwaPrompt: prompt }),
}));
