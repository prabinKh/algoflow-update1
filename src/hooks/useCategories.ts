import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/api/categoryService';
import { type Category } from '@/lib/types';

export const useCategories = () => {
  const { data: dbCategories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const allCategories = useMemo(() => {
    if (!Array.isArray(dbCategories)) return [];
    return dbCategories;
  }, [dbCategories]);

  return { categories: allCategories, loading };
};
