"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTourStore } from "@/lib/tour/tourStore";
import { TOUR_PAGES } from "@/lib/tour/tourConfig";
import "driver.js/dist/driver.css";

export function TourController() {
  const pathname = usePathname();
  const router = useRouter();
  
  const { isActive, currentPageIndex, isCompleted, completeTour, nextPage, startTour } = useTourStore();
  const hasTriggeredRef = useRef(false);
  const driverInstanceRef = useRef<any>(null);

  // Initial trigger logic on mount
  useEffect(() => {
    const legacyCompleted = localStorage.getItem("zyops_tour_completed");
    if (legacyCompleted === "true" && !isCompleted) {
      completeTour();
      return;
    }
    
    // Auto-start if not completed and not active on first load
    if (!isCompleted && !isActive && legacyCompleted !== "true") {
      startTour();
    }
  }, []);

  // Main tour progression logic
  useEffect(() => {
    if (!isActive || isCompleted) return;
    
    const currentPage = TOUR_PAGES[currentPageIndex];
    if (!currentPage) {
      completeTour();
      return;
    }

    // Wait until we are actually on the correct route
    if (pathname !== currentPage.route) {
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const startPageDriver = async () => {
      const { driver } = await import("driver.js");
      
      const isLastPage = currentPageIndex === TOUR_PAGES.length - 1;
      
      const mappedSteps = currentPage.steps.map((step, idx) => {
        const isLastStep = idx === currentPage.steps.length - 1;
        let nextBtnText = "Next &rarr;";
        
        if (isLastStep) {
           if (isLastPage) {
             nextBtnText = "Finish Tour";
           } else {
             const nextPg = TOUR_PAGES[currentPageIndex + 1];
             nextBtnText = `Next: ${nextPg.label} &rarr;`;
           }
        }

        return {
          element: step.target,
          popover: {
            title: step.title,
            description: `<div class="mb-3">${step.content}</div>
                          <div class="text-xs text-muted-foreground font-semibold mt-3 pt-2 border-t border-border">
                            Page ${currentPageIndex + 1} of ${TOUR_PAGES.length} &mdash; ${currentPage.label}, Step ${idx + 1} of ${currentPage.steps.length}
                          </div>`,
            nextBtnText,
            doneBtnText: nextBtnText,
          }
        };
      });

      driverInstanceRef.current = driver({
        showProgress: false, 
        allowClose: true, 
        steps: mappedSteps,
        onDestroyStarted: () => {
          // If the user tries to exit via X or Escape
          if (driverInstanceRef.current && !driverInstanceRef.current.hasNextStep()) {
             // Let it destroy if they are on the last step (handled by onNextClick normally, but just in case)
             driverInstanceRef.current.destroy();
          } else {
             if (confirm("Are you sure you want to skip the rest of the tour?")) {
               driverInstanceRef.current.destroy();
               completeTour();
               localStorage.setItem("zyops_tour_completed", "true");
             }
          }
        },
        onNextClick: () => {
           if (!driverInstanceRef.current) return;
           
           const isLastStepOfPage = !driverInstanceRef.current.hasNextStep();
           if (isLastStepOfPage) {
             driverInstanceRef.current.destroy();
             
             if (isLastPage) {
                completeTour();
                localStorage.setItem("zyops_tour_completed", "true");
             } else {
                const nextPg = TOUR_PAGES[currentPageIndex + 1];
                nextPage(); // Advances store state
                router.push(nextPg.route);
             }
           } else {
             driverInstanceRef.current.moveNext();
           }
        }
      });
      
      setTimeout(() => {
        if (isActive && !isCompleted && pathname === currentPage.route) {
          driverInstanceRef.current?.drive();
        }
      }, 500);
    };

    startPageDriver();

    return () => {
       hasTriggeredRef.current = false;
       if (driverInstanceRef.current) {
          driverInstanceRef.current.destroy();
       }
    };
  }, [isActive, isCompleted, pathname, currentPageIndex, completeTour, nextPage, router]);

  return null;
}
