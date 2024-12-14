import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_URL } from "../const";
import { convertToDateTimeFormat } from "../../utils";
import Button from "@mui/material/Button";
import { convertToDurationFormat } from "../../utils";
export default function ActionVehicleModal({ isOpen, onClose, vehicle }) {
  function getDuration(entryTime, exitTime) {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const duration = exit.getTime() - entry.getTime();
    return duration;
  }
  return (
    <AnimatePresence>
      {isOpen && vehicle && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {vehicle.action === "enter" ? (
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
                    src={SERVER_URL + vehicle.imageSrc}
                    alt={`License plate ${vehicle.licensePlate}`}
                    width={400}
                    height={200}
                    layout="responsive"
                    className="object-cover"
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
          ) : (
            <motion.div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl min-w-[500px]">
              <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
                A vehicle is exiting
              </h2>
              <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                {vehicle.imageSrc && (
                  <Image
                    src={SERVER_URL + vehicle.imageSrc}
                    alt={`License plate ${vehicle.licensePlate}`}
                    width={500}
                    height={200}
                    layout="responsive"
                    className="object-cover"
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
