import axios from "axios";
const instance = axios.create({
  withCredentials: true,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});
export default instance;
