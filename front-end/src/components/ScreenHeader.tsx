import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, RADIUS } from '@/constants/theme';

type ScreenHeaderProps = {
  location: string;
};

export default function ScreenHeader({ location }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.caption}>현재 위치</Text>
        <Text style={styles.location}>{location}</Text>
      </View>
      <View style={styles.badge}>
        <Ionicons name="location-outline" size={16} color={COLORS.textPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  location: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});