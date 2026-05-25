import { uploadService } from "./uploadService";

export interface Message {
  id?: string;
  sender: "user" | "admin" | "system" | "human" | "assistant" | "ai";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "audio" | "file";
  fileUrl?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  msg_type?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface RepairTicket {
  id: string;
  category: string;
  brand: string;
  model: string;
  status: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  updatedAt?: string;
  status: "active" | "closed" | "handoff" | "archived";
  unreadAdminCount?: number;
  unreadUserCount?: number;
  metadata?: Record<string, unknown>;
}

export const chatService = {
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await fetch("/api/chat/chat-sessions/", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch chat sessions");
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server (system is starting up or offline)");
    }
    return response.json();
  },

  getMessages: async (sessionId: string): Promise<Message[]> => {
    const response = await fetch(`/api/chat/chat-messages/?session_id=${sessionId}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch messages");
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server (system is starting up or offline)");
    }
    const data = await response.json();
    return data.map((msg: Record<string, unknown>) => ({
      ...msg,
      type: msg.msg_type // Map msg_type to type
    })) as Message[];
  },

  getOrCreateSession: async (userId: string, userEmail: string | null | undefined, userName: string) => {
    // Try to find existing active session first
    try {
      const searchResponse = await fetch(`/api/chat/chat-sessions/?guest_id=${userId}`, {
        credentials: "include",
      });
      if (searchResponse.ok) {
        const existingData = await searchResponse.json();
        if (existingData && existingData.length > 0) {
          return existingData[0].id;
        }
      }
    } catch (e) {
      console.warn("Failed to search existing chat session, continuing to create new one:", e);
    }

    const response = await fetch("/api/chat/chat-sessions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ 
        user_id_str: userId, 
        user_email: userEmail || "Guest", 
        user_name: userName, 
        status: "active" 
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Chat session creation failed:", errorData);
      throw new Error("Failed to get or create session");
    }
    const data = await response.json();
    return data.id;
  },

  subscribeToMessages: (sessionId: string, callback: (messages: Message[]) => void) => {
    // Polling fallback for real-time
    const fetchMessages = async () => {
      try {
        const msgs = await chatService.getMessages(sessionId);
        callback(msgs);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("starting up or offline")) {
          // Quietly note that the system is offline or starting up
          console.debug("Chat service polling: system is starting up or offline.");
        } else {
          console.error("Error polling messages:", error);
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  },

  markSessionAsRead: async (sessionId: string) => {
    const response = await fetch(`/api/chat/chat-sessions/${sessionId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ unreadAdminCount: 0 }),
    });
    if (!response.ok) throw new Error("Failed to mark session as read");
  },

  sendMessage: async (sessionId: string, text: string, sender: "user" | "admin" | "human" | "assistant" | "ai" = "admin", metadata?: Record<string, unknown>, attachments?: string[]) => {
    const normalizedSender = sender === "ai" ? "assistant" : sender;
    const response = await fetch("/api/chat/chat-messages/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        session: sessionId,
        sender: normalizedSender,
        text,
        msg_type: metadata?.type || "text",
        metadata: metadata || {},
        attachments: attachments || []
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to send message:", errorData);
      throw new Error("Failed to send message");
    }
    return response.json();
  },

  uploadFile: async (file: Blob | File, path: string) => {
    return uploadService.uploadImage(file as File, path); // Reusing uploadImage for general files
  },

  closeSession: async (sessionId: string) => {
    const response = await fetch(`/api/chat/chat-sessions/${sessionId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "closed" }),
    });
    if (!response.ok) throw new Error("Failed to close session");
  },

  deleteSession: async (sessionId: string) => {
    const response = await fetch(`/api/chat/chat-sessions/${sessionId}/`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete session");
  }
};
