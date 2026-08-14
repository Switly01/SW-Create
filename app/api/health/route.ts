import { authJson, getDb } from "@/lib/auth";

export async function GET() {
  try {
    await getDb().prepare("SELECT 1 AS ok").first();
    return authJson({ ok: true, service: "swcreate", database: "connected" });
  } catch {
    return authJson({ ok: false, service: "swcreate", database: "unavailable" }, 503);
  }
}
