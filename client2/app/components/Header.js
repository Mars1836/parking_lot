"use client";
import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Avatar } from "@mui/material";
import { usePathname } from "next/navigation";

export function Header() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const onLogout = () => {
    localStorage.removeItem("admin_car");
    window.location.href = "/login";
  };
  useEffect(() => {
    console.log("Header");
    try {
      let userData = JSON.parse(localStorage.getItem("admin_car"));
      setUser(userData);
    } catch (e) {
      localStorage.removeItem("admin_car");
      window.location.href = "/login";
      console.log(e);
    }
  }, [pathname]);
  return (
    user && (
      <div>
        <div className="h-16"></div>
        <AppBar position="fixed" className="bg-white top-0">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Parking Management
            </Typography>
            <Avatar sx={{ mr: 2 }}>{user?.name?.charAt(0)}</Avatar>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {user?.name}
            </Typography>
            <Button color="inherit" onClick={onLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
      </div>
    )
  );
}
