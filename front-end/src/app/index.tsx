import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DashboardLayout from '@/components/DashboardLayout';
import { COLORS } from '@/constants/theme';

const HOURLY_WEATHER = [
  { time: '14시', temp: 28, icon: 'sunny-outline' as const },
  { time: '15시', temp: 29, icon: 'sunny-outline' as const },
  { time: '16시', temp: 27, icon: 'partly-sunny-outline' as const },
  { time: '17시', temp: 26, icon: 'cloud-outline' as const },
  { time: '18시', temp: 25, icon: 'cloud-outline' as const },
  { time: '19시', temp: 23, icon: 'moon-outline' as const },
];

const WEEKLY_WEATHER = [
  { day: '오늘', high: 29, low: 19, icon: 'sunny-outline' as const },
  { day: '화', high: 30, low: 20, icon: 'sunny-outline' as const },
  { day: '수', high: 28, low: 18, icon: 'partly-sunny-outline' as const },
  { day: '목', high: 26, low: 17, icon: 'cloud-outline' as const },
  { day: '금', high: 24, low: 16, icon: 'rainy-outline' as const },
  { day: '토', high: 27, low: 17, icon: 'partly-sunny-outline' as const },
];

const DENSITY_POINTS = [
  {
    name: '강남역',
    value: 67,
    color: COLORS.red,
    top: '30%',
    left: '22%',
  },
  {
    name: '삼성역',
    value: 30,
    color: COLORS.yellow,
    top: '30%',
    left: '72%',
  },
  {
    name: '역삼역',
    value: 51,
    color: COLORS.orange,
    top: '55%',
    left: '50%',
  },
  {
    name: '논현역',
    value: 18,
    color: COLORS.green,
    top: '75%',
    left: '32%',
  },
];

const RECOMMENDATIONS = [
  {
    name: '강남역 상권',
    place: '강남역 11번 출구',
    population: '약 4,500명',
    level: '매우 혼잡',
    color: COLORS.red,
  },
  {
    name: '신논현역 상권',
    place: '신논현역 3번 출구',
    population: '약 3,200명',
    level: '혼잡',
    color: COLORS.orange,
  },
  {
    name: '코엑스몰',
    place: '삼성역 5번 출구',
    population: '약 2,100명',
    level: '보통',
    color: COLORS.yellow,
  },
  {
    name: '선릉역 정류',
    place: '선릉역 1번 출구',
    population: '약 1,100명',
    level: '여유',
    color: COLORS.green,
  },
];

export default function WeatherScreen() {
  const router = useRouter();

  return (
    <DashboardLayout activePage="weather">
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>대시보드</Text>
          <Text style={styles.pageDescription}>
            날씨와 유동인구를 한 화면에서 확인하세요
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={16}
              color={COLORS.textMuted}
            />
            <Text style={styles.searchText}>장소 검색</Text>
          </Pressable>

          <Pressable style={styles.refreshButton}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color={COLORS.textPrimary}
            />
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.weatherRow}>
          <WeatherCard />
          <HourlyCard />
          <WeeklyCard />
        </View>

        <View style={styles.bottomRow}>
          <DensityPreview
            router={router}
          />
          <RecommendationCard />
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

function WeatherCard() {
  return (
    <View style={[styles.card, styles.weatherCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.locationTitle}>
          <Ionicons
            name="location-outline"
            size={16}
            color={COLORS.accent}
          />

          <Text style={styles.locationTitleText}>
            서울특별시 강남구
          </Text>
        </View>

        <Text style={styles.updatedText}>
          14:29 기준
        </Text>
      </View>

      <View style={styles.weatherContent}>
        <View>
          <View style={styles.temperatureRow}>
            <Ionicons
              name="sunny-outline"
              size={58}
              color={COLORS.yellow}
            />

            <Text style={styles.temperature}>
              28°
            </Text>
          </View>

          <Text style={styles.condition}>
            맑음
          </Text>

          <Text style={styles.highLow}>
            오늘 최고{' '}
            <Text style={styles.high}>29°</Text>
            {' '}최저 19°
          </Text>
        </View>

        <View style={styles.weatherStats}>
          <StatBox label="습도" value="62%" />
          <StatBox label="바람" value="12km/h" />
          <StatBox label="체감온도" value="30°C" />
        </View>
      </View>
    </View>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function HourlyCard() {
  return (
    <View style={[styles.card, styles.hourlyCard]}>
      <Text style={styles.sectionTitle}>
        시간별 예보
      </Text>

      <View style={styles.hourlyRow}>
        {HOURLY_WEATHER.map((item, index) => (
          <View
            key={item.time}
            style={[
              styles.hourItem,
              index === 0 && styles.hourItemActive,
            ]}
          >
            <Text style={styles.hourTime}>
              {item.time}
            </Text>

            <Ionicons
              name={item.icon}
              size={21}
              color={
                item.icon === 'sunny-outline'
                  ? COLORS.yellow
                  : COLORS.textPrimary
              }
            />

            <Text style={styles.hourTemp}>
              {item.temp}°
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WeeklyCard() {
  return (
    <View style={[styles.card, styles.weeklyCard]}>
      <Text style={styles.sectionTitle}>
        주간 예보
      </Text>

      <View style={styles.weeklyList}>
        {WEEKLY_WEATHER.map((item) => (
          <View
            key={item.day}
            style={styles.weekRow}
          >
            <Text style={styles.weekDay}>
              {item.day}
            </Text>

            <Ionicons
              name={item.icon}
              size={16}
              color={
                item.icon === 'sunny-outline'
                  ? COLORS.yellow
                  : COLORS.textPrimary
              }
            />

            <Text style={styles.weekHigh}>
              {item.high}°
            </Text>

            <Text style={styles.weekLow}>
              {item.low}°
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DensityPreview({
  router,
}: {
  router: any;
}) {
  return (
    <View style={[styles.card, styles.densityCard]}>
      <View style={styles.densityHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            실시간 유동인구 지도
          </Text>

          <Text style={styles.sectionDescription}>
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

      <Pressable
        style={styles.densityMap}
        onPress={() => router.push('/map')}
      >
        <View style={styles.mapGridVertical}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={styles.verticalLine}
            />
          ))}
        </View>

        <View style={styles.mapGridHorizontal}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={styles.horizontalLine}
            />
          ))}
        </View>

        {DENSITY_POINTS.map((point) => (
          <View
            key={point.name}
            style={[
              styles.densityPoint,
              {
                top: point.top as any,
                left: point.left as any,
                backgroundColor: point.color,
              },
            ]}
          >
            <Text style={styles.pointNumber}>
              {point.value}
            </Text>

            <Text style={styles.pointName}>
              {point.name}
            </Text>
          </View>
        ))}
      </Pressable>
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

      <Text style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

function RecommendationCard() {
  return (
    <View style={[styles.card, styles.recommendCard]}>
      <View style={styles.recommendHeader}>
        <Text style={styles.sectionTitle}>
          실시간 유동인구 추천
        </Text>

        <Text style={styles.moreText}>
          더보기 ›
        </Text>
      </View>

      {RECOMMENDATIONS.map((item) => (
        <View
          key={item.name}
          style={styles.recommendItem}
        >
          <View
            style={[
              styles.recommendDot,
              { backgroundColor: item.color },
            ]}
          />

          <View style={styles.recommendInfo}>
            <Text style={styles.recommendName}>
              {item.name}
            </Text>

            <Text style={styles.recommendPlace}>
              {item.place}
            </Text>
          </View>

          <View style={styles.recommendRight}>
            <Text
              style={[
                styles.recommendLevel,
                { color: item.color },
              ]}
            >
              {item.level}
            </Text>

            <Text style={styles.recommendPopulation}>
              {item.population}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },

  pageDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },

  searchBox: {
    width: 235,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 8,
  },

  searchText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  refreshButton: {
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  refreshText: {
    color: COLORS.textPrimary,
    fontSize: 11,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  weatherRow: {
    flexDirection: 'row',
    gap: 18,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
  },

  weatherCard: {
    flex: 1.55,
    minHeight: 270,
    padding: 20,
  },

  hourlyCard: {
    flex: 1.05,
    minHeight: 270,
    padding: 20,
  },

  weeklyCard: {
    flex: 0.85,
    minHeight: 270,
    padding: 20,
  },

  cardHeader: {
    marginBottom: 18,
  },

  locationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  locationTitleText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  updatedText: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 8,
  },

  weatherContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  temperature: {
    color: COLORS.textPrimary,
    fontSize: 53,
    fontWeight: '300',
  },

  condition: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -5,
  },

  highLow: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 32,
  },

  high: {
    color: COLORS.orange,
    fontWeight: '700',
  },

  weatherStats: {
    width: 118,
    gap: 10,
  },

  statBox: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  statValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  hourlyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  hourItem: {
    width: 39,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },

  hourItemActive: {
    backgroundColor: COLORS.accent,
  },

  hourTime: {
    color: COLORS.textPrimary,
    fontSize: 9,
  },

  hourTemp: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },

  weeklyList: {
    marginTop: 13,
    gap: 15,
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  weekDay: {
    color: COLORS.textSecondary,
    fontSize: 9,
    width: 54,
  },

  weekHigh: {
    color: COLORS.textPrimary,
    fontSize: 9,
    fontWeight: '600',
  },

  weekLow: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  bottomRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
  },

  densityCard: {
    flex: 1.65,
    minHeight: 330,
    padding: 20,
  },

  recommendCard: {
    flex: 0.85,
    minHeight: 330,
    padding: 20,
  },

  densityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  sectionDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 5,
  },

  legend: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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

  densityMap: {
    flex: 1,
    minHeight: 260,
    backgroundColor: '#101B33',
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
  },

  mapGridVertical: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#20304D',
  },

  mapGridHorizontal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-around',
  },

  horizontalLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#20304D',
  },

  densityPoint: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [
      { translateX: -19 },
      { translateY: -19 },
    ],
  },

  pointNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  pointName: {
    position: 'absolute',
    top: 42,
    color: COLORS.textMuted,
    fontSize: 8,
    width: 55,
    textAlign: 'center',
  },

  recommendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  moreText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  recommendItem: {
    backgroundColor: '#111E37',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  recommendDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  recommendInfo: {
    flex: 1,
    marginLeft: 10,
  },

  recommendName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },

  recommendPlace: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 3,
  },

  recommendRight: {
    alignItems: 'flex-end',
  },

  recommendLevel: {
    fontSize: 8,
    fontWeight: '700',
  },

  recommendPopulation: {
    color: COLORS.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },
});