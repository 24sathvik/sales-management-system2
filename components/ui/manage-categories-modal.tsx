"use client";
import React, { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function ManageCategoriesModal({
  isOpen,
  onClose,
  onCategoriesUpdated
}: {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}) {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  React.useEffect(() => {
    if (isOpen) fetchCats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchCats = () => {
    setLoadingCategories(true);
    fetch("/api/invoice-categories")
      .then(res => res.json())
      .then(json => {
        const safeData = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        setCategories(safeData);
        setLoadingCategories(false);
      });
  };

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/invoice-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      if (!res.ok) throw new Error("Failed to add");
      toast.success("Category added");
      setNewCategory("");
      fetchCats();
      onCategoriesUpdated();
    } catch {
      toast.error("Error adding category");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoice-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Category deleted");
      fetchCats();
      onCategoriesUpdated();
    } catch {
      toast.error("Error deleting category");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-brand-cream w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        <div className="flex justify-between items-center p-5 border-b border-brand-border bg-white">
          <h2 className="text-xl font-bold text-brand-forest">Manage Categories</h2>
          <button onClick={onClose} className="p-1 text-brand-muted hover:bg-brand-sage hover:text-white rounded-md transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <form onSubmit={handleAdd} className="flex gap-3">
             <input
               type="text"
               value={newCategory}
               onChange={e => setNewCategory(e.target.value)}
               placeholder="New category name..."
               className="flex-1 h-10 px-3 rounded-md border border-brand-border focus:ring-2 focus:ring-brand-sage outline-none text-sm bg-white"
             />
             <button disabled={loading} type="submit" className="h-10 px-4 bg-brand-forest text-white rounded-md text-sm font-semibold hover:bg-brand-forest/90 disabled:opacity-50 min-w-[80px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add"}
             </button>
          </form>

          <div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="max-h-[300px] overflow-y-auto">
               {loadingCategories ? (
                 <div className="flex justify-center items-center h-24">
                   <Loader2 className="w-6 h-6 animate-spin text-brand-sage" />
                 </div>
               ) : categories.length === 0 ? (
                 <div className="p-4 text-center text-sm text-brand-muted">No categories exist yet.</div>
               ) : (
                 <ul className="divide-y divide-brand-border">
                   {categories.map(cat => (
                     <li key={cat.id} className="flex justify-between items-center p-3 hover:bg-brand-cream/30 transition-colors">
                       <span className="text-sm font-medium text-brand-black">{cat.name}</span>
                       <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-brand-danger hover:bg-brand-danger/10 rounded transition-colors" title="Delete Category">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
