"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DoorControls from "./components/DoorControls";
import VehicleList from "./components/VehicleList";
import LicensePlateImage from "./components/LastLicensePlateScan";
import LicensePlateModal from "./components/LicensePlateModal";
import ActionVehicleModal from "./components/ActionVehicleModal";
import { db, ref, onValue } from "./lib/firebase";
import AvailableSpaces from "./components/AvailableSpace";
import ProtectRouter from "../wrapper/ProtectRouter";
function ParkingManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState("");
  const [showOnlyParked, setShowOnlyParked] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionVehicleModalOpen, setActionVehicleModalOpen] = useState(false);
  const [vehicleLastAction, setVehicleLastAction] = useState(null);
  const [availableSpaces, setAvailableSpaces] = useState(100);
  const totalSpaces = 100;
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  useEffect(() => {
    const vehicleRef = ref(db, "vehicles");
    const vehicleSub = onValue(vehicleRef, (snapshot) => {
      if (snapshot.exists()) {
        setVehicles(Object.values(snapshot.val()).reverse());
      }
    });

    const vehicleLastActionRef = ref(db, "vehicle_last_action");
    const vehicleLastActionSub = onValue(vehicleLastActionRef, (snapshot) => {
      if (snapshot.exists()) {
        const { action, infor } = snapshot.val();
        setVehicleLastAction({ ...infor, action });
        setActionVehicleModalOpen(true);
      }
    });
    return () => {
      vehicleSub();
      vehicleLastActionSub();
    };
  }, []);
  useEffect(() => {
    const parkedVehicles = vehicles.filter((vehicle) => !vehicle.exitTime);
    setAvailableSpaces(totalSpaces - parkedVehicles.length);
  }, [vehicles]);
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedVehicles = vehicles
    .filter(
      (vehicle) =>
        vehicle.licensePlate?.toLowerCase().includes(filter.toLowerCase()) &&
        (!showOnlyParked || !vehicle.exitTime)
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle dates
      if (sortConfig.key === "entryTime" || sortConfig.key === "exitTime") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  const handleCloseActionVehicleModal = () => {
    setActionVehicleModalOpen(false);
  };
  return (
    <div className="container mx-auto px-4 py-6 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-12 gap-6">
        {/* Top row - Door Controls and Available Spaces */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white shadow-lg rounded-lg p-6 h-full">
            <DoorControls />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white shadow-lg rounded-lg p-6 h-full">
            <AvailableSpaces
              availableSpaces={availableSpaces}
              totalSpaces={totalSpaces}
            />
          </div>
        </div>

        {/* Latest License Plate - Full width on mobile, side column on desktop */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-2 h-[700px]">
          <div className="bg-white shadow-lg rounded-lg p-6 h-full">
            {vehicleLastAction && (
              <LicensePlateImage vehicle={vehicleLastAction} />
            )}
          </div>
        </div>

        {/* Vehicle List - Main content area */}
        <div className="col-span-12 lg:col-span-8 lg:row-span-2 h-[700px]">
          <div className="bg-white shadow-lg rounded-lg p-6 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ">
              <div>
                <input
                  type="text"
                  placeholder="Filter by license plate"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="relative inline-block w-10 mr-2 align-middle select-none cursor-pointer"
                  onClick={() => setShowOnlyParked(!showOnlyParked)}
                >
                  <motion.div
                    className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-2 border-gray-300 "
                    animate={{ x: showOnlyParked ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  />
                  <motion.div
                    className="block w-10 h-6 rounded-full cursor-pointer"
                    animate={{
                      backgroundColor: showOnlyParked ? "#4299e1" : "#cbd5e0",
                    }}
                  />
                </div>
                <label
                  className="text-sm text-gray-700 cursor-pointer"
                  onClick={() => setShowOnlyParked(!showOnlyParked)}
                >
                  Show only parked vehicles
                </label>
              </div>
            </div>
            <VehicleList
              vehicles={filteredAndSortedVehicles}
              onVehicleSelect={handleVehicleSelect}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>

      <LicensePlateModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        vehicle={selectedVehicle}
      />
      <ActionVehicleModal
        isOpen={actionVehicleModalOpen}
        onClose={handleCloseActionVehicleModal}
        vehicle={vehicleLastAction}
      />
    </div>
  );
}
const ProtectParkingManagement = function () {
  return (
    <ProtectRouter>
      <ParkingManagement></ParkingManagement>
    </ProtectRouter>
  );
};
export default ProtectParkingManagement;
