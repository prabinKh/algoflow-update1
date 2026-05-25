import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './productService';

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll should fetch and return products', async () => {
    const mockProducts = [{ id: 1, name: 'Test Product' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    });

    const result = await productService.getAll();
    expect(global.fetch).toHaveBeenCalledWith('/api/store/products/');
    expect(result).toEqual(mockProducts);
  });

  it('getAll should return empty array on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const result = await productService.getAll();
    expect(result).toEqual([]);
  });

  it('getBySlug should return product', async () => {
    const mockProduct = { id: 1, name: 'Test', slug: 'test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProduct),
    });

    const result = await productService.getBySlug('test');
    expect(global.fetch).toHaveBeenCalledWith('/api/store/products/test/');
    expect(result).toEqual(mockProduct);
  });
});
