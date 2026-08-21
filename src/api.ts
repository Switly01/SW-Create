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
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "İşlem şu anda tamamlanamadı.");
  return data;
}
