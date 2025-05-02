import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } else {
        errorMessage = await res.text();
      }
    } catch (error) {
      errorMessage = res.statusText;
    }
    
    console.error(`API Error: ${res.status} - ${errorMessage}`);
    throw new Error(errorMessage || `${res.status}: ${res.statusText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: { noContentType?: boolean } = {}
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`, data ? { data } : '');
  
  // Prepare headers
  const headers: HeadersInit = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  };
  
  // Don't set Content-Type for FormData (browser will set with boundary)
  // or if explicitly turned off through options
  if (data && !(data instanceof FormData) && !options.noContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  // Prepare body - if FormData, use as is; otherwise stringify
  const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  console.log(`Response from ${url}: ${res.status} ${res.statusText}`);
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Making query request to ${queryKey[0]}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      cache: "no-store",
    });

    console.log(`Query response from ${queryKey[0]}: ${res.status} ${res.statusText}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Returning null for 401 response from ${queryKey[0]} as configured`);
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Query data from ${queryKey[0]}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
