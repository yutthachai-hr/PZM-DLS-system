"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "./ui";

export function PrintButton({ auto = true }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 600); // let fonts load
    return () => clearTimeout(t);
  }, [auto]);
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="size-4" /> พิมพ์ / PDF
    </Button>
  );
}
