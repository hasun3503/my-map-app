import React from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { WeatherDashboard } from "@/features/weather/components/WeatherDashboard";

export default function WeatherScreen() {
  return (
    <DashboardLayout activePage="weather">
      <WeatherDashboard />
    </DashboardLayout>
  );
}