"use client";
import { useState, useEffect } from "react";
import { CalendarIcon, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  session_id: number;
  plate_number: string;
  amount: number;
  payment_method: string;
  paid_at: string;
}

export default function TransactionsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeRange, setTimeRange] = useState("day");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStats, setPaymentStats] = useState({
    cash: 0,
    card: 0,
    "e-wallet": 0,
  });

  useEffect(() => {
    if (date) {
      fetchTransactions(date, timeRange);
    }
  }, [date, timeRange]);

  const fetchTransactions = async (date: Date, timeRange: string) => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/transactions";
      const params = new URLSearchParams();

      // Xử lý thời gian theo timeRange
      let startDate = date;
      let endDate = date;

      switch (timeRange) {
        case "week":
          startDate = new Date(date.setDate(date.getDate() - 7));
          break;
        case "month":
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          break;
        default: // day
          startDate = date;
          endDate = date;
      }

      params.append("start_date", format(startDate, "yyyy-MM-dd"));
      params.append("end_date", format(endDate, "yyyy-MM-dd"));

      console.log("Fetching transactions from:", `${url}?${params.toString()}`);
      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transactions: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Received transactions:", data);
      setTransactions(data);
      calculatePaymentStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentStats = (transactions: Transaction[]) => {
    const stats = {
      cash: 0,
      card: 0,
      "e-wallet": 0,
    };

    transactions.forEach((transaction) => {
      const method = transaction.payment_method.toLowerCase();
      if (method in stats) {
        stats[method as keyof typeof stats]++;
      }
    });

    const total = transactions.length;
    if (total > 0) {
      Object.keys(stats).forEach((key) => {
        stats[key as keyof typeof stats] = Math.round(
          (stats[key as keyof typeof stats] / total) * 100
        );
      });
    }

    setPaymentStats(stats);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/vehicles/export");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();
      const csvContent = convertToCSV(data);
      downloadCSV(csvContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = [
      "ID",
      "Plate Number",
      "Total Visits",
      "Check-in Time",
      "Check-out Time",
      "Payment Method",
      "Amount",
    ];
    const rows = data.flatMap((vehicle) =>
      vehicle.sessions.flatMap((session: any) =>
        session.transactions.map((transaction: any) => [
          vehicle.id,
          vehicle.plate_number,
          vehicle.total_visits,
          session.checkin_time,
          session.checkout_time || "",
          transaction.payment_method,
          transaction.amount,
        ])
      )
    );

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate total revenue
  const totalRevenue = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          View and manage all payment transactions
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Revenue breakdown by time period
              </CardDescription>
            </div>
            <Tabs
              defaultValue="day"
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  Revenue for selected period
                </p>
                <h2 className="text-4xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </h2>
                <p className="text-sm mt-2 text-green-500">
                  {transactions.length} transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                  <span>Credit Card</span>
                </div>
                <span className="font-medium">{paymentStats.card}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                  <span>Cash</span>
                </div>
                <span className="font-medium">{paymentStats.cash}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  <span>E-Wallet</span>
                </div>
                <span className="font-medium">{paymentStats["e-wallet"]}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Total: ${totalRevenue.toFixed(2)} from {transactions.length}{" "}
                transactions
              </CardDescription>
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p>Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p>No transactions found for the selected date</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.id}
                      </TableCell>
                      <TableCell>{transaction.session_id}</TableCell>
                      <TableCell>{transaction.plate_number}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(transaction.paid_at), "PPpp")}
                      </TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
