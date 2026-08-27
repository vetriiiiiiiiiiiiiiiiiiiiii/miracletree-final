"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/money";

/**
 * Daily revenue. Deliberately one series and one colour — a dashboard chart
 * earns its place by being read in a second, not by being impressive.
 */
export function RevenueChart({
  data,
}: {
  data: { date: string; revenue: number }[];
}) {
  const empty = data.every((point) => point.revenue === 0);

  return (
    <div className="h-64 w-full" role="img" aria-label="Daily revenue over the last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f9a5f" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2f9a5f" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#ffffff" strokeOpacity={0.06} vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            }
            tick={{ fill: "#b3a992", fontSize: 11 }}
            axisLine={{ stroke: "#ffffff", strokeOpacity: 0.1 }}
            tickLine={false}
            minTickGap={28}
          />

          <YAxis
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
            tick={{ fill: "#b3a992", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            domain={empty ? [0, 100] : ["auto", "auto"]}
          />

          <Tooltip
            cursor={{ stroke: "#d9bc6a", strokeOpacity: 0.4 }}
            contentStyle={{
              background: "#101711",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 0,
              fontSize: 12,
              color: "#f4f1e8",
            }}
            labelFormatter={(value: string) =>
              new Date(value).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })
            }
            formatter={(value: number) => [formatPrice(Math.round(value * 100)), "Revenue"]}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2f9a5f"
            strokeWidth={1.6}
            fill="url(#revenue-fill)"
            dot={false}
            activeDot={{ r: 3.5, fill: "#d9bc6a", stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
