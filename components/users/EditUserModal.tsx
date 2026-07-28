"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "USER"]),
});

type FormValues = z.infer<typeof schema>;

export function EditUserModal({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; name: string; email: string; role: "ADMIN" | "USER"; };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name, role: user?.role },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, role: user.role });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const previous = queryClient.getQueryData<any[]>(["users"]);
      if (previous) {
        queryClient.setQueryData<any[]>(["users"], old => {
          if (!old) return old;
          return old.map(u => u.id === user.id ? { ...u, ...data } : u);
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("User updated successfully.");
      onOpenChange(false);
    },
    onError: (err: Error, variables, context: any) => {
      toast.error(err.message || "Failed to update user.");
      if (context?.previous) {
        queryClient.setQueryData(["users"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-lg border">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Edit User: {user.email}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage"
            >
              <option value="USER">User (Sales/Staff)</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-forest rounded-md hover:bg-brand-forest/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
