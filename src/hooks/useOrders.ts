import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/api/orderService';

export const useOrders = () => {
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAll(),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return { orders, loading };
};
