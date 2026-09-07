"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface GpaData {
  name: string;
  gpa: number;
}

export function GpaTrendChart({ data }: { data: GpaData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        No GPA data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          domain={[0, 4]}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey="gpa" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
