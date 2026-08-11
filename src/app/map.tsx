import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

const FILTERS = ['주민센터', '운동센터', '지역상업 찾기'];

// NOTE: 좌표는 임시 배치 값입니다. 실제 지도 연동 시 react-native-maps의
// Marker 컴포넌트로 교체하고, 실제 위도/경도 값을 사용하세요.
const PINS = [
  { id: '1', top: '30%', left: '25%', count: 67 },
  { id: '2', top: '55%', left: '60%', count: 30 },
] as const satisfies ReadonlyArray<{
  id: string;
  top: `${number}%`;
  left: `${number}%`;
  count: number;
}>;

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader location="서울특별시 강남구" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={styles.filterChip}>
            <Text style={styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 실제 지도 영역 - 추후 react-native-maps의 MapView로 교체 */}
      <View style={styles.mapArea}>
        {PINS.map((pin) => (
          <View key={pin.id} style={[styles.pin, { top: pin.top, left: pin.left }]}>
            <Text style={styles.pinText}>{pin.count}</Text>
          </View>
        ))}

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="locate-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="compass-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* 선택한 위치 정보 카드 */}
        <View style={styles.infoCard}>
          <View style={styles.infoThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>부평시장역 인근</Text>
            <Text style={styles.infoSubtitle}>유동인구 67명(예상)</Text>
            <Text style={styles.infoTimestamp}>2026년 08월 09일 17시 기준</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  filterText: { color: COLORS.textPrimary, fontSize: 12 },
  mapArea: {
    flex: 1,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  mapActions: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    gap: SPACING.sm,
  },
  mapActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: COLORS.cardAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  infoTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  infoSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  infoTimestamp: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
