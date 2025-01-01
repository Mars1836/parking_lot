import { motion } from "framer-motion";
import Image from "next/image";
import { useServerUrl } from "../context/ServerUrlContext";
const actions = {
  enter: "Vehicle Entered",
  exit: "Vehicle Exited",
  conflict: "Vehicle Mismatch",
};
export default function LastLicensePlateScan({ vehicle }) {
  const { serverUrl } = useServerUrl();
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Latest License Plate
      </h2>
      <motion.div
        className="bg-gradient-to-r rounded-lg flex items-center justify-center text-2xl font-bold  "
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {vehicle?.imageSrc ? (
          <div className="flex flex-col items-center justify-center">
            <Image
              src={`/api/get-image?imageSrc=${vehicle.imageSrc}&serverUrl=${serverUrl}`}
              width={700}
              height={300}
              layout="responsive"
              className="object-cover w-full max-h-[300px]"
              alt="License Plate2"
            />
            <p className=" text-xl font-semibold mt-4">
              <span className="font-bold">License Plate:</span>
              <span className="text-primary"> {vehicle?.licensePlate}</span>
            </p>
            <p className=" text-xl font-semibold mt-4">
              <span className="font-bold">Status:</span>
              <span className="text-primary"> {actions[vehicle?.action]}</span>
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p>No vehicle</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
