import { getChatGPTUser } from "@/app/chatgpt-auth";
import { updateSwProfile } from "@/lib/sw-identity";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function PUT(request: Request) {
  if (!validOrigin(request)) return json({ error: "Geçersiz istek kaynağı." }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Oturum bulunamadı." }, 401);

  try {
    const body = await request.json() as { displayName?: string };
    const profile = await updateSwProfile(user, String(body.displayName || ""));
    return json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil kaydedilemedi.";
    const status = message.includes("2–48") ? 400 : 503;
    return json({ error: message }, status);
  }
}
