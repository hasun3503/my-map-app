// NCP Map Place 검색 API 서버 프록시 (CORS 우회)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  const lng = url.searchParams.get('lng') || '';
  const lat = url.searchParams.get('lat') || '';
  if (!query.trim()) return Response.json({ items: [] }, { status: 400 });

  const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';
  const clientSecret = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_SECRET ?? '';

  try {
    // NCP(Map) Places 검색 API - X-NCP 인증 헤더 사용
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('start', '1');
    params.set('display', '20');
    params.set('sort', 'random');
    if (lng && lat) {
      params.set('coordinate', `${lng},${lat}`);
      params.set('radius', '10'); // km 단위 반경
    }
    const res = await fetch(`https://maps.apigw.ntruss.com/map-place/v1/search?${params.toString()}`, {
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret,
      },
    });
    const data = await res.json();
    console.log('[API/search] raw NCP:', data);

    // NCP map-place 응답 형식: { places: [...] }
    // 프론트(SearchPlace) 형식에 맞게 변환:
    //   { items: [{ title, roadAddress, mapx, mapy }] }
    const places = Array.isArray(data.places) ? data.places : [];
    const items = places.map((p: any) => ({
      title: String(p.title || p.name || ''),
      roadAddress: String(p.roadAddress || p.address || ''),
      address: String(p.address || p.roadAddress || ''),
      mapx: String(p.longitude || p.lng || ''),
      mapy: String(p.latitude || p.lat || ''),
    }));
    return Response.json({ items, total: data.meta?.totalCount ?? items.length });
  } catch (e) {
    console.error('[API/search] NCP Place 검색 실패:', e);
    return Response.json({ items: [] }, { status: 500 });
  }
}