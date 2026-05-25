export interface UserActivity {
  id?: string | number;
  uid: string | null;
  email: string | null;
  pageType: string;
  path: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
  userAgent: string;
  screenResolution: string;
}

import { getTenantHeaders } from "@/lib/tenant";

export const userActivityService = {
  log: async (activity: Omit<UserActivity, "timestamp" | "userAgent" | "screenResolution">) => {
    try {
      const fullActivity = {
        ...activity,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };
      const response = await fetch("/api/admin/activity/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getTenantHeaders() },
        credentials: "include",
        body: JSON.stringify(fullActivity),
      });
      if (!response.ok) throw new Error("Failed to log activity");
      return await response.json();
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  },

  async getAll() {
    try {
      const response = await fetch("/api/admin/activity/", {
        headers: getTenantHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activities");
      return await response.json() as UserActivity[];
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  },

  async getByUser(userId: string | number) {
    try {
      const response = await fetch(`/api/admin/activity/?uid=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch activities for user");
      return await response.json() as UserActivity[];
    } catch (error) {
      console.error(`Error fetching activities for user ${userId}:`, error);
      return [];
    }
  },
};
