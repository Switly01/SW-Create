import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const dist = resolve(import.meta.dirname, "../dist");

async function builtAppSource() {
  const files = await readdir(resolve(dist, "assets"));
  const scripts = files.filter((file) => /^main-.*\.js$/.test(file));
  assert.equal(scripts.length, 1);
  return readFile(resolve(dist, "assets", scripts[0]), "utf8");
}

test("SW Create üretim paketi ana deneyimi içerir", async () => {
  const source = await builtAppSource();
  assert.match(source, /SW CREATE/);
  assert.match(source, /FİKRİN/);
  assert.match(source, /SW CREATE EDITION/);
  assert.doesNotMatch(source, /Your site is taking shape/);
});

test("hesap, kullanıcı, plan ve yasal sayfa girişleri üretilir", async () => {
  for (const path of ["account", "home", "center", "dashboard", "plans", "privacy", "terms"]) {
    const html = await readFile(resolve(dist, path, "index.html"), "utf8");
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html, /type="module"/);
  }
});

test("üretim paketi SW Identity 1.7 ve abonelik kataloğunu içerir", async () => {
  const source = await builtAppSource();
  const migration = await readFile(resolve(import.meta.dirname, "../migrations/0011_plan_catalog_and_ticket_numbers.sql"), "utf8");
  assert.match(source, /SW IDENTITY/);
  assert.match(source, /1\.7\.0/);
  assert.match(source, /ABONELİK ALTYAPISI HAZIR/);
  assert.match(migration, /SW Create Product Pro Edition/);
  assert.match(migration, /Play Streamers Product Pro/);
  assert.match(source, /Şifremi unuttum/);
});
