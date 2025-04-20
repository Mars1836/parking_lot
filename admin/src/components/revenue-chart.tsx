"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useServerUrl } from "@/app/context/ServerUrlContext";
import { format, subDays, subWeeks, startOfMonth, endOfMonth } from "date-fns";

interface RevenueData {
  name: string;
  revenue: number;
}

interface RevenueChartProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export function RevenueChart({
  timeRange,
  onTimeRangeChange,
}: RevenueChartProps) {
  const { serverUrl } = useServerUrl();
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (!serverUrl) {
      return;
    }
    const interval = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [serverUrl, timeRange]);

  const fetchData = async () => {
    try {
      const today = new Date();
      let startDate = today;
      let endDate = today;

      switch (timeRange) {
        case "week":
          startDate = subWeeks(today, 1);
          break;
        case "month":
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
          break;
        default: // day
          startDate = today;
          endDate = today;
      }

      const response = await fetch(
        `${serverUrl}/api/stats/revenue?start_date=${format(
          startDate,
          "yyyy-MM-dd"
        )}&end_date=${format(endDate, "yyyy-MM-dd")}&time_range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch revenue stats");
      }

      const result = await response.json();

      // Kiểm tra xem dữ liệu có thay đổi không
      const hasChanged = JSON.stringify(result) !== JSON.stringify(data);
      if (hasChanged) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      if (errorMessage !== error) {
        setError(errorMessage);
        console.error("Error fetching revenue stats:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{ padding: 0 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
