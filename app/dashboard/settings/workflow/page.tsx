"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, GripVertical, Trash2, Save, MoveUp, MoveDown, Circle } from "lucide-react";
import * as Icons from "lucide-react";

const AVAILABLE_ICONS = ["PackageOpen", "PenTool", "Printer", "CheckCircle2", "Truck", "IndianRupee", "Circle", "Star", "Settings", "Briefcase", "FileText", "Layout"];

export default function WorkflowSettingsPage() {
  const queryClient = useQueryClient();
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  
  // Local state for edits
  const [itemsEdit, setItemsEdit] = useState<any[]>([]);
  const [stageEdit, setStageEdit] = useState<{ name: string; isActive: boolean; color: string; icon: string; order: number } | null>(null);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["workflow"],
    queryFn: async () => {
      const res = await fetch("/api/settings/workflow");
      if (!res.ok) throw new Error("Failed to fetch workflow stages");
      const json = await res.json();
      return json.data;
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/settings/workflow/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    }
  });

  const createStageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/settings/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create stage");
      return res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
      setActiveStageId(res.data.id);
      toast.success("Stage created");
    },
    onError: (err) => toast.error(err.message)
  });

  const syncItemsMutation = useMutation({
    mutationFn: async ({ id, items }: { id: string, items: any[] }) => {
      const res = await fetch(`/api/settings/workflow/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to sync items");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Saved successfully");
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSelectStage = (stage: any) => {
    setActiveStageId(stage.id);
    setStageEdit({ name: stage.name, isActive: stage.isActive, color: stage.color || "#C77D2E", icon: stage.icon || "Circle", order: stage.order });
    const items = stage.checklistTemplate?.items || [];
    setItemsEdit(items.map((i: any) => ({ ...i }))); // deep copy
  };

  const handleCreateStage = () => {
    const newOrder = stages.length > 0 ? Math.max(...stages.map((s: any) => s.order)) + 10 : 10;
    createStageMutation.mutate({ name: "New Stage", order: newOrder });
  };

  const handleSave = async () => {
    if (!activeStageId) return;
    
    try {
      const activeStage = stages.find((s: any) => s.id === activeStageId);
      let didUpdateMeta = false;
      if (stageEdit && (
        stageEdit.name !== activeStage.name || 
        stageEdit.isActive !== activeStage.isActive ||
        stageEdit.color !== activeStage.color ||
        stageEdit.icon !== activeStage.icon ||
        stageEdit.order !== activeStage.order
      )) {
        await updateStageMutation.mutateAsync({ id: activeStageId, data: stageEdit });
        didUpdateMeta = true;
      }

      // Re-assign order sequentially
      const itemsToSave = itemsEdit.map((item, idx) => ({
        id: item.id?.startsWith("new_") ? undefined : item.id, // strip temp IDs
        label: item.label,
        isRequired: item.isRequired,
        order: idx
      }));

      await syncItemsMutation.mutateAsync({ id: activeStageId, items: itemsToSave });
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    setItemsEdit([...itemsEdit, { id: `new_${Date.now()}`, label: "New Item", isRequired: true, order: itemsEdit.length }]);
  };

  const updateItem = (index: number, changes: any) => {
    const updated = [...itemsEdit];
    updated[index] = { ...updated[index], ...changes };
    setItemsEdit(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...itemsEdit];
    updated.splice(index, 1);
    setItemsEdit(updated);
  };

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const updated = [...itemsEdit];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setItemsEdit(updated);
  };

  const moveItemDown = (index: number) => {
    if (index === itemsEdit.length - 1) return;
    const updated = [...itemsEdit];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setItemsEdit(updated);
  };

  const moveStageUp = async (e: React.MouseEvent, stage: any, index: number) => {
    e.stopPropagation();
    if (index === 0) return;
    const prevStage = stages[index - 1];
    await updateStageMutation.mutateAsync({ id: stage.id, data: { order: prevStage.order } });
    await updateStageMutation.mutateAsync({ id: prevStage.id, data: { order: stage.order } });
    queryClient.invalidateQueries({ queryKey: ["workflow"] });
  };

  const moveStageDown = async (e: React.MouseEvent, stage: any, index: number) => {
    e.stopPropagation();
    if (index === stages.length - 1) return;
    const nextStage = stages[index + 1];
    await updateStageMutation.mutateAsync({ id: stage.id, data: { order: nextStage.order } });
    await updateStageMutation.mutateAsync({ id: nextStage.id, data: { order: stage.order } });
    queryClient.invalidateQueries({ queryKey: ["workflow"] });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-brand-forest" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto" data-tour="wf-pipeline">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Workflow Settings</h1>
      <p className="text-slate-500 mb-8 max-w-2xl">Configure the pipeline stages and their required quality assurance checklists. These stages dictate the flow in your Kanban board.</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-1/3 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
              <span>Pipeline Stages</span>
              <button onClick={handleCreateStage} className="p-1 hover:bg-slate-200 rounded text-brand-forest">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {stages.map((stage: any, idx: number) => {
                const IconComp = (Icons as any)[stage.icon || "Circle"] || Circle;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleSelectStage(stage)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                      activeStageId === stage.id ? "bg-brand-sage/10 border-l-4 border-brand-forest" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex flex-col gap-1 shrink-0">
                      <div onClick={(e) => moveStageUp(e, stage, idx)} className={`p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}><MoveUp className="w-3 h-3" /></div>
                      <div onClick={(e) => moveStageDown(e, stage, idx)} className={`p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 ${idx === stages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}><MoveDown className="w-3 h-3" /></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium flex items-center gap-2 ${activeStageId === stage.id ? 'text-brand-forest' : 'text-slate-800'}`}>
                        <IconComp className="w-4 h-4" style={{ color: stage.color }} />
                        <span className="truncate">{stage.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {stage.checklistTemplate?.items?.length || 0} checks
                      </div>
                    </div>
                    {!stage.isActive && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Inactive</span>
                    )}
                  </button>
                );
              })}
              {stages.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">No stages configured.</div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="w-full lg:w-2/3">
          {activeStageId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Stage Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-brand-forest focus:outline-none font-medium text-slate-800"
                    value={stageEdit?.name || ""}
                    onChange={(e) => setStageEdit({ ...stageEdit!, name: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Color</label>
                    <input
                      type="color"
                      className="h-10 w-16 p-1 bg-white border border-slate-300 rounded cursor-pointer"
                      value={stageEdit?.color || "#C77D2E"}
                      onChange={(e) => setStageEdit({ ...stageEdit!, color: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Icon</label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      value={stageEdit?.icon || "Circle"}
                      onChange={(e) => setStageEdit({ ...stageEdit!, icon: e.target.value })}
                    >
                      {AVAILABLE_ICONS.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={stageEdit?.isActive ?? false}
                    onChange={(e) => setStageEdit({ ...stageEdit!, isActive: e.target.checked })}
                    className="rounded text-brand-forest focus:ring-brand-forest w-5 h-5"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">Active Stage</label>
                  <span className="text-xs text-slate-500 ml-2">Inactive stages won't accept new cards in the Kanban board.</span>
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center border-t border-slate-200 pt-6">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Checklist Items</h3>
                  <p className="text-xs text-slate-500">Required items block cards from moving to the next stage.</p>
                </div>
                <button
                  onClick={addItem}
                  className="flex items-center text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {itemsEdit.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-400 text-sm border-2 border-dashed border-slate-200">
                    No items in this checklist yet.
                  </div>
                ) : (
                  itemsEdit.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg shadow-sm group">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveItemUp(idx)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><MoveUp className="w-4 h-4" /></button>
                        <button onClick={() => moveItemDown(idx)} disabled={idx === itemsEdit.length - 1} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><MoveDown className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-4">
                        <input
                          type="text"
                          className="flex-1 p-2 border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-forest rounded text-sm font-medium text-slate-800"
                          value={item.label}
                          onChange={(e) => updateItem(idx, { label: e.target.value })}
                          placeholder="e.g., Verify dimensions with client"
                        />
                        <label className="flex items-center gap-2 cursor-pointer shrink-0 min-w-[100px]">
                          <input 
                            type="checkbox" 
                            checked={item.isRequired}
                            onChange={(e) => updateItem(idx, { isRequired: e.target.checked })}
                            className="rounded text-brand-forest focus:ring-brand-forest w-4 h-4"
                          />
                          <span className="text-sm font-medium text-slate-600 select-none">Required</span>
                        </label>
                      </div>

                      <button 
                        onClick={() => removeItem(idx)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  disabled={syncItemsMutation.isPending || updateStageMutation.isPending}
                  className="bg-brand-forest hover:bg-brand-forest/90 text-white px-6 py-2.5 rounded-lg font-bold flex items-center shadow-md transition-all disabled:opacity-70"
                >
                  {(syncItemsMutation.isPending || updateStageMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Configuration
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center h-[500px] text-slate-400">
              <GripVertical className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">Select a stage to configure</p>
              <p className="text-sm mt-1">Changes here will apply to all future jobs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
