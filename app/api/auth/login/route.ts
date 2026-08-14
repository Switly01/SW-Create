import { accountFromRequest, authJson, createSession, createSessionCookie, getDb, passwordDigest, safeEqual, validateWriteOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!validateWriteOrigin(request)) return authJson({ error: "Geçersiz istek kaynağı." }, 403);
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await getDb().prepare("SELECT id, password_hash AS passwordHash, password_salt AS passwordSalt FROM sw_users WHERE email = ? LIMIT 1").bind(email).first<{ id: string; passwordHash: string; passwordSalt: string }>();
    const candidate = user ? await passwordDigest(password, user.passwordSalt) : await passwordDigest(password || "invalid-password", "invalid-salt");
    if (!user || !safeEqual(candidate, user.passwordHash)) return authJson({ error: "E-posta veya şifre hatalı." }, 401);
    const token = await createSession(user.id);
    const cookie = createSessionCookie(token);
    const sessionRequest = new Request(request.url, { headers: { cookie } });
    const account = await accountFromRequest(sessionRequest);
    return authJson(account, 200, cookie);
  } catch (error) {
    console.error("SW login error", error);
    return authJson({ error: "Giriş şu anda tamamlanamadı." }, 500);
  }
}
