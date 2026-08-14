import { authJson, clearSessionCookie, getDb, readSessionToken, sha256, validateWriteOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!validateWriteOrigin(request)) return authJson({ error: "Geçersiz istek kaynağı." }, 403);
  const token = readSessionToken(request);
  if (token) await getDb().prepare("DELETE FROM sw_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return authJson({ ok: true }, 200, clearSessionCookie());
}
