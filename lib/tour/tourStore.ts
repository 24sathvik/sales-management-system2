import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TourState {
  isActive: boolean;
  currentPageIndex: number;
  currentStepIndex: number;
  isCompleted: boolean;
  startTour: () => void;
  skipTour: () => void;
  nextPage: () => void;
  setStep: (step: number) => void;
  completeTour: () => void;
  resetTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      isActive: false,
      currentPageIndex: 0,
      currentStepIndex: 0,
      isCompleted: false,

      startTour: () => set({ isActive: true, currentPageIndex: 0, currentStepIndex: 0, isCompleted: false }),
      skipTour: () => set({ isActive: false, isCompleted: true }),
      nextPage: () => set((state) => ({ currentPageIndex: state.currentPageIndex + 1, currentStepIndex: 0 })),
      setStep: (step) => set({ currentStepIndex: step }),
      completeTour: () => set({ isActive: false, isCompleted: true }),
      resetTour: () => set({ isActive: false, currentPageIndex: 0, currentStepIndex: 0, isCompleted: false }),
    }),
    {
      name: 'zyops-tour-storage', // name of the item in the storage (must be unique)
    }
  )
);
