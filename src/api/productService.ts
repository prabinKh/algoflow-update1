import { type Product } from "@/lib/types";

const API_BASE = "/api/store";

import { getTenantHeaders } from "@/lib/tenant";

export const productService = {
  async getAll(options?: { company?: string }) {
    try {
      const url = options?.company ? `${API_BASE}/products/?company=${options.company}` : `${API_BASE}/products/`;
      const response = await fetch(url, { headers: getTenantHeaders() });
      if (!response.ok) throw new Error("Failed to fetch products");
      return await response.json() as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await fetch(`${API_BASE}/products/${slug}/`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return await response.json() as Product;
    } catch (error) {
      console.error(`Error fetching product ${slug}:`, error);
      return null;
    }
  },

  async getById(id: string | number) {
    try {
      const response = await fetch(`/api/admin/products/${id}/`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch product by ID");
      return await response.json() as Product;
    } catch (error) {
      console.error(`Error fetching product ID ${id}:`, error);
      return null;
    }
  },

  async getByCategory(categorySlug: string, options?: { company?: string }) {
    try {
      let url = `${API_BASE}/products/?category=${categorySlug}`;
      if (options?.company) url += `&company=${options.company}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products by category");
      return await response.json() as Product[];
    } catch (error) {
      console.error(`Error fetching products for category ${categorySlug}:`, error);
      return [];
    }
  },

  // Admin methods (should probably be in a separate admin service, but keeping here for now)
  async create(productData: Partial<Product>) {
    const response = await fetch("/api/admin/products/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData) || "Failed to create product");
    }
    return await response.json();
  },

  async update(id: string | number, productData: Partial<Product>) {
    const response = await fetch(`/api/admin/products/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData) || "Failed to update product");
    }
    return await response.json();
  },

  async delete(id: string | number) {
    const response = await fetch(`/api/admin/products/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData) || "Failed to delete product");
    }
  }
};
