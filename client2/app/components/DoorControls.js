"use client";
import { useState, useEffect } from "react";
import { fetchTongleDoor1, fetchTongleDoor2 } from "@/fetch";
import { db, ref, onValue, set } from "../lib/firebase";
import { fetchSimulateAddVehicle } from "@/fetch";
import Button from "@mui/material/Button";
export default function DoorControls() {
  const [door1Open, setDoor1Open] = useState(false);
  const [door2Open, setDoor2Open] = useState(false);
  const [loadingDoor1, setLoadingDoor1] = useState(false);
  const [loadingDoor2, setLoadingDoor2] = useState(false);
  const [checking, setChecking] = useState();
  const [checkingLoading, setCheckingLoading] = useState(false);
  async function handleChecking() {
    setCheckingLoading(true);
    await set(
      ref(db, "status/checking"),
      checking === "true" ? "false" : "true"
    );
    setCheckingLoading(false);
  }
  useEffect(() => {
    const statusCheckingRef = ref(db, "status/checking");
    const statusDoor1Ref = ref(db, "status/door1");
    const statusDoor2Ref = ref(db, "status/door2");
    const statusDoor1Sub = onValue(statusDoor1Ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDoor1Open(data.isOpen);
        setLoadingDoor1(false);
      }
    });
    const statusDoor2Sub = onValue(statusDoor2Ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDoor2Open(data.isOpen);
        setLoadingDoor2(false);
      }
    });
    const statusCheckingSub = onValue(statusCheckingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setChecking(data);
      }
    });
    return () => {
      statusDoor1Sub();
      statusDoor2Sub();
      statusCheckingSub();
    };
  }, []);
  const handleToggleDoor1 = async () => {
    setLoadingDoor1(true);
    await fetchTongleDoor1();
  };
  const handleToggleDoor2 = async () => {
    setLoadingDoor2(true);
    await fetchTongleDoor2();
  };
  const simulateAddVehicle = async () => {
    const { data } = await fetchSimulateAddVehicle({
      licensePlate: "ABC123",
      entryTime: new Date(),
      exitTime: null,
      imageSrc: `/static/455-300x300.jpg`,
      aiPredictedLicensePlate: "ABC123",
    });
    console.log(data);
  };
  return (
    <div className="h-full">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Door Controls</h2>
      <p className="text-gray-800 mb-4">Click to open or close the door</p>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <Button
          variant="contained"
          color={door1Open ? "primary" : "secondary"}
          className={`py-2 px-4  text-white font-semibold text-sm `}
          onClick={handleToggleDoor1}
        >
          Door 1:{" "}
          {loadingDoor1 ? "Loading..." : door1Open ? "is Open" : "is Closed"}
        </Button>

        <Button
          variant="contained"
          color={door2Open ? "primary" : "secondary"}
          className={`py-2 px-4  text-white font-semibold text-sm `}
          onClick={handleToggleDoor2}
        >
          Door 2:{" "}
          {loadingDoor2 ? "Loading..." : door2Open ? "is Open" : "is Closed"}
        </Button>
      </div>
      <Button
        className="mt-4 bg-primary text-white px-4 py-2"
        onClick={handleChecking}
        variant="outlined"
      >
        Checking: {checkingLoading ? "Loading..." : checking}
      </Button>
      <Button
        className=" bg-primary text-white px-4 py-2"
        variant="outlined"
        sx={{ marginLeft: 2 }}
        onClick={simulateAddVehicle}
      >
        Simulate Add Vehicle
      </Button>
    </div>
  );
}
