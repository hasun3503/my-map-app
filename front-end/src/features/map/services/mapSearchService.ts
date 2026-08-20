import type {
  LocalSearchItem,
  LocalSearchResponse,
} from "../types/map";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export async function searchLocalPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<LocalSearchItem[]> {
  const params = new URLSearchParams({ query });

  const response = await fetch(
    `/api/search?${params.toString()}`,
    { signal },
  );

  const data = (await response.json().catch(() => {
    return {};
  })) as LocalSearchResponse;

  if (!response.ok) {
    const detail =
      data.errorMessage ??
      data.error ??
      "장소 검색 요청에 실패했습니다.";

    throw new Error(detail);
  }

  return Array.isArray(data.items)
    ? data.items.map((item) => ({
        ...item,
        title: stripHtml(String(item.title ?? "")),
      }))
    : [];
}