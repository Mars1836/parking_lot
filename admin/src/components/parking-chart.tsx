"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useServerUrl } from "@/app/context/ServerUrlContext";
import { format } from "date-fns";

interface ParkingData {
  hour: string;
  entries: number;
  exits: number;
}

interface ParkingChartProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export function ParkingChart({
  timeRange,
  onTimeRangeChange,
}: ParkingChartProps) {
  const { serverUrl } = useServerUrl();
  const [data, setData] = useState<ParkingData[]>([]);
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
          startDate = new Date(today.setDate(today.getDate() - 7));
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        default: // day
          startDate = today;
          endDate = today;
      }

      const response = await fetch(
        `${serverUrl}/api/stats/parking?start_date=${format(
          startDate,
          "yyyy-MM-dd"
        )}&end_date=${format(endDate, "yyyy-MM-dd")}&time_range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch parking stats");
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
        console.error("Error fetching parking stats:", err);
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
        <BarChart
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
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.split(":")[0]}
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
          <Bar
            dataKey="entries"
            name="Entries"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="exits"
            name="Exits"
            fill="hsl(var(--muted-foreground))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
