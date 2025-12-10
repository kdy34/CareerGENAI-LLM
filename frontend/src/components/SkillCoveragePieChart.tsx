"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type SkillCoveragePieChartProps = {
  strengthsCount: number;
  coreGapsCount: number;
  niceGapsCount: number;
};

const COLORS = ["#22c55e", "#ef4444", "#f97316"];

export function SkillCoveragePieChart({
  strengthsCount,
  coreGapsCount,
  niceGapsCount,
}: SkillCoveragePieChartProps) {
  const total = strengthsCount + coreGapsCount + niceGapsCount;

  const data =
    total === 0
      ? [{ name: "No data", value: 1 }]
      : [
          { name: "Strengths", value: strengthsCount },
          { name: "Core gaps", value: coreGapsCount },
          { name: "Nice-to-have gaps", value: niceGapsCount },
        ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            dataKey="value"
            data={data}
            innerRadius={40}
            outerRadius={70}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: "#1e293b",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 11, color: "#cbd5f5" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
