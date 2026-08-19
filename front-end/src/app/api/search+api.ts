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

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getSearchCredentials() {
  const clientId = firstEnv([
    "NAVER_SEARCH_CLIENT_ID",
    "EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID",
  ]);

  const clientSecret = firstEnv([
    "NAVER_SEARCH_CLIENT_SECRET",
    "EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET",
  ]);

  return {
    clientId,
    clientSecret,
  };
}

function normalizeItems(rawItems: LocalItem[]) {
  return rawItems.map((item) => ({
    title: String(item.title ?? "").replace(/<[^>]*>/g, ""),
    roadAddress: String(item.roadAddress ?? ""),
    address: String(item.address ?? item.roadAddress ?? ""),
    mapx: String(item.mapx ?? ""),
    mapy: String(item.mapy ?? ""),
  }));
}

function getErrorDetail(data: any) {
  return {
    errorCode:
      data?.errorCode ??
      data?.error?.errorCode ??
      null,
    errorMessage:
      data?.errorMessage ??
      data?.error?.message ??
      null,
  };
}

async function searchNaverLocal(
  query: string,
  clientId: string,
  clientSecret: string,
) {
  const params = new URLSearchParams({
    query,
    display: "5",
    start: "1",
    sort: "random",
    format: "json",
  });

  const hubResponse = await fetch(
    "https://naverapihub.apigw.ntruss.com/search/v1/local?" +
      params.toString(),
    {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
    },
  );

  const hubData = await hubResponse.json().catch(() => ({}));

  if (hubResponse.ok && Array.isArray(hubData.items)) {
    return {
      ok: true as const,
      data: hubData,
      source: "hub" as const,
    };
  }

  const legacyParams = new URLSearchParams(params);
  legacyParams.delete("format");

  const legacyResponse = await fetch(
    "https://openapi.naver.com/v1/search/local.json?" +
      legacyParams.toString(),
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    },
  );

  const legacyData = await legacyResponse
    .json()
    .catch(() => ({}));

  if (
    legacyResponse.ok &&
    Array.isArray(legacyData.items)
  ) {
    return {
      ok: true as const,
      data: legacyData,
      source: "legacy" as const,
    };
  }

  return {
    ok: false as const,
    status: hubResponse.status || legacyResponse.status,
    data:
      hubData?.error || hubData?.errorCode
        ? hubData
        : legacyData,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";

  if (!query) {
    return Response.json(
      {
        items: [],
        error: "query required",
      },
      {
        status: 400,
      },
    );
  }

  const {
    clientId,
    clientSecret,
  } = getSearchCredentials();

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        items: [],
        error: "search api credentials missing",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const result = await searchNaverLocal(
      query,
      clientId,
      clientSecret,
    );

    if (!result.ok) {
      const {
        errorCode,
        errorMessage,
      } = getErrorDetail(result.data);

      console.error(
        "[API/search] Naver local search failed:",
        result.status,
        errorCode ?? errorMessage,
      );

      return Response.json(
        {
          items: [],
          error: "naver local search failed",
          errorCode,
          errorMessage,
        },
        {
          status: 502,
        },
      );
    }

    const rawItems: LocalItem[] = Array.isArray(
      result.data.items,
    )
      ? result.data.items
      : [];

    return Response.json({
      items: normalizeItems(rawItems),
      total: result.data.total ?? rawItems.length,
      source: result.source,
    });
  } catch (error) {
    console.error("[API/search] 지역검색 실패:", error);

    return Response.json(
      {
        items: [],
        error: "local search request failed",
      },
      {
        status: 500,
      },
    );
  }
}