"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type SkillSummaryChartProps = {
  strengthsCount: number;
  coreGapsCount: number;
  niceGapsCount: number;
};

export function SkillSummaryChart({
  strengthsCount,
  coreGapsCount,
  niceGapsCount,
}: SkillSummaryChartProps) {
  const data = [
    { name: "Strengths", value: strengthsCount },
    { name: "Core gaps", value: coreGapsCount },
    { name: "Nice-to-have gaps", value: niceGapsCount },
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#cbd5f5" tick={{ fontSize: 11 }} />
          <YAxis stroke="#cbd5f5" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: "#1e293b",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
