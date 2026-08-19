import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { COLORS } from '@/constants/theme';

type Page = 'weather' | 'density' | 'map';

type Props = {
  activePage: Page;
  children: ReactNode;
};

export default function DashboardLayout({
  activePage,
  children,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <View style={styles.brandIconInner} />
            </View>

            <View>
              <Text style={styles.brandName}>WeatherFlow</Text>
              <Text style={styles.brandSub}>
                Desktop Dashboard
              </Text>
            </View>
          </View>

          <View style={styles.menu}>
            <MenuItem
              active={activePage === 'weather'}
              icon="cloud-outline"
              label="날씨"
              onPress={() => router.push('/')}
            />

            <MenuItem
              active={activePage === 'density'}
              icon="people-outline"
              label="유동인구"
              onPress={() => router.push('/density')}
            />

            <MenuItem
              active={activePage === 'map'}
              icon="location-outline"
              label="지도"
              onPress={() => router.push('/map')}
            />
          </View>
        </View>

        <View style={styles.sidebarBottom}>
          <View style={styles.sidebarLine} />

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={COLORS.textSecondary}
            />
            <Text style={styles.sidebarText}>
              서울특별시 강남구
            </Text>
          </View>

          <View style={styles.updateRow}>
            <View style={styles.greenDot} />
            <Text style={styles.sidebarText}>
              실시간 업데이트
            </Text>
          </View>

          <View style={styles.sidebarLine} />

          <Text style={styles.copyright}>
            © 2026 WeatherFlow
          </Text>
        </View>
      </View>

      <View style={styles.main}>
        {children}
      </View>
    </View>
  );
}

function MenuItem({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuItem,
        active && styles.menuItemActive,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          active
            ? COLORS.textPrimary
            : COLORS.textSecondary
        }
      />

      <Text
        style={[
          styles.menuText,
          active && styles.menuTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    minHeight: '100%' as any,
  },

  sidebar: {
    width: 220,
    backgroundColor: '#071126',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 42,
  },

  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#6334E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandIconInner: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: '#7B4CF2',
  },

  brandName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },

  brandSub: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 3,
  },

  menu: {
    gap: 9,
  },

  menuItem: {
    height: 48,
    borderRadius: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  menuItemActive: {
    backgroundColor: '#6736EA',
  },

  menuText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  menuTextActive: {
    color: COLORS.textPrimary,
  },

  sidebarBottom: {
    gap: 13,
  },

  sidebarLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 4,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },

  sidebarText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  copyright: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  main: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 30,
  },
});