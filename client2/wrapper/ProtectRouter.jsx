"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ProtectRouter({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("admin_car");
      if (!user) {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking) {
    // Hiển thị trạng thái tạm thời khi kiểm tra quyền
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Ngăn không render children khi không được xác thực
  }

  return children;
}

export default ProtectRouter;
