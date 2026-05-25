import { handleApiError } from "./utils";

export const uploadService = {
  uploadImage: async (file: File, path: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);

      const response = await fetch("/api/admin/upload/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();
      return data.url;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  uploadModel: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-model/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload model");
      const data = await response.json();
      return data.url;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
