import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { convertToDateTimeFormat } from "../../utils";
import Button from "@mui/material/Button";
import { convertToDurationFormat } from "../../utils";
import { endpoint } from "../api";
import { useServerUrl } from "../context/ServerUrlContext";
import { useState, useEffect } from "react";
import { db, ref, onValue } from "../lib/firebase";
export default function ActionVehicleModal({ isOpen, onClose, vehicle }) {
  const [model, setModel] = useState(null);
  const [vehicleRegistered, setVehicleRegistered] = useState(null);
  function getDuration(entryTime, exitTime) {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const duration = exit.getTime() - entry.getTime();
    return duration;
  }

  const { serverUrl } = useServerUrl();
  useEffect(() => {
    if (vehicle?.action === "conflict") {
      const vehicleRef = ref(db, `vehicles`);
      const vehicleSub = onValue(vehicleRef, (snapshot) => {
        if (snapshot.exists()) {
          const vehicles = Object.values(snapshot.val());
          const vehicleRegistered = vehicles.find((v) => {
            return v.rfid === vehicle.rfid && !v.exitTime;
          });
          setVehicleRegistered(vehicleRegistered);
        }
      });
      return () => {
        vehicleSub();
      };
    }
  }, [vehicle]);
  useEffect(() => {
    if (!vehicle) return;
    switch (vehicle.action) {
      case "enter":
        setModel(
          <motion.div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl min-w-[500px]"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">
              New Vehicle Entered
            </h2>
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
              {vehicle.imageSrc && (
                <Image
                  src={endpoint.staticFile(serverUrl, vehicle.imageSrc)}
                  alt={`License plate ${vehicle.licensePlate}`}
                  width={400}
                  height={200}
                  layout="responsive"
                  className="object-cover max-h-[300px]"
                />
              )}
            </div>
            <p className="mb-2 text-lg">
              <strong className="text-primary">License Plate:</strong>{" "}
              {vehicle.licensePlate}
            </p>
            <p className="mb-6 text-lg">
              <strong className="text-primary">Entry Time:</strong>{" "}
              {convertToDateTimeFormat(vehicle?.entryTime)}
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={onClose}
              className="mt-4 w-full px-4 py-2"
            >
              Close
            </Button>
          </motion.div>
        );
        break;
      case "exit":
        setModel(
          <motion.div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl min-w-[500px]">
            <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
              A vehicle is exiting
            </h2>
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
              {vehicle.imageSrc && (
                <Image
                  src={endpoint.staticFile(serverUrl, vehicle.imageSrc)}
                  alt={`License plate ${vehicle.licensePlate}`}
                  width={500}
                  height={200}
                  layout="responsive"
                  className="object-cover max-h-[300px]"
                />
              )}
            </div>
            <p>
              <strong className="text-primary">License Plate:</strong>{" "}
              {vehicle.licensePlate}
            </p>
            <p>
              <strong className="text-primary">Entry Time:</strong>{" "}
              {convertToDateTimeFormat(vehicle?.entryTime)}
            </p>
            <p>
              <strong className="text-primary">Exit Time:</strong>{" "}
              {convertToDateTimeFormat(vehicle?.exitTime)}
            </p>
            <p>
              <strong className="text-primary">Duration:</strong>{" "}
              {convertToDurationFormat(
                getDuration(vehicle?.entryTime, vehicle?.exitTime)
              )}
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={onClose}
              className="mt-4 w-full px-4 py-2"
            >
              Close
            </Button>
          </motion.div>
        );
        break;
      case "conflict":
        setModel(
          vehicleRegistered && (
            <motion.div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl min-w-[700px]">
              <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
                License Plate Mismatch Detected
              </h2>
              <div className="flex gap-10">
                <div className="flex-1">
                  <div className="mb-2 rounded-lg overflow-hidden shadow-lg">
                    {vehicle.imageSrc && (
                      <Image
                        src={endpoint.staticFile(serverUrl, vehicle.imageSrc)}
                        alt={`License plate ${vehicle.licensePlate}`}
                        width={500}
                        height={200}
                        layout="responsive"
                        className="object-cover max-h-[300px]"
                      />
                    )}
                  </div>
                  <p className="text-md font-bold text-center">
                    Detected Plate
                  </p>
                  <p>
                    <strong className="text-primary">License Plate:</strong>{" "}
                    {vehicle.licensePlate}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="mb-2 rounded-lg overflow-hidden shadow-lg">
                    {vehicle.imageSrc && (
                      <Image
                        src={endpoint.staticFile(
                          serverUrl,
                          vehicleRegistered.imageSrc
                        )}
                        alt={`License plate ${vehicleRegistered.licensePlate}`}
                        width={500}
                        height={200}
                        layout="responsive"
                        className="object-cover max-h-[300px]"
                      />
                    )}
                  </div>
                  <p className="text-md font-bold text-center">
                    Registered Plate
                  </p>
                  <p>
                    <strong className="text-primary">License Plate:</strong>{" "}
                    {vehicleRegistered.licensePlate}
                  </p>
                  <p>
                    <strong className="text-primary">Entry Time:</strong>{" "}
                    {convertToDateTimeFormat(vehicleRegistered?.entryTime)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onClose}
                  className="mt-4  px-4 py-2"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )
        );
        break;
      default:
        break;
    }
  }, [vehicle, onClose, serverUrl, vehicleRegistered]);
  return (
    <AnimatePresence>
      {isOpen && vehicle && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {model}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
