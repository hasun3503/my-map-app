import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/constants/theme";

import type {
  PopulationItem,
} from "../../../types/population";

import { PopulationListItem } from "./PopulationListItem";

interface PopulationListProps {
  items: PopulationItem[];
  isLoading: boolean;
  error: Error | null;
  selectedAreaCode?: string | null;
  onItemPress?: (item: PopulationItem) => void;
  maxHeight?: number;
}

export function PopulationList({
  items,
  isLoading,
  error,
  selectedAreaCode = null,
  onItemPress,
  maxHeight = 430,
}: PopulationListProps) {
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.accent}
        />

        <Text style={styles.stateText}>
          주변 실시간 인구 정보를 불러오는 중입니다.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>
          주변 인구 정보를 불러오지 못했습니다.
        </Text>

        <Text style={styles.errorDescription}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>
          현재 위치 주변의 인구 정보가 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>지역별 현황</Text>

          <Text style={styles.description}>
            현재 위치를 기준으로 검색된 실시간 인구 데이터
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {items.length}곳
          </Text>
        </View>
      </View>

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={[
          styles.list,
          {
            maxHeight,
          },
        ]}
        contentContainerStyle={styles.listContent}
      >
        {items.map((item) => (
          <PopulationListItem
            key={item.area_code}
            item={item}
            selected={
              selectedAreaCode === item.area_code
            }
            onPress={onItemPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 17,
    borderWidth: 1,
    minHeight: 0,
    padding: 18,
  },

  stateContainer: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 17,
    borderWidth: 1,
    gap: 9,
    justifyContent: "center",
    minHeight: 180,
    padding: 20,
  },

  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  description: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 5,
  },

  countBadge: {
    backgroundColor: "rgba(103, 54, 234, 0.18)",
    borderColor: "rgba(133, 91, 255, 0.42)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  countText: {
    color: "#B89BFF",
    fontSize: 10,
    fontWeight: "700",
  },

  list: {
    minHeight: 0,
  },

  listContent: {
    gap: 8,
    paddingBottom: 2,
  },

  stateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },

  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },

  errorDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
});