import { useQuery } from '@tanstack/react-query';

import { apiClient } from './api';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await apiClient.user[':id'].$get({
        param: {
          id,
        },
      });
      return response.json();
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });
}
