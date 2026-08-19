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

const LOCATIONS = [
  {
    name: '강남역 상권',
    address: '강남역 11번 출구',
    count: 67,
    level: '매우 혼잡',
    color: COLORS.red,
  },
  {
    name: '신논현역 상권',
    address: '신논현역 3번 출구',
    count: 51,
    level: '혼잡',
    color: COLORS.orange,
  },
  {
    name: '삼성역 상권',
    address: '삼성역 5번 출구',
    count: 30,
    level: '보통',
    color: COLORS.yellow,
  },
  {
    name: '논현역 상권',
    address: '논현역 1번 출구',
    count: 18,
    level: '여유',
    color: COLORS.green,
  },
];

export default function DensityScreen() {
  return (
    <DashboardLayout activePage="density">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>유동인구</Text>
            <Text style={styles.description}>
              서울특별시 강남구의 실시간 유동인구를 확인하세요
            </Text>
          </View>

          <Pressable style={styles.refreshButton}>
            <Ionicons
              name="refresh-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.refreshText}>
              새로고침
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            title="현재 평균 유동인구"
            value="41명"
            description="현재 지역 평균"
            color={COLORS.accent}
          />

          <SummaryCard
            title="가장 혼잡한 지역"
            value="강남역"
            description="약 67명"
            color={COLORS.red}
          />

          <SummaryCard
            title="가장 여유로운 지역"
            value="논현역"
            description="약 18명"
            color={COLORS.green}
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
                  주요 지역의 현재 혼잡도를 표시합니다.
                </Text>
              </View>

              <View style={styles.legend}>
                <Legend color={COLORS.green} label="여유" />
                <Legend color={COLORS.yellow} label="보통" />
                <Legend color={COLORS.orange} label="혼잡" />
                <Legend color={COLORS.red} label="매우 혼잡" />
              </View>
            </View>

            <View style={styles.map}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View
                  key={`h-${index}`}
                  style={[
                    styles.horizontalLine,
                    { top: `${index * 20}%` },
                  ]}
                />
              ))}

              {Array.from({ length: 7 }).map((_, index) => (
                <View
                  key={`v-${index}`}
                  style={[
                    styles.verticalLine,
                    { left: `${index * 16.6}%` },
                  ]}
                />
              ))}

              {LOCATIONS.map((item, index) => {
                const positions = [
                  { left: '18%', top: '23%' },
                  { left: '50%', top: '50%' },
                  { left: '72%', top: '22%' },
                  { left: '29%', top: '72%' },
                ];

                return (
                  <View
                    key={item.name}
                    style={[
                      styles.marker,
                      positions[index],
                      {
                        backgroundColor: item.color,
                      },
                    ]}
                  >
                    <Text style={styles.markerNumber}>
                      {item.count}
                    </Text>

                    <Text style={styles.markerName}>
                      {item.name.replace(' 상권', '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, styles.listCard]}>
            <Text style={styles.cardTitle}>
              지역별 현황
            </Text>

            <Text style={styles.cardDescription}>
              현재 측정된 유동인구 기준
            </Text>

            <View style={styles.locationList}>
              {LOCATIONS.map((item) => (
                <View
                  key={item.name}
                  style={styles.locationItem}
                >
                  <View
                    style={[
                      styles.locationColor,
                      { backgroundColor: item.color },
                    ]}
                  />

                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>
                      {item.name}
                    </Text>

                    <Text style={styles.locationAddress}>
                      {item.address}
                    </Text>
                  </View>

                  <View style={styles.locationValue}>
                    <Text
                      style={[
                        styles.locationLevel,
                        { color: item.color },
                      ]}
                    >
                      {item.level}
                    </Text>

                    <Text style={styles.locationCount}>
                      {item.count}명
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                시간대별 유동인구
              </Text>

              <Text style={styles.cardDescription}>
                오늘 시간대별 예상 유동인구
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {[
              ['12시', 0.25],
              ['14시', 0.45],
              ['16시', 0.7],
              ['18시', 1],
              ['20시', 0.8],
            ].map(([time, value]) => (
              <View
                key={time as string}
                style={styles.chartColumn}
              >
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Number(value) * 100}%`,
                        backgroundColor:
                          Number(value) >= 0.8
                            ? COLORS.red
                            : Number(value) >= 0.6
                              ? COLORS.orange
                              : Number(value) >= 0.4
                                ? COLORS.yellow
                                : COLORS.green,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.chartTime}>
                  {time as string}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryDot,
          { backgroundColor: color },
        ]}
      />

      <Text style={styles.summaryTitle}>
        {title}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryDescription}>
        {description}
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
          { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  refreshButton: {
    height: 34,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  refreshText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  summaryCard: {
    flex: 1,
    minHeight: 115,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginBottom: 12,
  },

  summaryTitle: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 7,
  },

  summaryDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
  },

  contentGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  mapCard: {
    flex: 1.5,
    minHeight: 400,
  },

  listCard: {
    flex: 0.8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  cardDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
  },

  legend: {
    flexDirection: 'row',
    gap: 10,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

  map: {
    height: 330,
    borderRadius: RADIUS.md,
    backgroundColor: '#0E1A30',
    overflow: 'hidden',
    position: 'relative',
  },

  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1B2C48',
  },

  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1B2C48',
  },

  marker: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  markerNumber: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },

  markerName: {
    position: 'absolute',
    top: 42,
    width: 80,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 8,
  },

  locationList: {
    marginTop: SPACING.md,
    gap: 8,
  },

  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
  },

  locationColor: {
    width: 25,
    height: 25,
    borderRadius: 14,
    marginRight: 9,
  },

  locationInfo: {
    flex: 1,
  },

  locationName: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },

  locationAddress: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 3,
  },

  locationValue: {
    alignItems: 'flex-end',
  },

  locationLevel: {
    fontSize: 8,
    fontWeight: '700',
  },

  locationCount: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  chart: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 10,
  },

  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },

  chartTrack: {
    height: 130,
    width: 28,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  chartBar: {
    width: '100%',
    borderRadius: 7,
  },

  chartTime: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 7,
  },
});