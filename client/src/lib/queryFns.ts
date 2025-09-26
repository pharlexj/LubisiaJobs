// src/lib/queryFns.ts
import { apiRequest } from "@/lib/queryClient";

export const getApplications = async ({ queryKey }: any) => {
  const [_key, filters] = queryKey;

  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.jobId) params.append("jobId", String(filters.jobId));

  const url = params.toString() ? `${_key}?${params.toString()}` : _key;

  return await apiRequest("GET", url);
};
