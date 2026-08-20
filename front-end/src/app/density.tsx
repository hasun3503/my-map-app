import React from "react";

import DashboardLayout from "@/components/DashboardLayout";
import { PopulationDashboard } from "@/features/population/components/PopulationDashboard";

export default function DensityScreen() {
  return (
    <DashboardLayout activePage="density">
      <PopulationDashboard />
    </DashboardLayout>
  );
}