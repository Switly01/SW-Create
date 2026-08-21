export const API_BASE = (import.meta.env.VITE_SW_API_URL || "https://api.swcreate.com").replace(/\/$/, "");

export type SwAccount = {
  user: {
    id: string;
    email: string | null;
    username: string;
    displayName: string;
    birthDate?: string | null;
    createdAt: number;
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
};

export type SwSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: "open" | "answered" | "closed";
  createdAt: number;
  updatedAt: number;
  lastReplyAt: number | null;
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
};

export type SwNotificationSync = {
  version: string;
  notifications: SwNotification[];
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const flowId = crypto.randomUUID();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      "x-sw-flow-id": flowId,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "İşlem şu anda tamamlanamadı.");
  return data;
}
