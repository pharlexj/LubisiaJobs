import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Throw detailed error if response is not ok
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `${res.status}: ${res.statusText}`;
    let extra: Record<string, any> = {};

    try {
      // ✅ clone so we don’t consume body permanently
      const body = await res.clone().json();
      errorMessage = body.error || body.message || errorMessage;
      extra = body;
    } catch {
      // non-JSON response → ignore
    }

    throw Object.assign(new Error(errorMessage), {
      status: res.status,
      statusText: res.statusText,
      ...extra,
    });
  }
}

/**
 * Unified API request function
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  let headers: HeadersInit = {};
  let body: BodyInit | undefined;

  if (data instanceof FormData) {
    body = data;
  } else if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body,
    credentials: "include", // ✅ critical for cookies/session
  });

  await throwIfResNotOk(res);
  return res.json(); // ✅ safe because we only call once now
}

/**
 * React Query fetch wrapper
 */
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
