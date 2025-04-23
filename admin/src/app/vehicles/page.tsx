"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Car,
  Clock,
  Download,
  History,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerUrl } from "@/app/context/ServerUrlContext";
import { format, parseISO } from "date-fns";

interface Vehicle {
  id: string;
  plate_number: string;
  parking_count: number;
  last_entry: string;
  time_since: string;
  status: "in" | "out";
}

interface ParkingSession {
  id: string;
  entry_time: string;
  exit_time: string | null;
  duration: string;
  fee: string;
}

type SortField =
  | "plate_number"
  | "id"
  | "parking_count"
  | "last_entry"
  | "status";
type SortOrder = "asc" | "desc";

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [parkingHistory, setParkingHistory] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("plate_number");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { serverUrl } = useServerUrl();
  useEffect(() => {
    if (!serverUrl) {
      return;
    }
    fetchVehicles();
  }, [serverUrl]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/api/vehicles/summary`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchVehicles();
      return;
    }
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.plate_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        vehicle.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setVehicles(filtered);
  };

  const handleViewHistory = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      const vehicleId = vehicle.id.substring(1); // Remove 'V' prefix
      const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}/history`
      );
      if (!response.ok) throw new Error("Failed to fetch vehicle history");
      const data = await response.json();
      setParkingHistory(data);
      setIsHistoryDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/vehicles/export");
      if (!response.ok) throw new Error("Failed to export data");
      const data = await response.json();

      // Create and download CSV file
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Plate Number,Total Visits,Last Entry,Status\n" +
        data
          .map(
            (v: any) =>
              `${v.plate_number},${v.total_visits},${v.last_entry || "N/A"},${
                v.status
              }`
          )
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "vehicles_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;

    switch (sortField) {
      case "plate_number":
        return multiplier * a.plate_number.localeCompare(b.plate_number);
      case "id":
        return multiplier * a.id.localeCompare(b.id);
      case "parking_count":
        return multiplier * (a.parking_count - b.parking_count);
      case "last_entry":
        if (!a.last_entry && !b.last_entry) return 0;
        if (!a.last_entry) return 1;
        if (!b.last_entry) return -1;
        return (
          multiplier * new Date(a.last_entry).getTime() -
          new Date(b.last_entry).getTime()
        );
      case "status":
        return (
          multiplier * (a.status === "in" ? 1 : 0) - (b.status === "in" ? 1 : 0)
        );
      default:
        return 0;
    }
  });

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm:ss");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        <p className="text-muted-foreground">
          Manage and track all vehicles in the system
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-sm items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by plate number or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle>All Vehicles</CardTitle>
              <CardDescription>
                Total of {vehicles.length} vehicles in the system
              </CardDescription>
            </div>
            <Car className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("plate_number")}
                  >
                    <div className="flex items-center gap-1">
                      Plate Number
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "plate_number" && (
                        <span className="text-xs text-muted-foreground">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "id" && (
                        <span className="text-xs text-muted-foreground">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("parking_count")}
                  >
                    <div className="flex items-center gap-1">
                      Parking Count
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "parking_count" && (
                        <span className="text-xs text-muted-foreground">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("last_entry")}
                  >
                    <div className="flex items-center gap-1">
                      Last Parked
                      <ArrowUpDown className="h-4 w-4" />
                      {sortField === "last_entry" && (
                        <span className="text-xs text-muted-foreground">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.plate_number}
                    </TableCell>
                    <TableCell>{vehicle.id}</TableCell>
                    <TableCell>{vehicle.parking_count}</TableCell>
                    <TableCell>
                      {vehicle.status === "in" ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Currently Parked
                        </Badge>
                      ) : (
                        vehicle.time_since
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(vehicle)}
                      >
                        <History className="mr-2 h-4 w-4" />
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Parking History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Parking History</DialogTitle>
            <DialogDescription>
              {selectedVehicle && (
                <span>
                  Vehicle: {selectedVehicle.plate_number} ({selectedVehicle.id})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parkingHistory.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.id}</TableCell>
                    <TableCell>{formatDateTime(session.entry_time)}</TableCell>
                    <TableCell>{formatDateTime(session.exit_time)}</TableCell>
                    <TableCell>{session.duration}</TableCell>
                    <TableCell>{session.fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Showing {parkingHistory.length} parking sessions
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
