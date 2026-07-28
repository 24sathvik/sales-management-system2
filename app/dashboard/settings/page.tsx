"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trophy } from "lucide-react";

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [enableGamification, setEnableGamification] = useState(true);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/system");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      return json.data;
    }
  });

  useEffect(() => {
    if (settings) {
      setEnableGamification(settings.enableGamification);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { enableGamification: boolean }) => {
      const res = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({ enableGamification });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-[var(--brand-primary)]" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" data-tour="set-intro">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-heading)] tracking-tight mb-2">System Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage global configuration options for your workspace.</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-sm)] border border-[var(--border-default)] overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[var(--text-heading)] mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--brand-gold)]" />
            Gamification & Leaderboard
          </h2>
          
          <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)]">
            <div className="pt-1">
              <input
                type="checkbox"
                id="gamification-toggle"
                checked={enableGamification}
                onChange={(e) => setEnableGamification(e.target.checked)}
                className="w-5 h-5 text-[var(--brand-primary)] rounded border-[var(--border-default)] focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="gamification-toggle" className="block font-semibold text-[var(--text-heading)] cursor-pointer">
                Enable Staff Leaderboard
              </label>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                When enabled, the dashboard will display the Team Performance module, including the staff revenue leaderboard and achievement badges. Turn this off if you prefer not to have a public performance leaderboard visible to all staff.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-app)] flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || settings?.enableGamification === enableGamification}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
