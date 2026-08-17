import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import CongestionBadge, { CongestionLevel } from '@/components/CongestionBadge';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

const RECOMMENDATIONS: { name: string; population: string; level: CongestionLevel }[] = [
  { name: '강남역 11번 출구', population: '약 4,500명', level: '매우혼잡' },
  { name: '신사동 가로수길', population: '약 1,800명', level: '보통' },
  { name: '코엑스몰 내부', population: '약 1,200명', level: '여유' },
];

const HOURLY_CONGESTION = [
  { time: '12시', value: 0.25, color: COLORS.green },
  { time: '14시', value: 0.45, color: COLORS.yellow },
  { time: '16시', value: 0.75, color: COLORS.orange },
  { time: '18시', value: 1, color: COLORS.red },
  { time: '20시', value: 0.85, color: COLORS.orange },
];

export default function DensityScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader location="서울특별시 강남구" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 지도 미리보기 - 실제 지도는 map.tsx 참고, 추후 react-native-maps로 교체 가능 */}
        <View style={styles.mapPreview}>
          <Ionicons name="location" size={28} color={COLORS.red} />
          <Text style={styles.mapPreviewText}>지도 미리보기</Text>
        </View>

        {/* 범례 */}
        <View style={styles.legendRow}>
          <LegendDot color={COLORS.green} label="여유" />
          <LegendDot color={COLORS.yellow} label="보통" />
          <LegendDot color={COLORS.orange} label="혼잡" />
          <LegendDot color={COLORS.red} label="매우혼잡" />
        </View>

        {/* 실시간 유동인구 추천 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>실시간 유동인구 추천</Text>
          {RECOMMENDATIONS.map((item, i) => (
            <View
              key={item.name}
              style={[styles.recommendRow, i === 0 && styles.recommendRowFirst]}
            >
              <View>
                <Text style={styles.recommendName}>{item.name}</Text>
                <Text style={styles.recommendPopulation}>{item.population}</Text>
              </View>
              <CongestionBadge level={item.level} />
            </View>
          ))}
        </View>

        {/* 시간대별 혼잡도 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시간대별 혼잡도</Text>
          <View style={styles.chartRow}>
            {HOURLY_CONGESTION.map((bar) => (
              <View key={bar.time} style={styles.chartBarWrap}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarFill,
                      { height: `${bar.value * 100}%`, backgroundColor: bar.color },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{bar.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  mapPreview: {
    height: 140,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  mapPreviewText: { color: COLORS.textSecondary, fontSize: 13 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: COLORS.textSecondary, fontSize: 12 },
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
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  recommendRowFirst: {
    borderTopWidth: 0,
  },
  recommendName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  recommendPopulation: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarWrap: { alignItems: 'center', flex: 1 },
  chartBarTrack: {
    width: 20,
    height: 90,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  chartLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
});
