import { accountFromRequest, authJson } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const account = await accountFromRequest(request);
    return account ? authJson(account) : authJson({ error: "Oturum bulunamadı." }, 401);
  } catch (error) {
    console.error("SW account error", error);
    return authJson({ error: "Hesap bilgileri şu anda alınamıyor." }, 503);
  }
}
