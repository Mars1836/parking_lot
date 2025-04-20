"use client";

import { useState, useEffect } from "react";
import {
  Car,
  CarFront,
  Clock,
  CreditCard,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParkingChart } from "@/components/parking-chart";
import { RevenueChart } from "@/components/revenue-chart";
import { usePathname } from "next/navigation";
import { useServerUrl } from "@/app/context/ServerUrlContext";

interface DashboardStats {
  current_vehicles: number;
  today_traffic: number;
  today_revenue: number;
  avg_duration: number;
  recent_transactions: {
    id: number;
    plate_number: string;
    amount: number;
    payment_method: string;
    paid_at: string;
  }[];
  recent_activity: {
    id: number;
    plate_number: string;
    action: string;
    time: string;
  }[];
}

export default function DashboardPage() {
  const { serverUrl } = useServerUrl();
  const [parkingTimeRange, setParkingTimeRange] = useState("day");
  const [revenueTimeRange, setRevenueTimeRange] = useState("day");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
  }, [serverUrl]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }
    if (!serverUrl) {
      return;
    }
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3000);
    return () => clearInterval(interval);
  }, [pathname, serverUrl]);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, sessionsRes, transactionsRes] = await Promise.all([
        fetch(`${serverUrl}/api/vehicles/summary`),
        fetch(`${serverUrl}/parking-sessions`),
        fetch(`${serverUrl}/transactions`),
      ]);

      if (!vehiclesRes.ok || !sessionsRes.ok || !transactionsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [vehicles, sessions, transactions] = await Promise.all([
        vehiclesRes.json(),
        sessionsRes.json(),
        transactionsRes.json(),
      ]);

      // Calculate current vehicles (vehicles with active sessions)
      const currentVehicles = vehicles.filter(
        (v: any) => v.status === "in"
      ).length;

      // Calculate today's traffic
      const today = new Date().toISOString().split("T")[0];
      const todayTraffic = sessions.filter((s: any) =>
        s.checkin_time.startsWith(today)
      ).length;

      // Calculate today's revenue
      const todayRevenue = transactions
        .filter((t: any) => t.paid_at.startsWith(today))
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Calculate average duration
      const completedSessions = sessions.filter((s: any) => s.duration_hours);
      const avgDuration =
        completedSessions.length > 0
          ? completedSessions.reduce(
              (sum: number, s: any) => sum + s.duration_hours,
              0
            ) / completedSessions.length
          : 0;

      // Get recent transactions
      const recentTransactions = transactions.slice(0, 4).map((t: any) => ({
        id: t.id,
        plate_number: t.plate_number,
        amount: t.amount,
        payment_method: t.payment_method,
        paid_at: t.paid_at,
      }));

      // Get recent activity
      const recentActivity = sessions.slice(0, 4).map((s: any) => ({
        id: s.id,
        plate_number: s.plate_number,
        action: s.checkout_time ? "Exit" : "Entry",
        time: s.checkout_time || s.checkin_time,
      }));

      setStats({
        current_vehicles: currentVehicles,
        today_traffic: todayTraffic,
        today_revenue: todayRevenue,
        avg_duration: avgDuration,
        recent_transactions: recentTransactions,
        recent_activity: recentActivity,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your parking management system
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Current Vehicles
            </CardTitle>
            <CarFront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.current_vehicles || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently parked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Traffic
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {stats?.today_traffic || 0}
              </div>
              <div className="text-sm text-muted-foreground">vehicles</div>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Today's entries</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.today_revenue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Today's total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_duration.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average parking time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Parking Activity</CardTitle>
              <CardDescription>
                Hourly vehicle entries and exits
              </CardDescription>
            </div>
            <Tabs
              defaultValue="day"
              value={parkingTimeRange}
              onValueChange={setParkingTimeRange}
            >
              <TabsList className="grid grid-cols-2 h-8">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ParkingChart
              timeRange={parkingTimeRange}
              onTimeRangeChange={setParkingTimeRange}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>
                Revenue breakdown by time period
              </CardDescription>
            </div>
            <Tabs
              defaultValue="day"
              value={revenueTimeRange}
              onValueChange={setRevenueTimeRange}
            >
              <TabsList className="grid grid-cols-2 h-8">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <RevenueChart
              timeRange={revenueTimeRange}
              onTimeRangeChange={setRevenueTimeRange}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </div>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      Transaction #{transaction.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.paid_at).toLocaleTimeString()} -{" "}
                      {transaction.payment_method}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest parking entries and exits
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      activity.action === "Entry"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {activity.action === "Entry" ? (
                      <CarFront className="h-4 w-4 text-green-600" />
                    ) : (
                      <Car className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      Vehicle {activity.action} - {activity.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="font-medium">{activity.action}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
