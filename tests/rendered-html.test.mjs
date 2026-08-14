import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: { prepare() { return { bind() { return this; }, first: async () => null, all: async () => ({ results: [] }), run: async () => ({ success: true }) }; } },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("SW Create ana sayfasını sunucu tarafında üretir", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /SW CREATE/);
  assert.match(html, /FİKRİN/);
  assert.match(html, /SW CREATE EDITION/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("hesap ve yasal sayfalar erişilebilir", async () => {
  for (const path of ["/account", "/privacy", "/terms"]) {
    const response = await render(path);
    assert.equal(response.status, 200);
  }
});

test("hesap sayfası güvenli SW Identity girişini sunar", async () => {
  const response = await render("/account");
  const html = await response.text();
  assert.match(html, /SW IDENTITY/);
  assert.match(html, /ChatGPT ile güvenli giriş/);
  assert.match(html, /signin-with-chatgpt/);
  assert.doesNotMatch(html, /type="password"/);
});
