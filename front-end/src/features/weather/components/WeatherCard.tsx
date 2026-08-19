import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/constants/theme";

import type {
  WeatherCondition,
  WeatherResult,
} from "../../../types/weather";

interface WeatherCardProps {
  weather: WeatherResult | null;
  isLoading: boolean;
  error: Error | null;
  locationName?: string;
}

type WeatherVisual = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const WEATHER_VISUALS: Record<
  WeatherCondition,
  WeatherVisual
> = {
  clear: {
    label: "맑음",
    icon: "sunny-outline",
    color: COLORS.yellow,
  },
  partly_cloudy: {
    label: "구름 조금",
    icon: "partly-sunny-outline",
    color: COLORS.yellow,
  },
  cloudy: {
    label: "흐림",
    icon: "cloud-outline",
    color: COLORS.textSecondary,
  },
  rain: {
    label: "비",
    icon: "rainy-outline",
    color: COLORS.accent,
  },
  rain_snow: {
    label: "비 또는 눈",
    icon: "snow-outline",
    color: COLORS.textSecondary,
  },
  snow: {
    label: "눈",
    icon: "snow-outline",
    color: COLORS.textPrimary,
  },
  shower: {
    label: "소나기",
    icon: "thunderstorm-outline",
    color: COLORS.accent,
  },
  unknown: {
    label: "정보 없음",
    icon: "help-circle-outline",
    color: COLORS.textMuted,
  },
};

function formatTemperature(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${Math.round(value)}°`;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${Math.round(value)}%`;
}

function formatWindSpeed(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)}m/s`;
}

function formatObservedAt(value: string | null): string {
  if (!value) {
    return "갱신 시각 정보 없음";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")} 기준`;
}

export function WeatherCard({
  weather,
  isLoading,
  error,
  locationName = "현재 위치",
}: WeatherCardProps) {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.stateCard]}>
        <ActivityIndicator
          color={COLORS.accent}
          size="small"
        />
        <Text style={styles.stateText}>
          현재 위치의 날씨를 불러오는 중입니다.
        </Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={[styles.card, styles.stateCard]}>
        <Ionicons
          name="cloud-offline-outline"
          size={28}
          color={COLORS.textMuted}
        />
        <Text style={styles.errorTitle}>
          날씨 정보를 불러오지 못했습니다.
        </Text>
        <Text style={styles.errorDescription}>
          {error?.message ??
            "위치 권한과 API 서버 연결을 확인해 주세요."}
        </Text>
      </View>
    );
  }

  const current = weather.current;
  const today = weather.daily[0] ?? null;

  const visual = WEATHER_VISUALS[current.condition];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={COLORS.accent}
            />
            <Text style={styles.locationName}>
              {locationName}
            </Text>
          </View>

          <Text style={styles.observedAt}>
            {formatObservedAt(current.observed_at)}
          </Text>
        </View>

        <View
          style={[
            styles.conditionBadge,
            {
              borderColor: `${visual.color}55`,
              backgroundColor: `${visual.color}18`,
            },
          ]}
        >
          <Ionicons
            name={visual.icon}
            size={14}
            color={visual.color}
          />
          <Text
            style={[
              styles.conditionBadgeText,
              { color: visual.color },
            ]}
          >
            {visual.label}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.temperatureArea}>
          <View style={styles.temperatureRow}>
            <Ionicons
              name={visual.icon}
              size={54}
              color={visual.color}
            />

            <Text style={styles.temperature}>
              {formatTemperature(current.temperature_c)}
            </Text>
          </View>

          <Text style={styles.feelsLike}>
            체감 {formatTemperature(current.feels_like_c)}
          </Text>

          <Text style={styles.highLow}>
            오늘 최고{" "}
            <Text style={styles.highTemperature}>
              {formatTemperature(today?.max_temperature_c ?? null)}
            </Text>
            {"  "}최저{" "}
            <Text style={styles.lowTemperature}>
              {formatTemperature(today?.min_temperature_c ?? null)}
            </Text>
          </Text>
        </View>

        <View style={styles.stats}>
          <WeatherStat
            icon="water-outline"
            label="습도"
            value={formatPercent(current.humidity_percent)}
          />

          <WeatherStat
            icon="speedometer-outline"
            label="풍속"
            value={formatWindSpeed(current.wind_speed_mps)}
          />

          <WeatherStat
            icon="thermometer-outline"
            label="체감 온도"
            value={formatTemperature(current.feels_like_c)}
          />
        </View>
      </View>
    </View>
  );
}

function WeatherStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statHeader}>
        <Ionicons
          name={icon}
          size={12}
          color={COLORS.textMuted}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 270,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 20,
  },

  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  stateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  errorDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  locationName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  observedAt: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 8,
  },

  conditionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  conditionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  temperatureArea: {
    flex: 1,
  },

  temperatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  temperature: {
    color: COLORS.textPrimary,
    fontSize: 53,
    fontWeight: "300",
  },

  feelsLike: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  highLow: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 25,
  },

  highTemperature: {
    color: COLORS.orange,
    fontWeight: "700",
  },

  lowTemperature: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  stats: {
    width: 118,
    gap: 10,
  },

  statBox: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 11,
  },

  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  statValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
});