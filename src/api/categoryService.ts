import { type Category } from "@/lib/types";
import { getTenantHeaders } from "@/lib/tenant";

const API_BASE = "/api/store";

export const categoryService = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/categories/`, {
        headers: { ...getTenantHeaders(), Accept: 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json() as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await fetch(`${API_BASE}/categories/${slug}/`, {
        headers: { ...getTenantHeaders(), Accept: 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch category");
      return await response.json() as Category;
    } catch (error) {
      console.error(`Error fetching category ${slug}:`, error);
      return null;
    }
  },

  async getFeatures(categorySlug: string) {
    try {
      // In the new Django backend, features are in CategoryFeature model
      const response = await fetch(`/api/admin/category-features/`, { credentials: "include" });
      if (!response.ok) return null;
      const all = await response.json();
      // Django's CategoryFeature has category_name or category (id)
      return Array.isArray(all) ? all.find((f) => f?.category_slug === categorySlug || f?.category === categorySlug) ?? null : null;
    } catch (error) {
      console.error(`Error fetching features for ${categorySlug}:`, error);
      return null;
    }
  },

  async updateFeatures(categorySlug: string, featureData: any) {
    try {
      const payload = {
        ...featureData,
        category_slug: categorySlug
      };

      const response = await fetch("/api/admin/category-features/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(err) || "Failed to update features");
      }
      return await response.json();
    } catch (error: any) {
      console.error(`Error updating features for ${categorySlug}:`, error);
      throw error;
    }
  },

  async create(categoryData: Partial<Category>) {
    const response = await fetch("/api/admin/categories/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData) || "Failed to create category");
    }
    return await response.json();
  },

  async update(slug: string, categoryData: Partial<Category>) {
    const response = await fetch(`/api/admin/categories/${slug}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData) || "Failed to update category");
    }
    return await response.json();
  },

  async delete(slug: string) {
    const response = await fetch(`/api/admin/categories/${slug}/`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete category");
    return true;
  },

  async getAllFeatures() {
    try {
      const response = await fetch("/api/admin/category-features/", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch all features");
      return await response.json();
    } catch (error) {
      console.error("Error fetching all features:", error);
      return [];
    }
  },

  async deleteFeatures(categorySlug: string) {
    // We can delete all features by updating with an empty list
    await this.updateFeatures(categorySlug, { features: [] });
  }
};
