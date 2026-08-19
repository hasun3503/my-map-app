import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DashboardLayout from '@/components/DashboardLayout';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

const FILTERS = [
  '주민센터',
  '운동센터',
  '지역상업 찾기',
];

const MARKERS = [
  {
    name: '부평시장역',
    count: 67,
    left: '28%',
    top: '31%',
    color: COLORS.red,
  },
  {
    name: '삼성역',
    count: 30,
    left: '70%',
    top: '26%',
    color: COLORS.yellow,
  },
  {
    name: '역삼역',
    count: 51,
    left: '53%',
    top: '56%',
    color: COLORS.orange,
  },
  {
    name: '논현역',
    count: 18,
    left: '30%',
    top: '76%',
    color: COLORS.green,
  },
];

export default function MapScreen() {
  return (
    <DashboardLayout activePage="map">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>지도</Text>
            <Text style={styles.description}>
              장소와 실시간 유동인구를 지도에서 확인하세요
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={14}
                color={COLORS.textMuted}
              />

              <Text style={styles.searchText}>
                장소 검색
              </Text>
            </Pressable>

            <Pressable style={styles.locationButton}>
              <Ionicons
                name="locate-outline"
                size={16}
                color={COLORS.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter, index) => (
            <Pressable
              key={filter}
              style={[
                styles.filterButton,
                index === 0 && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  index === 0 && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.mapCard}>
          {/* 추후 이 영역을 실제 Naver Map 컴포넌트로 교체 */}
          <View style={styles.map}>
            {Array.from({ length: 8 }).map((_, index) => (
              <View
                key={`v-${index}`}
                style={[
                  styles.verticalRoad,
                  {
                    left: `${index * 14}%`,
                    transform: [
                      {
                        rotate:
                          index % 2 === 0 ? '0deg' : '8deg',
                      },
                    ],
                  },
                ]}
              />
            ))}

            {Array.from({ length: 7 }).map((_, index) => (
              <View
                key={`h-${index}`}
                style={[
                  styles.horizontalRoad,
                  {
                    top: `${index * 16}%`,
                    transform: [
                      {
                        rotate:
                          index % 2 === 0 ? '2deg' : '-3deg',
                      },
                    ],
                  },
                ]}
              />
            ))}

            <Text
              style={[
                styles.mapText,
                { left: '13%', top: '17%' },
              ]}
            >
              강남대로
            </Text>

            <Text
              style={[
                styles.mapText,
                { left: '48%', top: '37%' },
              ]}
            >
              역삼동
            </Text>

            <Text
              style={[
                styles.mapText,
                { left: '70%', top: '13%' },
              ]}
            >
              삼성동
            </Text>

            {MARKERS.map((marker) => (
              <View
                key={marker.name}
                style={[
                  styles.marker,
                  {
                    left: marker.left as any,
                    top: marker.top as any,
                    backgroundColor: marker.color,
                  },
                ]}
              >
                <Text style={styles.markerCount}>
                  {marker.count}
                </Text>

                <Text style={styles.markerName}>
                  {marker.name}
                </Text>
              </View>
            ))}

            <View style={styles.mapControls}>
              <Pressable style={styles.mapControl}>
                <Ionicons
                  name="add"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </Pressable>

              <Pressable style={styles.mapControl}>
                <Ionicons
                  name="remove"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </Pressable>

              <Pressable style={styles.mapControl}>
                <Ionicons
                  name="locate-outline"
                  size={17}
                  color={COLORS.textPrimary}
                />
              </Pressable>
            </View>

            <View style={styles.selectedCard}>
              <View style={styles.selectedIcon}>
                <Ionicons
                  name="location"
                  size={20}
                  color={COLORS.accentLight}
                />
              </View>

              <View style={styles.selectedInfo}>
                <Text style={styles.selectedTitle}>
                  부평시장역 인근
                </Text>

                <Text style={styles.selectedSubtitle}>
                  유동인구 67명(예상)
                </Text>

                <Text style={styles.selectedTime}>
                  2026년 08월 09일 17시 기준
                </Text>
              </View>

              <Pressable style={styles.detailButton}>
                <Text style={styles.detailText}>
                  상세보기
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              지도 안내
            </Text>

            <Text style={styles.infoText}>
              지도에서 지역을 선택하면 해당 지역의
              유동인구와 혼잡도를 확인할 수 있습니다.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              혼잡도 범례
            </Text>

            <View style={styles.legendRow}>
              <Legend color={COLORS.green} label="여유" />
              <Legend color={COLORS.yellow} label="보통" />
              <Legend color={COLORS.orange} label="혼잡" />
              <Legend
                color={COLORS.red}
                label="매우 혼잡"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </DashboardLayout>
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
    <View style={styles.legend}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: color },
        ]}
      />

      <Text style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 25,
    fontWeight: '800',
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  searchBox: {
    width: 220,
    height: 36,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },

  searchText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  locationButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },

  filterButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  filterText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },

  filterTextActive: {
    color: COLORS.textPrimary,
  },

  mapCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  map: {
    height: 590,
    borderRadius: RADIUS.md,
    backgroundColor: '#0E1A30',
    overflow: 'hidden',
    position: 'relative',
  },

  verticalRoad: {
    position: 'absolute',
    top: '-10%',
    bottom: '-10%',
    width: 1,
    backgroundColor: '#263753',
  },

  horizontalRoad: {
    position: 'absolute',
    left: '-10%',
    right: '-10%',
    height: 1,
    backgroundColor: '#263753',
  },

  mapText: {
    position: 'absolute',
    color: '#5C6B83',
    fontSize: 9,
  },

  marker: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 24,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  markerCount: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },

  markerName: {
    position: 'absolute',
    top: 44,
    width: 80,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 8,
  },

  mapControls: {
    position: 'absolute',
    right: 14,
    top: 14,
    gap: 7,
  },

  mapControl: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  selectedInfo: {
    flex: 1,
  },

  selectedTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  selectedSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  selectedTime: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 4,
  },

  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  detailText: {
    color: COLORS.textSecondary,
    fontSize: 8,
  },

  bottomRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },

  infoCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  infoText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },

  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  legendText: {
    color: COLORS.textSecondary,
    fontSize: 8,
  },
});