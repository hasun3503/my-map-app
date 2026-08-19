
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

const HOURLY = [
  { time: '14시', icon: 'sunny', temp: 28 },
  { time: '15시', icon: 'sunny', temp: 29 },
  { time: '16시', icon: 'partly-sunny', temp: 27 },
  { time: '17시', icon: 'cloud', temp: 26 },
  { time: '18시', icon: 'cloud', temp: 25 },
  { time: '19시', icon: 'moon', temp: 23 },
] as const;

const WEEKLY = [
  { day: '오늘(월)', icon: 'sunny', high: 29, low: 19 },
  { day: '화', icon: 'sunny', high: 30, low: 20 },
  { day: '수', icon: 'partly-sunny', high: 28, low: 18 },
  { day: '목', icon: 'cloud', high: 26, low: 17 },
  { day: '금', icon: 'rainy', high: 24, low: 16 },
  { day: '토', icon: 'partly-sunny', high: 27, low: 17 },
  { day: '일', icon: 'sunny', high: 29, low: 19 },
] as const;

export default function WeatherScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader location="서울특별시 강남구" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 현재 날씨 */}
        <View style={styles.currentWeather}>
          <Ionicons name="sunny" size={56} color={COLORS.yellow} />
          <Text style={styles.temp}>28°</Text>
          <Text style={styles.condition}>맑음</Text>
        </View>

        {/* 상세 정보 */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Ionicons name="water-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>습도</Text>
            <Text style={styles.statValue}>62%</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="weather-windy" size={18} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>바람</Text>
            <Text style={styles.statValue}>12km/h</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="thermometer-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>체감온도</Text>
            <Text style={styles.statValue}>30°C</Text>
          </View>
        </View>

        {/* 시간별 예보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시간별 예보</Text>
          <View style={styles.hourlyRow}>
            {HOURLY.map((h) => (
              <View key={h.time} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{h.time}</Text>
                <Ionicons name={h.icon as any} size={20} color={COLORS.yellow} />
                <Text style={styles.hourlyTemp}>{h.temp}°</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 주간 예보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주간 예보</Text>
          {WEEKLY.map((w, i) => (
            <View
              key={w.day}
              style={[styles.weeklyRow, i === 0 && styles.weeklyRowFirst]}
            >
              <Text style={styles.weeklyDay}>{w.day}</Text>
              <Ionicons
                name={w.icon as any}
                size={18}
                color={COLORS.yellow}
                style={styles.weeklyIcon}
              />
              <View style={styles.weeklyTemps}>
                <Text style={styles.weeklyHigh}>{w.high}°</Text>
                <Text style={styles.weeklyLow}>{w.low}°</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  currentWeather: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  temp: {
    color: COLORS.textPrimary,
    fontSize: 56,
    fontWeight: '300',
    marginTop: SPACING.sm,
  },
  condition: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  hourlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourlyItem: {
    alignItems: 'center',
    gap: 6,
  },
  hourlyTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  hourlyTemp: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  weeklyRowFirst: {
    borderTopWidth: 0,
  },
  weeklyDay: {
    color: COLORS.textPrimary,
    fontSize: 13,
    width: 64,
  },
  weeklyIcon: {
    width: 24,
  },
  weeklyTemps: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  weeklyHigh: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  weeklyLow: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
