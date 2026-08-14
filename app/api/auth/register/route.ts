export async function POST() {
  return Response.json(
    { error: "Yeni SW hesapları güvenli SW Identity ile otomatik oluşturulur.", signIn: "/signin-with-chatgpt?return_to=%2Faccount" },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
