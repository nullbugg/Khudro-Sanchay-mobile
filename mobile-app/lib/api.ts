const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...headers,
      },
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Backend server-এর সাথে সংযোগ করা যায়নি।",
    );
  }
}

export function getApiUrl(): string {
  return API_URL;
}