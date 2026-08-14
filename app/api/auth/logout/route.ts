export async function POST() {
  return Response.json(
    { error: "Güvenli çıkış adresini kullan.", signOut: "/signout-with-chatgpt?return_to=%2F" },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
