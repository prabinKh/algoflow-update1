import { type Company } from "@/lib/types";
import { handleApiError } from "./utils";
import { getTenantHeaders } from "@/lib/tenant";

const API_BASE = "/api/companies";

export const companyService = {
  async getAll() {
    try {
      const response = await fetch(`${API_BASE}/`);
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json() as Company[];
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await fetch(`${API_BASE}/${slug}/`);
      if (!response.ok) throw new Error("Failed to fetch company");
      return await response.json() as Company;
    } catch (error) {
      console.error(`Error fetching company ${slug}:`, error);
      return null;
    }
  },

  async getCurrentCompany() {
    try {
      const headers = getTenantHeaders();
      const companySlug = headers['X-Company-Slug'];
      const response = await fetch(`/api/store/current-company/${companySlug ? `?company=${companySlug}` : ''}`, {
        headers,
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch current company");
      return await response.json() as Company;
    } catch (error) {
      console.error("Error fetching current company:", error);
      return null;
    }
  },

  async getMyCompanies() {
    try {
      const response = await fetch(`${API_BASE}/my_companies/`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch your companies");
      return await response.json() as Company[];
    } catch (error) {
      console.error("Error fetching my companies:", error);
      return [];
    }
  },

  async create(companyData: Partial<Company> & { uploaded_images?: string[] }) {
    try {
      const response = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(companyData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData) || "Failed to create company");
      }
      return await response.json() as Company;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async update(slug: string, companyData: Partial<Company> & { uploaded_images?: string[] }) {
    try {
      const response = await fetch(`${API_BASE}/${slug}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(companyData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData) || "Failed to update company");
      }
      return await response.json() as Company;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
