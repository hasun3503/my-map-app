import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, RADIUS } from '@/constants/theme';

type ScreenHeaderProps = {
  location: string;
};

export default function ScreenHeader({ location }: ScreenHeaderProps) {
  const [currentLocation] = useState('아무글자');
  const [searchText, setSearchText] = useState(location);

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.caption}>현재 위치: {currentLocation}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.locationInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectTextOnFocus
          />
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.8}>
            <Ionicons name="search" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
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
  textWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  locationInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardAlt,
    minHeight: 36,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
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