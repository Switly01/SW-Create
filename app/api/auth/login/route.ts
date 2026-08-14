export async function POST() {
  return Response.json(
    { error: "SW hesabı artık güvenli SW Identity girişi kullanıyor.", signIn: "/signin-with-chatgpt?return_to=%2Faccount" },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
