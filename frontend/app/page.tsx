import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Dashboard } from "@/components/dashboard/dashboard";
import {
  fetchAnalytics,
  fetchBalance,
  fetchRewards,
  fetchTransactionMeta,
  fetchTransactions,
} from "@/lib/api";
import { DEFAULT_SORT, EMPTY_FILTERS } from "@/lib/dashboard-defaults";
import { queryKeys } from "@/lib/query-keys";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 20_000,
      },
    },
  });

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions(EMPTY_FILTERS, 1, DEFAULT_SORT),
      queryFn: ({ signal }) => fetchTransactions(EMPTY_FILTERS, 1, DEFAULT_SORT, signal),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactionMeta,
      queryFn: ({ signal }) => fetchTransactionMeta(signal),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.analytics(EMPTY_FILTERS),
      queryFn: ({ signal }) => fetchAnalytics(EMPTY_FILTERS, signal),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.balance,
      queryFn: ({ signal }) => fetchBalance(signal),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.rewards,
      queryFn: ({ signal }) => fetchRewards(signal),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  );
}
