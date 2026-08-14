import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import { WebView } from 'react-native-webview';

const FILTERS = ['주민센터', '운동센터', '지역사업 찾기', '공원', '지하철', '정부 24', 'Q&A'];
const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
  />
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    window.onload = function () {
      var mapOptions = {
        center: new naver.maps.LatLng(37.3595704, 127.105399),
        zoom: 10
      };

      var map = new naver.maps.Map('map', mapOptions);
    };
  </script>
</body>
</html>
`;

function WebMap() {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const container = mapRef.current;
    const naverMaps = (window as any).naver?.maps;

    if (!container || !clientId) {
      return;
    }

    if (naverMaps) {
      new naverMaps.Map(container, {
        center: new naverMaps.LatLng(37.3595704, 127.105399),
        zoom: 10,
      });

      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;

    script.onload = () => {
      if (!container) {
        return;
      }

      const loadedNaverMaps = (window as any).naver?.maps;

      if (!loadedNaverMaps) {
        return;
      }

      new loadedNaverMaps.Map(container, {
        center: new loadedNaverMaps.LatLng(37.3595704, 127.105399),
        zoom: 10,
      });
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
      container.innerHTML = '';
    };
  }, []);

  return <View ref={mapRef} style={{ flex: 1 }} />;
}

function renderMap() {
  if (Platform.OS === 'web') {
    return <WebMap />;
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={{ flex: 1 }}
    />
  );
}

export default function MapScreen() {
  const handleFilterPress = (filter: string) => {
    if (filter === '정부 24') {
      Linking.openURL('https://plus.gov.kr/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader location="서울특별시 강남구" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={styles.filterChip}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => handleFilterPress(f)}
          >
            <Text style={styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapArea}>
        {renderMap()}

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="locate-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="compass-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

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
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  filterText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
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
