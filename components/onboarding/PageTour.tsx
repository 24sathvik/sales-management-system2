"use client";

import { useEffect, useState } from "react";
import "driver.js/dist/driver.css";

export interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
}

interface PageTourProps {
  tourId: string;
  steps: TourStep[];
}

export function PageTour({ tourId, steps }: PageTourProps) {
  useEffect(() => {
    let driverObj: any = null;

    const startTour = async () => {
      const hasSeen = localStorage.getItem(`zyops_tour_${tourId}`);
      if (hasSeen === "true") return;

      const { driver } = await import("driver.js");
      driverObj = driver({
        showProgress: true,
        steps,
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip this tour?")) {
            driverObj.destroy();
            localStorage.setItem(`zyops_tour_${tourId}`, "true");
          }
        }
      });
      
      // Delay so elements have time to mount
      setTimeout(() => {
        driverObj?.drive();
      }, 500);
    };

    const handleReplay = () => {
      localStorage.removeItem(`zyops_tour_${tourId}`);
      startTour();
    };

    window.addEventListener("replay-onboarding", handleReplay);
    startTour();

    return () => {
      window.removeEventListener("replay-onboarding", handleReplay);
      if (driverObj) {
        // Just destroy instance if unmounted
        driverObj.destroy();
      }
    };
  }, [tourId, steps]);

  return null;
}
