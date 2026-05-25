export const repairService = {
  async getAll() {
    try {
      const response = await fetch("/api/admin/service-tickets/", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch service tickets");
      return await response.json();
    } catch (error) {
      console.error("Error fetching service tickets:", error);
      return [];
    }
  },

  async getById(id: string | number) {
    try {
      const response = await fetch(`/api/admin/service-tickets/${id}/`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch service ticket");
      return await response.json();
    } catch (error) {
      console.error(`Error fetching service ticket ${id}:`, error);
      return null;
    }
  },

  async create(ticketData: Record<string, unknown>) {
    try {
      const response = await fetch("/api/admin/service-tickets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) throw new Error("Failed to create service ticket");
      return await response.json();
    } catch (error) {
      console.error("Error creating service ticket:", error);
      throw error;
    }
  },

  async updateStatus(id: string | number, status: string) {
    try {
      const response = await fetch(`/api/admin/service-tickets/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update service ticket status");
      return await response.json();
    } catch (error) {
      console.error(`Error updating service ticket ${id} status:`, error);
      throw error;
    }
  },

  async getByUser(userId: string | number) {
    try {
      const response = await fetch(`/api/admin/service-tickets/?user_id=${userId}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch service tickets for user");
      return await response.json();
    } catch (error) {
      console.error(`Error fetching service tickets for user ${userId}:`, error);
      return [];
    }
  },

  async delete(id: string | number) {
    try {
      const response = await fetch(`/api/admin/service-tickets/${id}/`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to delete service ticket");
    } catch (error) {
      console.error(`Error deleting service ticket ${id}:`, error);
      throw error;
    }
  }
};
