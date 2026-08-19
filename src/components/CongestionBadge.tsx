import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

import { COLORS, RADIUS } from '@/constants/theme';

export type CongestionLevel = '여유' | '보통' | '혼잡' | '매우혼잡';

type CongestionBadgeProps = {
  level: CongestionLevel;
};

const BADGE_COLORS: Record<CongestionLevel, string> = {
  여유: COLORS.green,
  보통: COLORS.yellow,
  혼잡: COLORS.orange,
  매우혼잡: COLORS.red,
};

export default function CongestionBadge({ level }: CongestionBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: BADGE_COLORS[level] }]}>
      <Text style={styles.label}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
