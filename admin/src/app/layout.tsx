import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ServerUrlProvider } from "@/app/context/ServerUrlContext";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parking Management System",
  description: "Admin dashboard for parking management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ServerUrlProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </ServerUrlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
