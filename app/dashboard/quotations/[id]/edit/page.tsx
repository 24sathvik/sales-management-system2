"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QuotationForm } from "@/components/quotations/QuotationForm";

export default function EditQuotationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/quotations/${params.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          toast.error("Failed to load quotation.");
          router.push('/dashboard/quotations');
        }
      } catch (e) {
        console.error(e);
        toast.error("Error loading quotation");
        router.push('/dashboard/quotations');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [params.id, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!data) return null;

  return <QuotationForm initialData={data} quotationId={params.id} />;
}
