import { type Customer } from "@/types/admin";
import { getTenantHeaders } from "@/lib/tenant";

export const customerService = {
  async getAll() {
    try {
      const response = await fetch("/api/admin/customers/");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return await response.json() as Customer[];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },

  async getById(id: string | number, email?: string | null) {
    try {
      const url = email 
        ? `/api/admin/customers/${id}/?email=${encodeURIComponent(email)}` 
        : `/api/admin/customers/${id}/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch customer");
      return await response.json() as Customer;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      return null;
    }
  },

  async update(id: string | number, customerData: Partial<Customer>) {
    try {
      const response = await fetch(`/api/admin/customers/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) throw new Error("Failed to update customer");
      return await response.json();
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      throw error;
    }
  },

  async updateCart(userId: string | number, cartItems: unknown[]) {
    try {
      const response = await fetch(`/api/admin/customers/${userId}/sync_cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getTenantHeaders() },
        credentials: "include",
        body: JSON.stringify({ cartItems }),
      });
      if (!response.ok) throw new Error("Failed to sync cart");
      return await response.json();
    } catch (error) {
      console.error(`Error syncing cart for user ${userId}:`, error);
      throw error;
    }
  },

  async clearCart(userId: string | number) {
    try {
      const response = await fetch(`/api/admin/customers/${userId}/sync_cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cartItems: [] }),
      });
      if (!response.ok) throw new Error("Failed to clear cart");
      return await response.json();
    } catch (error) {
      console.error(`Error clearing cart for user ${userId}:`, error);
      throw error;
    }
  },

  async syncWishlist(userId: string | number, wishlistItems: unknown[]) {
    try {
      const response = await fetch(`/api/admin/customers/${userId}/sync_wishlist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistItems }),
      });
      if (!response.ok) throw new Error("Failed to sync wishlist");
      return await response.json();
    } catch (error) {
      console.error(`Error syncing wishlist for user ${userId}:`, error);
      throw error;
    }
  },

  async delete(id: string | number) {
    try {
      const response = await fetch(`/api/admin/customers/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete customer");
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      throw error;
    }
  }
};
