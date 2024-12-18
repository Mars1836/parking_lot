import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { SERVER_URL } from "../const";
export default function LastLicensePlateScan({ imageSrc, licensePlate }) {
  useEffect(() => {
    console.log(imageSrc);
  }, [imageSrc]);
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Latest License Plate
      </h2>
      <motion.div
        className="bg-gradient-to-r   rounded-lg flex items-center justify-center text-2xl font-bold  "
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {imageSrc ? (
          <div>
            <Image
              src={`${SERVER_URL}${imageSrc}`}
              width={700}
              height={300}
              className="object-contain"
              alt="License Plate"
            />
            <p className=" text-xl font-semibold mt-4">
              <span className="font-bold">License Plate:</span>
              <span className="text-primary"> {licensePlate}</span>
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
