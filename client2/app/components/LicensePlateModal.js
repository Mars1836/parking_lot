import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@mui/material/Button";
import { useServerUrl } from "../context/ServerUrlContext";

export default function LicensePlateModal({ isOpen, onClose, vehicle }) {
  const { serverUrl } = useServerUrl();
  return (
    <AnimatePresence>
      {isOpen && vehicle && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              License Plate Image
            </h2>
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
              {vehicle.imageSrc && (
                <Image
                  src={`/api/get-image?imageSrc=${vehicle.imageSrc}&serverUrl=${serverUrl}`}
                  alt={`License plate ${vehicle.licensePlate}`}
                  width={400}
                  height={200}
                  layout="responsive"
                  className="object-cover max-h-[300px]"
                />
              )}
            </div>
            <p className="mb-2 text-lg font-semibold">
              <span className="">License Plate:</span>{" "}
              <span className="text-primary">{vehicle.licensePlate}</span>
            </p>
            <Button
              variant="contained"
              color="primary"
              className="bg-primary hover:bg-primary-dark text-white py-2 px-6 w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
