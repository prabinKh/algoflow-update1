import { handleApiError } from "./utils";

export interface HeroSpec {
  label: string;
  value: string;
}

export interface HeroContent {
  id?: number;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  link?: string;
  specs: HeroSpec[];
}

export const heroService = {
  getSettings: async (options?: { company?: string }): Promise<HeroContent | null> => {
    try {
      const url = options?.company ? `/api/store/hero-settings/?company=${options.company}` : "/api/store/hero-settings/";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch hero settings");
      const data = await response.json();
      // Django returns a list, we want the first one or null
      if (Array.isArray(data) && data.length > 0) {
        const hero = data[0];
        return {
          id: hero.id,
          title: hero.title,
          subtitle: hero.subtitle || hero.description || "",
          description: hero.description || hero.subtitle || "",
          image: hero.image,
          link: hero.link || "/shop",
          specs: hero.specs || [] // Ensure specs exists
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching hero settings:", error);
      return null;
    }
  },

  updateSettings: async (data: HeroContent): Promise<void> => {
    try {
      const response = await fetch("/api/admin/hero-settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update hero settings");
    } catch (error) {
      handleApiError(error);
    }
  }
};
