import React from "react";
import { View } from "react-native";

import DashboardLayout from "@/components/DashboardLayout";
import { MapDashboard } from "@/features/map/components/MapDashboard";

export default function MapScreen() {
  return (
    <DashboardLayout activePage="map">
      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
        }}
      >
        <MapDashboard />
      </View>
    </DashboardLayout>
  );
}