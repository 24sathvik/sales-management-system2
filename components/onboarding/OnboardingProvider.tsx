"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import "driver.js/dist/driver.css";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Only run on client, and only if user is logged in
    if (!session?.user) return;

    const startTour = async () => {
      // Check local storage first
      const hasSeen = localStorage.getItem("zyops_tour_completed");

      if (hasSeen === "true") {
        return;
      }

      // Small delay to ensure DOM is fully rendered
      setTimeout(async () => {
        const { driver } = await import("driver.js");
        const driverObj = driver({
          showProgress: true,
          steps: [
            {
              element: '.tour-sidebar',
              popover: {
                title: 'Welcome to ZyOps',
                description: 'Use this sidebar to navigate. We’ve added guided tours to every major page—just click around to explore!',
                side: "right",
                align: 'start'
              }
            }
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the tour?")) {
              driverObj.destroy();
              // Mark as seen locally
              localStorage.setItem("zyops_tour_completed", "true");
            }
          },
        });

        driverObj.drive();
      }, 1000); // 1s delay
    };

    // If it's forced from profile menu
    const handleReplay = () => {
      localStorage.removeItem("zyops_tour_completed");
      startTour();
    };

    window.addEventListener("replay-onboarding", handleReplay);
    startTour();

    return () => window.removeEventListener("replay-onboarding", handleReplay);
  }, [session]);

  return <>{children}</>;
}
