const API_BASE = "/api/store";
const ADMIN_API_BASE = "/api/admin";

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  categories?: any[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const brandService = {
  // Public endpoints
  async getAll(categorySlug?: string) {
    try {
      const url = new URL(`${API_BASE}/brands/`, window.location.origin);
      if (categorySlug) {
        url.searchParams.append('category', categorySlug);
      }
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch brands");
      return await response.json() as Brand[];
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await fetch(`${API_BASE}/brands/${slug}/`);
      if (!response.ok) throw new Error("Failed to fetch brand");
      return await response.json() as Brand;
    } catch (error) {
      console.error(`Error fetching brand ${slug}:`, error);
      return null;
    }
  },

  // Admin endpoints
  async createBrand(data: Partial<Brand>) {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/brands/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create brand");
      }
      return await response.json() as Brand;
    } catch (error) {
      console.error("Error creating brand:", error);
      throw error;
    }
  },

  async updateBrand(slug: string, data: Partial<Brand>) {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/brands/${slug}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update brand");
      }
      return await response.json() as Brand;
    } catch (error) {
      console.error("Error updating brand:", error);
      throw error;
    }
  },

  async deleteBrand(slug: string) {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/brands/${slug}/`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete brand");
      }
      return true;
    } catch (error) {
      console.error("Error deleting brand:", error);
      throw error;
    }
  },

  async getAllAdmin(search?: string) {
    try {
      const url = new URL(`${ADMIN_API_BASE}/brands/`, window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      const response = await fetch(url.toString(), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch brands");
      return await response.json() as Brand[];
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },
};
