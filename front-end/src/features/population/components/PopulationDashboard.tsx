import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { COLORS } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { usePopulation } from "@/hooks/usePopulation";

import type {
  CongestionLevel,
  PopulationItem,
} from "@/types/population";

import { PopulationList } from "./PopulationList";

const CONGESTION_META: Record<
  CongestionLevel,
  {
    label: string;
    color: string;
    priority: number;
  }
> = {
  relaxed: {
    label: "여유",
    color: COLORS.green,
    priority: 1,
  },
  normal: {
    label: "보통",
    color: COLORS.yellow,
    priority: 2,
  },
  slightly_crowded: {
    label: "약간 붐빔",
    color: COLORS.orange,
    priority: 3,
  },
  crowded: {
    label: "붐빔",
    color: COLORS.red,
    priority: 4,
  },
  unavailable: {
    label: "정보 없음",
    color: COLORS.textMuted,
    priority: 0,
  },
};

function formatDistance(distanceM: number): string {
  if (distanceM < 1_000) {
    return `${distanceM.toLocaleString()}m`;
  }

  return `${(distanceM / 1_000).toFixed(1)}km`;
}

function formatPopulation(
  minimum: number | null,
  maximum: number | null,
): string {
  if (minimum === null && maximum === null) {
    return "데이터 없음";
  }

  if (maximum === null || minimum === maximum) {
    return `${(minimum ?? 0).toLocaleString()}명`;
  }

  if (minimum === null) {
    return `최대 ${maximum.toLocaleString()}명`;
  }

  return `${minimum.toLocaleString()} ~ ${maximum.toLocaleString()}명`;
}

function getPopulationValue(item: PopulationItem): number {
  return item.population_max ?? item.population_min ?? 0;
}

function getMarkerPosition(
  index: number,
): Pick<ViewStyle, "left" | "top"> {
  const positions: Array<
    Pick<ViewStyle, "left" | "top">
  > = [
    { left: "18%", top: "24%" },
    { left: "50%", top: "48%" },
    { left: "73%", top: "22%" },
    { left: "30%", top: "73%" },
    { left: "76%", top: "69%" },
    { left: "48%", top: "17%" },
    { left: "11%", top: "55%" },
    { left: "61%", top: "78%" },
  ];

  return positions[index % positions.length];
}

export function PopulationDashboard() {
  const [selectedItem, setSelectedItem] =
    useState<PopulationItem | null>(null);

  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useCurrentLocation();

  const {
    data,
    isLoading: isPopulationLoading,
    error: populationError,
    refetch: refetchPopulation,
  } = usePopulation(
    location?.latitude,
    location?.longitude,
    {
      limit: 8,
      radiusM: 5_000,
    },
  );

  const items = data?.items ?? [];

  const nearestItem = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    return [...items].sort(
      (left, right) =>
        left.distance_m - right.distance_m,
    )[0];
  }, [items]);

  const mostCrowdedItem = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    return [...items].sort((left, right) => {
      const priorityDifference =
        CONGESTION_META[right.congestion_level].priority -
        CONGESTION_META[left.congestion_level].priority;

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        getPopulationValue(right) -
        getPopulationValue(left)
      );
    })[0];
  }, [items]);

  const handleRefresh = useCallback(() => {
    setSelectedItem(null);
    refreshLocation();
    void refetchPopulation();
  }, [refreshLocation, refetchPopulation]);

  const isLoading =
    isLocationLoading || isPopulationLoading;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>유동인구</Text>

          <Text style={styles.description}>
            현재 위치 주변의 실시간 유동인구를 확인하세요.
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={15}
            color={COLORS.textPrimary}
          />

          <Text style={styles.refreshText}>새로고침</Text>
        </Pressable>
      </View>

      {locationError && (
        <View style={styles.locationError}>
          <Ionicons
            name="warning-outline"
            size={16}
            color={COLORS.orange}
          />

          <Text style={styles.locationErrorText}>
            {locationError.message}
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <SummaryCard
          title="조회 지역"
          value={isLoading ? "-" : `${items.length}곳`}
          description="현재 위치 주변 실시간 데이터"
          color={COLORS.accent}
          icon="location-outline"
        />

        <SummaryCard
          title="가장 혼잡한 지역"
          value={
            isLoading
              ? "-"
              : mostCrowdedItem
                ? CONGESTION_META[
                    mostCrowdedItem.congestion_level
                  ].label
                : "정보 없음"
          }
          description={
            mostCrowdedItem?.area_name ??
            "조회된 지역 없음"
          }
          color={
            mostCrowdedItem
              ? CONGESTION_META[
                  mostCrowdedItem.congestion_level
                ].color
              : COLORS.textMuted
          }
          icon="people-outline"
        />

        <SummaryCard
          title="가장 가까운 지역"
          value={
            isLoading
              ? "-"
              : nearestItem
                ? formatDistance(nearestItem.distance_m)
                : "정보 없음"
          }
          description={
            nearestItem?.area_name ?? "조회된 지역 없음"
          }
          color={COLORS.green}
          icon="navigate-outline"
        />

        <SummaryCard
          title="조회 반경"
          value={
            data
              ? formatDistance(data.radius_m)
              : "5.0km"
          }
          description="현재 위치 기준"
          color={COLORS.yellow}
          icon="radio-outline"
        />
      </View>

      <View style={styles.contentGrid}>
        <View style={[styles.card, styles.mapCard]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                실시간 유동인구 지도
              </Text>

              <Text style={styles.cardDescription}>
                실제 조회 결과를 혼잡도별로 표시합니다.
              </Text>
            </View>

            <View style={styles.legend}>
              <Legend
                color={COLORS.green}
                label="여유"
              />
              <Legend
                color={COLORS.yellow}
                label="보통"
              />
              <Legend
                color={COLORS.orange}
                label="약간 붐빔"
              />
              <Legend
                color={COLORS.red}
                label="붐빔"
              />
            </View>
          </View>

          <PopulationVisualMap
            items={items}
            selectedItem={selectedItem}
            isLoading={isLoading}
            error={populationError}
            onSelect={setSelectedItem}
          />
        </View>

        <View style={styles.listColumn}>
          <PopulationList
            items={items}
            isLoading={isLoading}
            error={populationError}
            selectedAreaCode={
              selectedItem?.area_code ?? null
            }
            onItemPress={setSelectedItem}
            maxHeight={392}
          />
        </View>
      </View>

      <SelectedPopulationDetail
        item={selectedItem}
        requestedAt={data?.requested_at ?? null}
      />
    </ScrollView>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: `${color}20`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={color}
        />
      </View>

      <Text style={styles.summaryTitle}>{title}</Text>

      <Text style={styles.summaryValue}>{value}</Text>

      <Text
        style={styles.summaryDescription}
        numberOfLines={1}
      >
        {description}
      </Text>
    </View>
  );
}

function PopulationVisualMap({
  items,
  selectedItem,
  isLoading,
  error,
  onSelect,
}: {
  items: PopulationItem[];
  selectedItem: PopulationItem | null;
  isLoading: boolean;
  error: Error | null;
  onSelect: (item: PopulationItem) => void;
}) {
  return (
    <View style={styles.populationMap}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={`horizontal-${index}`}
          style={[
            styles.horizontalLine,
            {
              top: `${(index + 1) * 14}%`,
            },
          ]}
        />
      ))}

      {Array.from({ length: 7 }).map((_, index) => (
        <View
          key={`vertical-${index}`}
          style={[
            styles.verticalLine,
            {
              left: `${(index + 1) * 12.5}%`,
            },
          ]}
        />
      ))}

      {isLoading && (
        <View style={styles.mapState}>
          <ActivityIndicator
            size="small"
            color={COLORS.accent}
          />

          <Text style={styles.mapStateText}>
            실시간 인구 정보를 불러오는 중입니다.
          </Text>
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.mapState}>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={COLORS.red}
          />

          <Text style={styles.mapStateText}>
            인구 정보를 불러오지 못했습니다.
          </Text>
        </View>
      )}

      {!isLoading && !error && items.length === 0 && (
        <View style={styles.mapState}>
          <Text style={styles.mapStateText}>
            현재 위치 주변의 인구 정보가 없습니다.
          </Text>
        </View>
      )}

      {!isLoading &&
        !error &&
        items.map((item, index) => {
          const meta =
            CONGESTION_META[item.congestion_level];

          const selected =
            selectedItem?.area_code === item.area_code;

          return (
            <Pressable
              key={item.area_code}
              onPress={() => onSelect(item)}
              style={[
                styles.markerWrapper,
                getMarkerPosition(index),
              ]}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: meta.color,
                  },
                  selected && styles.markerSelected,
                ]}
              >
                <Text style={styles.markerValue}>
                  {getPopulationValue(item) || "-"}
                </Text>
              </View>

              <Text
                style={[
                  styles.markerName,
                  selected && styles.markerNameSelected,
                ]}
                numberOfLines={1}
              >
                {item.area_name}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

function SelectedPopulationDetail({
  item,
  requestedAt,
}: {
  item: PopulationItem | null;
  requestedAt: string | null;
}) {
  if (!item) {
    return (
      <View style={styles.emptyDetail}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={COLORS.textMuted}
        />

        <Text style={styles.emptyDetailText}>
          지도 마커 또는 지역별 현황 목록을 선택하면
          상세 유동인구 정보를 표시합니다.
        </Text>
      </View>
    );
  }

  const meta = CONGESTION_META[item.congestion_level];

  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleRow}>
          <View
            style={[
              styles.detailDot,
              {
                backgroundColor: meta.color,
              },
            ]}
          />

          <View>
            <Text style={styles.detailCaption}>
              선택한 지역
            </Text>

            <Text style={styles.detailTitle}>
              {item.area_name}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.detailBadge,
            {
              backgroundColor: `${meta.color}20`,
              borderColor: `${meta.color}55`,
            },
          ]}
        >
          <Text
            style={[
              styles.detailBadgeText,
              {
                color: meta.color,
              },
            ]}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      <View style={styles.detailMetrics}>
        <DetailMetric
          label="예상 인구"
          value={formatPopulation(
            item.population_min,
            item.population_max,
          )}
        />

        <DetailMetric
          label="현재 위치 거리"
          value={formatDistance(item.distance_m)}
        />

        <DetailMetric
          label="위도"
          value={item.latitude.toFixed(6)}
        />

        <DetailMetric
          label="경도"
          value={item.longitude.toFixed(6)}
        />
      </View>

      <View style={styles.detailFooter}>
        <Text style={styles.detailMessage}>
          {item.congestion_message ||
            "혼잡도 안내 정보가 없습니다."}
        </Text>

        <Text style={styles.requestedAt}>
          조회 시각: {requestedAt ?? "정보 없음"}
        </Text>
      </View>
    </View>
  );
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailMetric}>
      <Text style={styles.detailMetricLabel}>{label}</Text>

      <Text
        style={styles.detailMetricValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 18,
    paddingBottom: 30,
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 25,
    fontWeight: "800",
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  refreshButton: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    height: 36,
    paddingHorizontal: 14,
  },

  refreshText: {
    color: COLORS.textPrimary,
    fontSize: 11,
  },

  pressed: {
    opacity: 0.7,
  },

  locationError: {
    alignItems: "center",
    backgroundColor: "rgba(242, 139, 48, 0.10)",
    borderColor: "rgba(242, 139, 48, 0.24)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  locationErrorText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 11,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 14,
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 130,
    padding: 15,
  },

  summaryIcon: {
    alignItems: "center",
    borderRadius: 9,
    height: 30,
    justifyContent: "center",
    marginBottom: 12,
    width: 30,
  },

  summaryTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },

  summaryDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 6,
  },

  contentGrid: {
    flexDirection: "row",
    gap: 18,
  },

  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 17,
    borderWidth: 1,
    padding: 20,
  },

  mapCard: {
    flex: 1.55,
    minHeight: 430,
  },

  listColumn: {
    flex: 0.95,
    minWidth: 330,
  },

  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  cardDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 5,
  },

  legend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },

  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },

  legendDot: {
    borderRadius: 99,
    height: 7,
    width: 7,
  },

  legendText: {
    color: COLORS.textSecondary,
    fontSize: 8,
  },

  populationMap: {
    backgroundColor: "#101B33",
    borderRadius: 12,
    flex: 1,
    minHeight: 330,
    overflow: "hidden",
    position: "relative",
  },

  horizontalLine: {
    backgroundColor: "#20304D",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },

  verticalLine: {
    backgroundColor: "#20304D",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1,
  },

  mapState: {
    alignItems: "center",
    bottom: 0,
    gap: 9,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },

  mapStateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  markerWrapper: {
    alignItems: "center",
    marginLeft: -30,
    marginTop: -25,
    position: "absolute",
    width: 60,
  },

  marker: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 5,
    height: 46,
    justifyContent: "center",
    width: 46,
  },

  markerSelected: {
    borderColor: "#BFAAFF",
    borderWidth: 4,
    elevation: 5,
    shadowColor: "#8A5BFF",
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },

  markerValue: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  markerName: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 5,
    textAlign: "center",
    width: 86,
  },

  markerNameSelected: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  emptyDetail: {
    alignItems: "center",
    backgroundColor: "#111E37",
    borderColor: COLORS.border,
    borderRadius: 15,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 88,
    paddingHorizontal: 18,
  },

  emptyDetailText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  detailCard: {
    backgroundColor: "#111E37",
    borderColor: "#314667",
    borderRadius: 15,
    borderWidth: 1,
    overflow: "hidden",
  },

  detailHeader: {
    alignItems: "center",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  detailTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },

  detailDot: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },

  detailCaption: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },

  detailBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  detailBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  detailMetrics: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },

  detailMetric: {
    backgroundColor: "#0D1930",
    borderRadius: 10,
    flex: 1,
    minWidth: 0,
    padding: 11,
  },

  detailMetricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  detailMetricValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },

  detailFooter: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },

  detailMessage: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 10,
  },

  requestedAt: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginLeft: 20,
  },
});