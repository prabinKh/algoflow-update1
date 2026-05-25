import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/api/customerService';

export const useCustomers = () => {
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    refetchInterval: 60000, // Poll every minute
  });

  return { customers, loading };
};
