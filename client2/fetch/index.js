import axios from "axios";

export const fetchTongleDoor1 = async function () {
  try {
    const { data } = await axios.post("http://localhost:5000/toggle-door1");
    return data;
  } catch (error) {
    console.error(error);
  }
};
export const fetchTongleDoor2 = async function () {
  try {
    const { data } = await axios.post("http://localhost:5000/toggle-door2");
    return data;
  } catch (error) {
    console.error(error);
  }
};
export const fetchSimulateAddVehicle = async function (body) {
  try {
    const { data } = await axios.post("http://localhost:5000/vehicle", body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return data;
  } catch (error) {
    console.error(error);
  }
};
export const fetchVehicleManuallyExit = async function (body) {
  try {
    const { data } = await axios.post(
      "http://localhost:5000/vehicle/exit",
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data;
  } catch (error) {
    console.error(error);
  }
};
