import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

export default function ScreenHeader({ location }: { location: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.locationRow}>
        <Ionicons name="locate-outline" size={22} color={COLORS.accent} />
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    paddingBottom: SPACING.md,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationText: {
    color: COLORS.textPrimary,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
  },
});
