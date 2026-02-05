import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
    });
}

export function useRecentPosts(limit = 10) {
    return useQuery({
        queryKey: ['posts', limit],
        queryFn: async () => {
            const res = await fetch(`/api/posts?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            return res.json();
        },
    });
}

export function usePlatformMetrics() {
    return useQuery({
        queryKey: ['platforms'],
        queryFn: async () => {
            const res = await fetch('/api/platforms');
            if (!res.ok) throw new Error('Failed to fetch platforms');
            return res.json();
        },
    });
}

export function useRefreshData() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/data/refresh', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to refresh data');
            return res.json();
        },
        onSuccess: () => {
            // Invalidate all dashboard queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
        },
    });
}
