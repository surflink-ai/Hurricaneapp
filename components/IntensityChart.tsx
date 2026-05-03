"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import type { Observation } from "@/lib/types";
import { CAT_REFERENCE_KT } from "@/lib/saffir";

interface ChartDatum {
  t: number;
  date: string;
  windKt: number;
  pressureMb: number | null;
}

function buildData(obs: ReadonlyArray<Observation>): ChartDatum[] {
  const t0 = obs[0] ? new Date(obs[0].iso).getTime() : 0;
  return obs.map((o) => ({
    t: (new Date(o.iso).getTime() - t0) / 3_600_000,
    date: o.iso,
    windKt: o.windKt,
    pressureMb: o.pressureMb
  }));
}

export function IntensityChart({
  observations,
  height = 220,
  showPressure = true
}: {
  observations: ReadonlyArray<Observation>;
  height?: number;
  showPressure?: boolean;
}) {
  const data = useMemo(() => buildData(observations), [observations]);
  const minMb = useMemo(() => {
    let m: number | null = null;
    for (const d of data) if (d.pressureMb != null && (m == null || d.pressureMb < m)) m = d.pressureMb;
    return m == null ? 920 : Math.floor(m / 5) * 5;
  }, [data]);

  return (
    <div className="border border-rule bg-paper p-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 14, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#ebe7dc" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "#3a3a36", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
            stroke="#1a1a17"
            tickFormatter={(v: number) => `+${Math.round(v)}h`}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="kt"
            domain={[0, "dataMax + 10"]}
            tick={{ fill: "#3a3a36", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
            stroke="#1a1a17"
            width={36}
            label={{ value: "kt", angle: -90, position: "insideLeft", offset: 10, fill: "#3a3a36", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
          />
          {showPressure && (
            <YAxis
              yAxisId="mb"
              orientation="right"
              domain={[minMb, 1015]}
              reversed
              tick={{ fill: "#9a2a1f", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
              stroke="#9a2a1f"
              width={42}
              label={{ value: "mb", angle: -90, position: "insideRight", offset: 10, fill: "#9a2a1f", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
            />
          )}
          {CAT_REFERENCE_KT.map((kt) => (
            <ReferenceLine
              key={kt}
              y={kt}
              yAxisId="kt"
              stroke="#3a3a36"
              strokeDasharray="2 3"
              strokeOpacity={0.45}
              label={{
                value: `${kt}`,
                position: "right",
                fill: "#3a3a36",
                fontSize: 9,
                fontFamily: "var(--font-jetbrains)"
              }}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: "#fdfdfb",
              border: "1px solid #1a1a17",
              borderRadius: 0,
              fontFamily: "var(--font-jetbrains)",
              fontSize: 11,
              color: "#0a0a08",
              padding: "6px 8px"
            }}
            labelFormatter={(v: number) => `+${Math.round(v)}h from genesis`}
            formatter={(value: unknown, name: string) => {
              if (name === "windKt") return [`${value} kt`, "Wind"];
              if (name === "pressureMb") return [`${value} mb`, "Pressure"];
              return [String(value), name];
            }}
          />
          <Line
            yAxisId="kt"
            type="monotone"
            dataKey="windKt"
            stroke="#0a0a08"
            strokeWidth={1.4}
            dot={false}
            isAnimationActive={false}
          />
          {showPressure && (
            <Line
              yAxisId="mb"
              type="monotone"
              dataKey="pressureMb"
              stroke="#9a2a1f"
              strokeWidth={1.2}
              strokeDasharray="3 2"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
