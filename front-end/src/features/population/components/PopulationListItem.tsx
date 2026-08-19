import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/constants/theme";

import type {
  CongestionLevel,
  PopulationItem,
} from "../../../types/population";

interface PopulationListItemProps {
  item: PopulationItem;
  selected?: boolean;
  onPress?: (item: PopulationItem) => void;
}

const CONGESTION_META: Record<
  CongestionLevel,
  {
    label: string;
    color: string;
  }
> = {
  relaxed: {
    label: "여유",
    color: COLORS.green,
  },
  normal: {
    label: "보통",
    color: COLORS.yellow,
  },
  slightly_crowded: {
    label: "약간 붐빔",
    color: COLORS.orange,
  },
  crowded: {
    label: "붐빔",
    color: COLORS.red,
  },
  unavailable: {
    label: "정보 없음",
    color: COLORS.textMuted,
  },
};

function formatPopulationRange(
  minimum: number | null,
  maximum: number | null,
): string {
  if (minimum === null && maximum === null) {
    return "인구 데이터 없음";
  }

  if (minimum === maximum || maximum === null) {
    return `${(minimum ?? 0).toLocaleString()}명`;
  }

  if (minimum === null) {
    return `최대 ${maximum.toLocaleString()}명`;
  }

  return `${minimum.toLocaleString()} ~ ${maximum.toLocaleString()}명`;
}

function formatMeasuredAt(value: string | null): string {
  if (!value) {
    return "측정 시각 없음";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")} 측정`;
}

export function PopulationListItem({
  item,
  selected = false,
  onPress,
}: PopulationListItemProps) {
  const meta = CONGESTION_META[item.congestion_level];

  return (
    <Pressable
      disabled={!onPress}
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: meta.color,
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={styles.areaName}
            numberOfLines={1}
          >
            {item.area_name}
          </Text>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${meta.color}20`,
                borderColor: `${meta.color}55`,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: meta.color,
                },
              ]}
            >
              {meta.label}
            </Text>
          </View>
        </View>

        <Text
          style={styles.message}
          numberOfLines={1}
        >
          {item.congestion_message || "혼잡도 안내 정보 없음"}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.distance}>
            현재 위치에서 {item.distance_m.toLocaleString()}m
          </Text>

          <Text style={styles.measuredAt}>
            {formatMeasuredAt(item.measured_at)}
          </Text>
        </View>

        <Text style={styles.population}>
          {formatPopulationRange(
            item.population_min,
            item.population_max,
          )}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    backgroundColor: "#111E37",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },

  selected: {
    backgroundColor: "rgba(103, 54, 234, 0.16)",
    borderColor: "#7549EB",
  },

  pressed: {
    opacity: 0.72,
  },

  dot: {
    borderRadius: 999,
    height: 10,
    marginTop: 5,
    width: 10,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  areaName: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },

  message: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 5,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
  },

  distance: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  measuredAt: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  population: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },
});