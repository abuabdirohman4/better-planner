"use client";
import Spinner from "@/components/ui/spinner/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex justify-center items-center min-h-[800px]">
      <Spinner size={164} />
    </div>
  );
} 