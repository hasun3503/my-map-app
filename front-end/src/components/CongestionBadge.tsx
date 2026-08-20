import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/theme';

export type CongestionLevel = '여유' | '보통' | '혼잡' | '매우혼잡';

const LEVEL_COLORS: Record<CongestionLevel, string> = {
  여유: COLORS.green,
  보통: COLORS.yellow,
  혼잡: COLORS.orange,
  매우혼잡: COLORS.red,
};

export default function CongestionBadge({ level }: { level: CongestionLevel }) {
  return (
    <View style={[styles.badge, { borderColor: LEVEL_COLORS[level] }]}>
      <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[level] }]} />
      <Text style={styles.text}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
