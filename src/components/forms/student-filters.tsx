"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function StudentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = searchParams.get("q") || "";
  const risk = searchParams.get("risk") || "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/lecturer/students?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <select
        value={risk}
        onChange={(e) => updateParam("risk", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All Risk Levels</option>
        <option value="HIGH">High Risk</option>
        <option value="MEDIUM">Medium Risk</option>
        <option value="LOW">Low Risk</option>
      </select>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          defaultValue={q}
          onChange={(e) => {
            const value = e.target.value;
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
              updateParam("q", value);
            }, 300);
          }}
          className="pl-9 w-full sm:w-64"
        />
      </div>
    </div>
  );
}
