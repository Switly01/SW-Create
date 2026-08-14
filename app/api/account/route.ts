import { getChatGPTUser } from "@/app/chatgpt-auth";
import { loadSwAccount } from "@/lib/sw-identity";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Oturum bulunamadı." }, { status: 401 });

  try {
    const account = await loadSwAccount(user);
    return Response.json(account, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("SW account error", error);
    return Response.json({ error: "Hesap bilgileri şu anda alınamıyor." }, { status: 503 });
  }
}
