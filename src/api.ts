export const API_BASE = (import.meta.env.VITE_SW_API_URL || "https://api.swcreate.com").replace(/\/$/, "");

export type SwAccount = {
  user: {
    id: string;
    email: string | null;
    username: string;
    displayName: string;
    birthDate?: string | null;
    createdAt: number;
    avatar: {
      type: "preset" | "custom";
      value: string;
      url: string | null;
    };
  };
  entitlements: Array<{
    product: string;
    slug: string;
    tier: string;
  }>;
  security: {
    identityVersion: string;
    twoFactorEnabled: boolean;
    dataFlowProtection: "verified";
  };
  connections: Array<{
    provider: "sw-create" | "play-streamers" | "google" | "kick";
    label: string;
    connected: boolean;
    detail: string;
  }>;
};

export type SwTwoFactorChallenge = {
  twoFactorRequired: true;
  challengeId: string;
  expiresAt: string;
};

export type SwSupportMessage = {
  id: string;
  sender: "user" | "support";
  body: string;
  createdAt: number;
  attachments: SwSupportAttachment[];
};

export type SwSupportAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
};

export type SwDevice = {
  id: string;
  current: boolean;
  userAgent: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  location: { city: string | null; region: string | null; country: string | null; latitude: number | null; longitude: number | null };
};

export type SwSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: "open" | "answered" | "closed";
  createdAt: number;
  updatedAt: number;
  lastReplyAt: number | null;
  mailStatus: "pending" | "sent" | "failed";
  messages: SwSupportMessage[];
};

export type SwNotification = {
  id: string;
  type: "release" | "support-submitted" | "support-answered";
  title: string;
  body: string;
  target: "updates" | "support";
  ticketId?: string;
  createdAt: number;
  read: boolean;
};

export type SwNotificationSync = {
  version: string;
  notifications: SwNotification[];
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const flowId = crypto.randomUUID();
  const formBody = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      "x-sw-flow-id": flowId,
      ...(init.body && !formBody ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "İşlem şu anda tamamlanamadı.");
  return data;
}
