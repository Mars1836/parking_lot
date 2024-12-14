import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { convertToDateTimeFormat } from "../../utils";
import { fetchVehicleManuallyExit } from "../../fetch";
import Button from "@mui/material/Button";
export default function VehicleList({
  vehicles,
  onVehicleSelect,
  sortConfig,
  onSort,
}) {
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <ArrowUpDown className="w-4 h-4 inline-block ml-1 text-gray-400" />
      );
    }
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };
  const handleVehicleExit = async (licensePlate) => {
    const data = await fetchVehicleManuallyExit({
      licensePlate: licensePlate,
    });
    console.log(data);
  };
  const columns = [
    { key: "id", label: "No." },
    { key: "licensePlate", label: "License Plate" },
    { key: "entryTime", label: "Entry Time" },
    { key: "exitTime", label: "Exit Time" },
  ];

  return (
    <div className="h-full">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Parked Vehicles</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg overflow-y-scroll h-[550px]">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => onSort(column.key)}
                >
                  <div className="flex items-center justify-center">
                    {column.label}
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ">
                <div className="flex items-center justify-center">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle, index) => (
              <motion.tr
                key={vehicle.id}
                className="hover:bg-gray-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td className="py-4 px-4 whitespace-nowrap text-center">
                  {index + 1}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-center">
                  {vehicle.licensePlate}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-center">
                  {convertToDateTimeFormat(vehicle.entryTime)}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-center">
                  {vehicle.exitTime
                    ? convertToDateTimeFormat(vehicle.exitTime)
                    : "-"}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-center">
                  <div className="flex space-x-2 justify-center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => onVehicleSelect(vehicle)}
                    >
                      View Image
                    </Button>

                    {
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleVehicleExit(vehicle.licensePlate)}
                        disabled={vehicle.exitTime}
                      >
                        Exit
                      </Button>
                    }
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
