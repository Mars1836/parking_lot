"use client";
import { useRouter } from "next/navigation";

function ProtectRouter({ children }) {
  const router = useRouter();
  const user = localStorage.getItem("admin_car");
  if (!user) {
    router.push("/login");
  } else {
    return children;
  }
}
export default ProtectRouter;
