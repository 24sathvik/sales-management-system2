import { Loader2 } from "lucide-react";

export default function CustomLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-brand-forest">
      <Loader2 className="w-10 h-10 animate-spin text-brand-cream" />
    </div>
  );
}
