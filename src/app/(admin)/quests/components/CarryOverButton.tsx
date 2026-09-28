"use client";

import { History } from "lucide-react";
import Button from "@/components/ui/button/Button";

// Di mobile cuma ikon (teks tetap terbaca screen reader) supaya header tidak patah dua baris.
export default function CarryOverButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      sizeClassName="px-3 sm:px-4 py-2 text-md"
      className="whitespace-nowrap"
      data-testid="carry-over-open-btn"
    >
      <History className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Ambil dari quarter sebelumnya</span>
    </Button>
  );
}
