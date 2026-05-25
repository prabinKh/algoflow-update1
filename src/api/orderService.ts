import { type Order } from "@/types/admin";
import { getTenantHeaders } from "@/lib/tenant";

export const orderService = {
  async getAll() {
    try {
      const response = await fetch("/api/admin/orders/");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return await response.json() as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  async getById(id: string | number) {
    try {
      const response = await fetch(`/api/admin/orders/${id}/`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return await response.json() as Order;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      return null;
    }
  },

  async create(orderData: Partial<Order>) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getTenantHeaders(),
      };

      const response = await fetch("/api/store/orders/create/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(orderData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (data as { error?: string }).error ||
          (data as { detail?: string }).detail ||
          "Failed to create order";
        throw new Error(message);
      }
      return data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async update(id: string | number, orderData: Partial<Order>) {
    try {
      const response = await fetch(`/api/admin/orders/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  },

  async updateStatus(id: string | number, status: string) {
    try {
      const response = await fetch(`/api/admin/orders/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  },

  async updatePaymentStatus(id: string | number, paymentStatus: string) {
    try {
      const response = await fetch(`/api/admin/orders/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!response.ok) throw new Error("Failed to update payment status");
      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${id} payment status:`, error);
      throw error;
    }
  },

  async getByUser() {
    try {
      const response = await fetch("/api/store/orders/my-orders/");
      if (!response.ok) throw new Error("Failed to fetch my orders");
      return await response.json() as Order[];
    } catch (error) {
      console.error("Error fetching my orders:", error);
      return [];
    }
  },

  async delete(id: string | number) {
    try {
      const response = await fetch(`/api/admin/orders/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete order");
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  }
};
