// 네이버 지역검색 REST 프록시 (브라우저 CORS 우회)
// 현재 검색 API는 NAVER API HUB입니다.
// https://api.ncloud-docs.com/docs/naver-api-hub-search-local

type LocalItem = {
  title?: string;
  address?: string;
  roadAddress?: string;
  mapx?: string | number;
  mapy?: string | number;
};

function firstEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function searchCredentials() {
  const clientId = firstEnv([
    'NAVER_SEARCH_CLIENT_ID',
    'EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID',
    'EXPO_PUBLIC_NAVER_MAP_CLIENT_local_ID',
  ]);
  const clientSecret = firstEnv([
    'NAVER_SEARCH_CLIENT_SECRET',
    'EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET',
    'EXPO_PUBLIC_NAVER_MAP_CLIENT_local_SECRET',
  ]);
  return { clientId, clientSecret };
}

function pickError(data: any) {
  return {
    errorCode: data?.errorCode ?? data?.error?.errorCode ?? null,
    errorMessage: data?.errorMessage ?? data?.error?.message ?? null,
  };
}

function normalizeItems(rawItems: LocalItem[]) {
  return rawItems.map((item) => ({
    title: String(item.title || '').replace(/<[^>]*>/g, ''),
    roadAddress: String(item.roadAddress || ''),
    address: String(item.address || item.roadAddress || ''),
    mapx: String(item.mapx ?? ''),
    mapy: String(item.mapy ?? ''),
  }));
}

async function fetchLocalSearch(query: string, clientId: string, clientSecret: string) {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('display', '5');
  params.set('start', '1');
  params.set('sort', 'random');
  params.set('format', 'json');

  // 2026년 이후 검색(지역) API: NAVER API HUB
  const hubRes = await fetch(
    `https://naverapihub.apigw.ntruss.com/search/v1/local?${params.toString()}`,
    {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    },
  );
  const hubData = await hubRes.json();
  if (hubRes.ok && Array.isArray(hubData.items)) {
    return { ok: true as const, data: hubData, source: 'hub' };
  }

  // 2026-07-31 이전 개발자센터 검색 키 호환
  const legacyParams = new URLSearchParams(params);
  legacyParams.delete('format');
  const legacyRes = await fetch(
    `https://openapi.naver.com/v1/search/local.json?${legacyParams.toString()}`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    },
  );
  const legacyData = await legacyRes.json();
  if (legacyRes.ok && Array.isArray(legacyData.items)) {
    return { ok: true as const, data: legacyData, source: 'legacy' };
  }

  return {
    ok: false as const,
    status: hubRes.status || legacyRes.status,
    data: hubData?.error || hubData?.errorCode ? hubData : legacyData,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  if (!query.trim()) {
    return Response.json({ items: [], error: 'query required' }, { status: 400 });
  }

  const { clientId, clientSecret } = searchCredentials();
  if (!clientId || !clientSecret) {
    return Response.json(
      { items: [], error: 'search api credentials missing' },
      { status: 500 },
    );
  }

  try {
    const result = await fetchLocalSearch(query, clientId, clientSecret);
    if (!result.ok) {
      const { errorCode, errorMessage } = pickError(result.data);
      console.error('[API/search] Naver local search failed:', result.status, errorCode || errorMessage);
      return Response.json(
        { items: [], error: 'naver local search failed', errorCode, errorMessage },
        { status: 502 },
      );
    }

    const rawItems: LocalItem[] = Array.isArray(result.data.items) ? result.data.items : [];
    return Response.json({
      items: normalizeItems(rawItems),
      total: result.data.total ?? rawItems.length,
      source: result.source,
    });
  } catch (e) {
    console.error('[API/search] 지역검색 실패:', e);
    return Response.json({ items: [] }, { status: 500 });
  }
}
