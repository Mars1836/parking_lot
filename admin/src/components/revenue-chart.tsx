"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const generateDailyData = () => {
  const hours = []
  for (let i = 0; i < 24; i++) {
    const hour = i < 10 ? `0${i}:00` : `${i}:00`
    hours.push({
      name: hour,
      revenue: Math.floor(Math.random() * 300) + 50,
    })
  }
  return hours
}

const generateWeeklyData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((day) => ({
    name: day,
    revenue: Math.floor(Math.random() * 2000) + 500,
  }))
}

const generateMonthlyData = () => {
  const data = []
  for (let i = 1; i <= 30; i++) {
    data.push({
      name: `${i}`,
      revenue: Math.floor(Math.random() * 3000) + 1000,
    })
  }
  return data
}

interface RevenueChartProps {
  timeRange: string
}

export function RevenueChart({ timeRange }: RevenueChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    if (timeRange === "today") {
      setData(generateDailyData())
    } else if (timeRange === "week") {
      setData(generateWeeklyData())
    } else {
      setData(generateMonthlyData())
    }
  }, [timeRange])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            formatter={(value: number) => [`$${value}`, "Revenue"]}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
