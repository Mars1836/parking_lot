import { motion } from "framer-motion";

export default function AvailableSpaces({ availableSpaces, totalSpaces }) {
  const occupancyPercentage =
    ((totalSpaces - availableSpaces) / totalSpaces) * 100;

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Available Spaces
      </h2>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-5xl font-bold text-primary">
            {availableSpaces}
          </span>
          <span className="text-gray-500 text-lg">out of {totalSpaces}</span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-primary-light/20">
            <motion.div
              style={{ width: `${occupancyPercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          {occupancyPercentage.toFixed(1)}% occupied
        </p>
      </div>
    </div>
  );
}
