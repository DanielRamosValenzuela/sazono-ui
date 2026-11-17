import { useQuery } from "@tanstack/react-query";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";

const FILTER_OPTIONS_STALE_TIME_MS = 5 * 60_000;

export function useReportFilterOptions(
  token: string | null,
  branchId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["reports", "filter-options", branchId],
    enabled: enabled && Boolean(token) && Boolean(branchId),
    staleTime: FILTER_OPTIONS_STALE_TIME_MS,
    gcTime: FILTER_OPTIONS_STALE_TIME_MS * 2,
    retry: retryReportRequest,
    queryFn: () => reportsApi.getFilterOptions(token!, branchId!),
  });
}
