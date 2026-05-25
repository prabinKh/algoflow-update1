import { handleApiError } from "./utils";
import {
  getTenantHeaders,
  tenantStorageKey,
  getActiveTenantSlug,
  setActiveTenantSlug,
} from "@/lib/tenant";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password2: string;
  username?: string;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...getTenantHeaders(),
  };
}

export const authService = {
  register: async (payload: RegisterPayload) => {
    try {
      const response = await fetch("/api/account/register/", {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          const parts: string[] = [];
          for (const [field, value] of Object.entries(
            data.errors as Record<string, string | string[]>
          )) {
            const list = Array.isArray(value) ? value : [value];
            list.forEach((msg) => parts.push(`${field}: ${msg}`));
          }
          throw new Error(parts.join(" "));
        }
        throw new Error(data.message || "Registration failed");
      }
      const slug = getActiveTenantSlug();
      if (slug) setActiveTenantSlug(slug);
      return data as { success: boolean; message: string; user: { email: string; name: string } };
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch("/api/account/login/", {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to login");
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch("/api/account/logout/", {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to logout");
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  checkAuth: async () => {
    const response = await fetch("/api/account/check/", {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Not authenticated");
    }
    return data;
  },

  saveTokens(access: string, refresh: string) {
    localStorage.setItem(tenantStorageKey("access_token"), access);
    if (refresh) {
      localStorage.setItem(tenantStorageKey("refresh_token"), refresh);
    }
  },

  getAccessToken(): string | null {
    return (
      localStorage.getItem(tenantStorageKey("access_token")) ||
      localStorage.getItem("access_token")
    );
  },
};
