export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(
    message: string,
    status: number,
    detail: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }

  return baseUrl.replace(/\/$/, "");
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${getApiBaseUrl()}${normalizedPath}`;
}

function getErrorMessage(
  status: number,
  payload: unknown,
): string {
  if (
    typeof payload === "object"
    && payload !== null
    && "detail" in payload
    && typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  return `API 요청에 실패했습니다. status=${status}`;
}

export async function apiGet<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...init,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      "API 서버에 연결할 수 없습니다.",
      0,
      error,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  const payload: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(response.status, payload),
      response.status,
      payload,
    );
  }

  return payload as T;
}