/**
 * React Query client configuration.
 *
 * This file configures the QueryClient that manages all server state
 * in the application. The configuration includes defaults for queries
 * and mutations that apply application-wide unless overridden.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client.
 *
 * The configuration here establishes default behaviors for all queries
 * and mutations in the application. These defaults prioritize user
 * experience by keeping data fresh while minimizing unnecessary network
 * requests through intelligent caching.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            /**
             * staleTime determines how long cached data is considered fresh.
             * During this period, React Query won't refetch even if the query
             * is re-executed. For laboratory data that doesn't change frequently,
             * 30 seconds is reasonable. Users typically work on one entity at a time,
             * so data doesn't need to be refreshed on every navigation.
             */
            staleTime: 30 * 1000, // 30 seconds

            /**
             * cacheTime (gcTime in newer versions) determines how long unused
             * data stays in cache. After this period, unused cache entries are
             * garbage collected. 5 minutes means users can navigate away from a
             * page and back without refetching if they return quickly.
             */
            gcTime: 5 * 60 * 1000, // 5 minutes

            /**
             * retry determines how many times failed queries are retried.
             * False means no retries, which is appropriate for development.
             * In production, you might set this to 1 or 2 to handle transient
             * network issues, but be careful not to retry on 4xx errors which
             * indicate client problems that won't be fixed by retrying.
             */
            retry: false,

            /**
             * refetchOnWindowFocus refreshes data when the user returns to the
             * browser tab. This keeps data current when users leave and return,
             * which is common in laboratory settings where browsers stay open
             * while work happens physically in the lab.
             */
            refetchOnWindowFocus: true,

            /**
             * refetchOnReconnect refreshes data when the network reconnects.
             * This is important if network connections are unreliable.
             */
            refetchOnReconnect: true,
        },
        mutations: {
            /**
             * Mutations (create, update, delete operations) typically don't need
             * retries because they're user-initiated actions that the user can
             * retry manually if they fail. Automatic retries could lead to
             * duplicate creations or unexpected state changes.
             */
            retry: false,
        },
    },
});