export interface StaffRole {
  id: string | number;
  name: string;
  permissions: string[];
}

export interface StaffMember {
  id: string | number;
  user: string; // User ID
  role: string | number; // Role ID
  user_details?: {
    id: string;
    email: string;
    name: string;
  };
  role_details?: StaffRole;
}

export const staffService = {
  async getRoles(): Promise<StaffRole[]> {
    const response = await fetch("/api/admin/staff-roles/", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch roles");
    return response.json();
  },

  async getMembers(): Promise<StaffMember[]> {
    const response = await fetch("/api/admin/staff-members/", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch staff members");
    return response.json();
  },

  async createRole(data: Partial<StaffRole>) {
    const response = await fetch("/api/admin/staff-roles/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create role");
    return response.json();
  },

  async updateRole(id: string | number, data: Partial<StaffRole>) {
    const response = await fetch(`/api/admin/staff-roles/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update role");
    return response.json();
  },

  async deleteRole(id: string | number) {
    const response = await fetch(`/api/admin/staff-roles/${id}/`, { 
      method: "DELETE",
      credentials: "include"
    });
    if (!response.ok) throw new Error("Failed to delete role");
  },

  async createMember(data: Partial<StaffMember>) {
    const response = await fetch("/api/admin/staff-members/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create staff member");
    return response.json();
  },

  async updateMember(id: string | number, data: Partial<StaffMember>) {
    const response = await fetch(`/api/admin/staff-members/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update staff member");
    return response.json();
  },

  async deleteMember(id: string | number) {
    const response = await fetch(`/api/admin/staff-members/${id}/`, { 
      method: "DELETE",
      credentials: "include"
    });
    if (!response.ok) throw new Error("Failed to delete staff member");
  },
};
