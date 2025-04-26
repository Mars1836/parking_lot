"use client";

import { useState, useEffect } from "react";
import { Car, Clock, Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db, onValue, ref } from "@/app/lib/firebase";

interface Vehicle {
  entryTime: string;
  imageSrc: string;
  licensePlate: string;
  rfid: string;
  exitTime: string;
}

// Mock data - in a real application, this would come from an API
const AVAILABLE_SPACES = 20;

export default function ParkingDashboard() {
  const [parkingVehicles, setParkingVehicles] = useState<Vehicle[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [price, setPrice] = useState(1);
  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const vehicleRef = ref(db, "vehicles");
    const vehicleSub = onValue(vehicleRef, (snapshot) => {
      if (snapshot.exists()) {
        const vehicles = Object.values(snapshot.val()).reverse() as Vehicle[];
        setParkingVehicles(
          vehicles.filter((v) => {
            return !v.exitTime;
          })
        );
        setVehicles(vehicles);
      }
    });
    const priceRef = ref(db, "price");
    const priceSub = onValue(priceRef, (snapshot) => {
      if (snapshot.exists()) {
        const price = snapshot.val();
        console.log(price);
        setPrice(price);
      }
    });
    return () => {
      vehicleSub();
      priceSub();
    };
  }, []);
  // Calculate available spaces
  const availableSpaces = AVAILABLE_SPACES - parkingVehicles.length;
  const occupancyPercentage = (parkingVehicles.length / AVAILABLE_SPACES) * 100;

  // Format currency in VND
  const formatCurrency = (amount: number) => {
    return amount + " $";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bãi Đỗ Xe Thông Minh
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Car className="mr-2 h-5 w-5 text-blue-500" />
              Xe Đã Gửi
            </CardTitle>
            <CardDescription>Số lượng xe hiện tại trong bãi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {parkingVehicles.length}
            </div>
            <Progress value={occupancyPercentage} className="h-2 mt-2" />
            <p className="text-sm text-gray-500 mt-2">
              {occupancyPercentage.toFixed(0)}% công suất
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Car className="mr-2 h-5 w-5 text-green-500" />
              Chỗ Còn Trống
            </CardTitle>
            <CardDescription>Số chỗ đỗ xe còn trống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {availableSpaces}
            </div>
            <Progress
              value={100 - occupancyPercentage}
              className="h-2 mt-2 bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-2">
              {(100 - occupancyPercentage).toFixed(0)}% còn trống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Ticket className="mr-2 h-5 w-5 text-purple-500" />
              Giá Vé Hiện Tại
            </CardTitle>
            <CardDescription>Giá gửi xe mỗi lượt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(price)}
            </div>
            {/* <div className="flex items-center mt-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Cập nhật: {currentTime.toLocaleTimeString("vi-VN")}</span>
            </div> */}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Bãi Đỗ Xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Tổng số chỗ đỗ:
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {AVAILABLE_SPACES}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Tỷ lệ lấp đầy:
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {occupancyPercentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Giờ mở cửa:
                  </h3>
                  <p className="mt-1 text-lg font-semibold">06:00 - 22:00</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Liên hệ:
                  </h3>
                  <p className="mt-1 text-lg font-semibold">0123 456 789</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
