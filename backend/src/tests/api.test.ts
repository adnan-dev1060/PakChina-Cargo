/**
 * End-to-end API test against an in-memory MongoDB (no credentials needed).
 *   npm run test:api
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AddressInfo } from "node:net";
import { MongoMemoryServer } from "mongodb-memory-server";
import { useProjectTempDir } from "./memory-temp.js";

const ORIGIN = "http://localhost:5173";
const ADMIN = { email: "owner@example.test", password: "TestPassw0rd!" };

useProjectTempDir();
const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri("pcc_test");

Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URI: uri,
  JWT_ACCESS_SECRET: "test-secret-".padEnd(64, "x"),
  CORS_ORIGINS: ORIGIN,
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
});

// Run the real seed script against the in-memory database.
// Async on purpose: blocking this process would stall the in-memory mongod it manages.
const seedRun = await promisify(execFile)(process.execPath, ["--import", "tsx", "src/seed/seed.ts"], {
  env: { ...process.env, SEED_ADMIN_NAME: "Owner", SEED_ADMIN_EMAIL: ADMIN.email, SEED_ADMIN_PASSWORD: ADMIN.password },
});
process.stdout.write(seedRun.stdout);

const { connectDB, disconnectDB } = await import("../config/db.js");
const { createApp } = await import("../app.js");
await connectDB(uri);
const server = createApp().listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

/* ------------------------------ tiny client ------------------------------ */
class Client {
  cookies = new Map<string, string>();
  async req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const isForm = body instanceof FormData;
    const res = await fetch(base + path, {
      method,
      headers: {
        Origin: ORIGIN,
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
        ...headers,
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (v === "" || /Expires=Thu, 01 Jan 1970/i.test(c)) this.cookies.delete(k);
      else this.cookies.set(k, v);
    }
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, data: json?.data };
  }
}

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

const anon = new Client();
const admin = new Client();

try {
  console.log("\nPublic API");
  await test("health", async () => {
    assert.equal((await anon.req("GET", "/health")).status, 200);
  });
  await test("singletons are seeded", async () => {
    const s = await anon.req("GET", "/settings");
    assert.equal(s.data.companyName, "Pak China Cargo");
    assert.equal((await anon.req("GET", "/home")).data.sections.length, 11);
    assert.ok((await anon.req("GET", "/about")).data.mission);
  });
  await test("collections are seeded and return ids", async () => {
    const services = (await anon.req("GET", "/services")).data;
    assert.equal(services.length, 6);
    assert.ok(services[0].id && !services[0]._id && !("__v" in services[0]));
    assert.equal((await anon.req("GET", "/routes")).data.length, 3);
    assert.equal((await anon.req("GET", "/faqs")).data.length, 6);
  });
  await test("public content is revalidated on every visit (admin saves show at once)", async () => {
    const res = await fetch(`${base}/services`);
    assert.equal(res.headers.get("cache-control"), "public, no-cache");
    assert.equal(res.headers.get("content-encoding"), "gzip");
    const etag = res.headers.get("etag");
    assert.ok(etag);
    // Node's fetch adds "Cache-Control: no-cache" to conditional requests unless one is given,
    // which makes servers skip the 304. Browsers revalidating their cache don't send it.
    const again = await fetch(`${base}/services`, { headers: { "If-None-Match": etag, "Cache-Control": "max-age=0" } });
    assert.equal(again.status, 304);
  });
  await test("service by slug / 404", async () => {
    assert.equal((await anon.req("GET", "/services/air-freight")).data.title, "Air Freight");
    assert.equal((await anon.req("GET", "/services/nope")).status, 404);
  });

  console.log("\nAuth");
  await test("admin routes require login", async () => {
    assert.equal((await anon.req("GET", "/admin/stats")).status, 401);
  });
  await test("wrong password is rejected", async () => {
    assert.equal((await anon.req("POST", "/auth/login", { ...ADMIN, password: "wrong" })).status, 401);
    assert.equal((await anon.req("POST", "/auth/login", { email: "nobody@example.test", password: "x" })).status, 401);
  });
  await test("login sets httpOnly cookies and never returns the hash", async () => {
    const r = await admin.req("POST", "/auth/login", ADMIN);
    assert.equal(r.status, 200);
    assert.equal(r.data.user.email, ADMIN.email);
    assert.equal(r.data.user.passwordHash, undefined);
    assert.ok(admin.cookies.has("pcc_at") && admin.cookies.has("pcc_rt"));
    assert.equal((await admin.req("GET", "/auth/me")).data.user.role, "super_admin");
  });
  await test("writes from a foreign origin are blocked", async () => {
    const r = await admin.req("PUT", "/admin/content/settings", {}, { Origin: "https://evil.example" });
    assert.equal(r.status, 403);
  });
  await test("refresh rotates the token; reusing the old one revokes the session", async () => {
    const oldRt = admin.cookies.get("pcc_rt")!;
    assert.equal((await admin.req("POST", "/auth/refresh")).status, 200);
    assert.notEqual(admin.cookies.get("pcc_rt"), oldRt);
    const thief = new Client();
    thief.cookies.set("pcc_rt", oldRt);
    assert.equal((await thief.req("POST", "/auth/refresh")).status, 401);
    // The whole family is now revoked, so the legitimate token fails too → must log in again.
    assert.equal((await admin.req("POST", "/auth/refresh")).status, 401);
    assert.equal((await admin.req("POST", "/auth/login", ADMIN)).status, 200);
  });

  console.log("\nContent management");
  let newId = "";
  const svc = {
    slug: "express-courier",
    title: "Express Courier",
    summary: "Small parcels from China in days.",
    description: ["Door-to-door courier for documents and small parcels."],
    icon: "package",
    imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55",
    features: ["Tracking", "Fast"],
    published: false,
  };
  await test("invalid service is rejected with a clear message", async () => {
    const r = await admin.req("POST", "/admin/content/services", { ...svc, slug: "Bad Slug", imageUrl: "javascript:alert(1)" });
    assert.equal(r.status, 400);
    assert.ok(r.body.errors.some((e: { path: string }) => e.path === "slug"));
    assert.ok(r.body.errors.some((e: { path: string }) => e.path === "imageUrl"));
  });
  await test("create unpublished service → hidden publicly, appended to the end", async () => {
    const r = await admin.req("POST", "/admin/content/services", svc);
    assert.equal(r.status, 201);
    newId = r.data.id;
    assert.equal(r.data.order, 7); // seed orders are 1..6
    assert.equal((await anon.req("GET", "/services")).data.length, 6);
    assert.equal((await anon.req("GET", "/services/express-courier")).status, 404);
    assert.equal((await admin.req("GET", "/admin/content/services")).data.length, 7);
  });
  await test("duplicate slug → 409", async () => {
    assert.equal((await admin.req("POST", "/admin/content/services", svc)).status, 409);
  });
  await test("publish → visible publicly", async () => {
    assert.equal((await admin.req("PATCH", `/admin/content/services/${newId}/publish`, { published: true })).status, 200);
    assert.equal((await anon.req("GET", "/services/express-courier")).data.title, "Express Courier");
  });
  await test("update (PUT) replaces the item", async () => {
    const r = await admin.req("PUT", `/admin/content/services/${newId}`, { ...svc, title: "Express Parcel", published: true, order: 7 });
    assert.equal(r.data.title, "Express Parcel");
    assert.equal((await anon.req("GET", "/services/express-courier")).data.title, "Express Parcel");
  });
  await test("reorder moves the new service to the top", async () => {
    const all = (await admin.req("GET", "/admin/content/services")).data as { id: string }[];
    const ids = [newId, ...all.map((s) => s.id).filter((id) => id !== newId)];
    assert.equal((await admin.req("PUT", "/admin/content/services/reorder", { ids })).status, 200);
    assert.equal((await anon.req("GET", "/services")).data[0].slug, "express-courier");
  });
  await test("delete", async () => {
    assert.equal((await admin.req("DELETE", `/admin/content/services/${newId}`)).status, 200);
    assert.equal((await anon.req("GET", "/services")).data.length, 6);
    assert.equal((await admin.req("DELETE", `/admin/content/services/${newId}`)).status, 404);
    assert.equal((await admin.req("GET", "/admin/content/services/not-an-id")).status, 400);
  });
  await test("site settings update is reflected publicly", async () => {
    const current = (await admin.req("GET", "/admin/content/settings")).data;
    const r = await admin.req("PUT", "/admin/content/settings", { ...current, email: "info@example.test", whatsappNumber: "+92 300 1234567" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const pub = (await anon.req("GET", "/settings")).data;
    assert.equal(pub.email, "info@example.test");
    assert.equal(pub.whatsappNumber, "923001234567");
  });
  await test("homepage section can be switched off", async () => {
    const home = (await admin.req("GET", "/admin/content/home")).data;
    home.sections.find((s: { key: string }) => s.key === "faq").enabled = false;
    assert.equal((await admin.req("PUT", "/admin/content/home", home)).status, 200);
    const pub = (await anon.req("GET", "/home")).data;
    assert.equal(pub.sections.find((s: { key: string }) => s.key === "faq").enabled, false);
  });

  console.log("\nEvery content type round-trips through the admin");
  // Saving an item exactly as the admin loaded it must always succeed. This catches mismatches
  // between stored data and validation (e.g. empty optional fields coming back as null).
  const COLLECTION_KEYS = ["offices", "shipping-modes", "services", "routes", "commodities", "process-steps", "highlights", "testimonials", "faqs", "updates"];
  await test("testimonial and update can be created next to the sample ones", async () => {
    const t = await admin.req("POST", "/admin/content/testimonials", { name: "Bilal", quote: "Goods arrived on time.", rating: 5, company: "", city: "" });
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const u = await admin.req("POST", "/admin/content/updates", { slug: "new-air-route", title: "New air route", excerpt: "Weekly flights from Guangzhou.", publishedAt: "2026-11-01", externalUrl: "" });
    assert.equal(u.status, 201, JSON.stringify(u.body));
    assert.equal((await anon.req("GET", "/testimonials")).data.length, 2);
    const updates = (await anon.req("GET", "/updates")).data as { title: string }[];
    assert.ok(updates.some((x) => x.title === "New air route"));
  });
  for (const key of COLLECTION_KEYS) {
    await test(`${key}: every item saves back unchanged and the publish switch works`, async () => {
      const items = (await admin.req("GET", `/admin/content/${key}`)).data as { id: string; published: boolean }[];
      assert.ok(items.length > 0, "no items to test");
      for (const item of items) {
        const r = await admin.req("PUT", `/admin/content/${key}/${item.id}`, item);
        assert.equal(r.status, 200, `${key}/${item.id}: ${JSON.stringify(r.body)}`);
      }
      const before = (await anon.req("GET", `/${key}`)).data.length;
      const first = items[0];
      assert.equal((await admin.req("PATCH", `/admin/content/${key}/${first.id}/publish`, { published: false })).status, 200);
      assert.equal((await anon.req("GET", `/${key}`)).data.length, before - 1);
      assert.equal((await admin.req("PATCH", `/admin/content/${key}/${first.id}/publish`, { published: true })).status, 200);
      assert.equal((await anon.req("GET", `/${key}`)).data.length, before);
    });
  }
  for (const key of ["settings", "home", "about"]) {
    await test(`${key}: saves back unchanged`, async () => {
      const data = (await admin.req("GET", `/admin/content/${key}`)).data;
      const r = await admin.req("PUT", `/admin/content/${key}`, data);
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.deepEqual((await anon.req("GET", `/${key}`)).data, r.data);
    });
  }

  console.log("\nInquiries");
  const inquiry = { name: "Ali Khan", phone: "0300 1234567", city: "Lahore", mode: "air", cargoType: "Mobile accessories, 50 kg", message: "From Guangzhou" };
  await test("public submission is stored", async () => {
    assert.equal((await anon.req("POST", "/inquiries", inquiry)).status, 201);
  });
  await test("invalid submission → 400", async () => {
    assert.equal((await anon.req("POST", "/inquiries", { ...inquiry, phone: "12" })).status, 400);
  });
  await test("honeypot submissions are silently dropped", async () => {
    assert.equal((await anon.req("POST", "/inquiries", { ...inquiry, website: "spam.example" })).status, 201);
  });
  await test("admin inbox: list, search, update status", async () => {
    const list = (await admin.req("GET", "/admin/inquiries")).data;
    assert.equal(list.total, 1);
    assert.equal((await admin.req("GET", "/admin/inquiries?q=guangzhou")).data.total, 0); // message isn't searched
    assert.equal((await admin.req("GET", "/admin/inquiries?q=ali")).data.total, 1);
    const id = list.items[0].id;
    const r = await admin.req("PATCH", `/admin/inquiries/${id}`, { status: "replied", notes: "Called back" });
    assert.equal(r.data.status, "replied");
    assert.equal((await admin.req("GET", "/admin/stats")).data.newInquiries, 0);
  });
  await test("admin can delete an inquiry", async () => {
    const id = (await admin.req("GET", "/admin/inquiries")).data.items[0].id;
    assert.equal((await admin.req("DELETE", `/admin/inquiries/${id}`)).status, 200);
    assert.equal((await admin.req("GET", `/admin/inquiries/${id}`)).status, 404);
  });

  console.log("\nMedia uploads");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
  await test("non-image file is rejected by content, not by name", async () => {
    const form = new FormData();
    form.append("file", new Blob([Buffer.from("<script>alert(1)</script>")], { type: "image/png" }), "evil.png");
    assert.equal((await admin.req("POST", "/admin/media", form)).status, 400);
  });
  await test("real image without Cloudinary credentials → 503", async () => {
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
    form.append("folder", "services");
    assert.equal((await admin.req("POST", "/admin/media", form)).status, 503);
  });
  await test("upload requires login", async () => {
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
    assert.equal((await anon.req("POST", "/admin/media", form)).status, 401);
  });
  await test("alt text can be edited; an image in use can't be deleted", async () => {
    // Cloudinary isn't available here, so add a library entry directly as an upload would.
    const { Media } = await import("../models/system.models.js");
    const url = "https://res.cloudinary.com/demo/image/upload/v1/pcc/branding/logo-test.png";
    const m = await Media.create({ url, publicId: "pcc/branding/logo-test", folder: "branding", width: 400, height: 400, bytes: 1000, format: "png" });
    const r = await admin.req("PATCH", `/admin/media/${m.id}`, { alt: "Company logo" });
    assert.equal(r.data.alt, "Company logo");
    const settings = (await admin.req("GET", "/admin/content/settings")).data;
    assert.equal((await admin.req("PUT", "/admin/content/settings", { ...settings, logoUrl: url })).status, 200);
    assert.equal((await anon.req("GET", "/settings")).data.logoUrl, url);
    const del = await admin.req("DELETE", `/admin/media/${m.id}`);
    assert.equal(del.status, 409);
    assert.deepEqual(del.body.details.usages, ["settings"]);
    assert.match(del.body.message, /Site settings/);
  });

  console.log("\nAdmin users & roles");
  const editor = new Client();
  await test("super admin creates an editor (weak password rejected)", async () => {
    assert.equal((await admin.req("POST", "/admin/users", { name: "Ed", email: "ed@example.test", password: "short" })).status, 400);
    const r = await admin.req("POST", "/admin/users", { name: "Ed", email: "ed@example.test", password: "EditorPass123" });
    assert.equal(r.status, 201);
    assert.equal(r.data.role, "editor");
  });
  await test("editor can manage content but not users", async () => {
    assert.equal((await editor.req("POST", "/auth/login", { email: "ed@example.test", password: "EditorPass123" })).status, 200);
    assert.equal((await editor.req("GET", "/admin/content/faqs")).status, 200);
    assert.equal((await editor.req("GET", "/admin/users")).status, 403);
  });
  await test("last super admin can't be demoted", async () => {
    const me = (await admin.req("GET", "/auth/me")).data.user;
    assert.equal((await admin.req("PATCH", `/admin/users/${me.id}`, { role: "editor" })).status, 400);
  });
  await test("deactivating an editor cuts access immediately", async () => {
    const users = (await admin.req("GET", "/admin/users")).data as { id: string; email: string }[];
    const ed = users.find((u) => u.email === "ed@example.test")!;
    assert.equal((await admin.req("PATCH", `/admin/users/${ed.id}`, { active: false })).status, 200);
    assert.equal((await editor.req("GET", "/admin/content/faqs")).status, 401);
  });
  await test("account locks after 5 wrong passwords", async () => {
    const c = new Client();
    for (let i = 0; i < 5; i++) await c.req("POST", "/auth/login", { ...ADMIN, password: "nope" });
    assert.equal((await c.req("POST", "/auth/login", ADMIN)).status, 429);
  });

  console.log("\nAccount");
  const sam = { name: "Sam", email: "sam@example.test", password: "SamPassword1" };
  const samClient = new Client();
  const samOtherDevice = new Client();
  await test("sign-out ends the session and its refresh token", async () => {
    assert.equal((await admin.req("POST", "/admin/users", sam)).status, 201);
    assert.equal((await samClient.req("POST", "/auth/login", sam)).status, 200);
    const refreshCookie = samClient.cookies.get("pcc_rt")!;
    assert.equal((await samClient.req("POST", "/auth/logout")).status, 200);
    assert.equal((await samClient.req("GET", "/auth/me")).status, 401);
    const replay = await anon.req("POST", "/auth/refresh", undefined, { Cookie: `pcc_rt=${refreshCookie}` });
    assert.equal(replay.status, 401);
  });
  await test("changing password needs the current one and signs out every device", async () => {
    assert.equal((await samClient.req("POST", "/auth/login", sam)).status, 200);
    assert.equal((await samOtherDevice.req("POST", "/auth/login", sam)).status, 200);
    const wrong = await samClient.req("POST", "/auth/change-password", { currentPassword: "nope-nope-1", newPassword: "NewSamPass22" });
    assert.ok(wrong.status === 400 || wrong.status === 401, `got ${wrong.status}`);
    const ok = await samClient.req("POST", "/auth/change-password", { currentPassword: sam.password, newPassword: "NewSamPass22" });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    // The other device's refresh token no longer works.
    assert.equal((await samOtherDevice.req("POST", "/auth/refresh")).status, 401);
    assert.equal((await new Client().req("POST", "/auth/login", sam)).status, 401);
    assert.equal((await new Client().req("POST", "/auth/login", { ...sam, password: "NewSamPass22" })).status, 200);
  });

  /* --------------------------- testimonial reviews --------------------------- */
  console.log("\nTestimonial reviews");
  const publicNames = async () => ((await anon.req("GET", "/testimonials")).data as { name: string }[]).map((t) => t.name);
  let reviewId = "";
  await test("a review sent from the website waits for approval and stays off the site", async () => {
    const sent = await anon.req("POST", "/testimonials", { name: "Website Client", city: "Multan", rating: 4, quote: "Fast delivery of my electronics order, very helpful team.", contact: "0300 7654321" });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    assert.ok(!(await publicNames()).includes("Website Client"));
    const list = (await admin.req("GET", "/admin/content/testimonials")).data as Record<string, unknown>[];
    const item = list.find((t) => t.name === "Website Client")!;
    assert.equal(item.status, "pending");
    assert.equal(item.source, "website");
    assert.equal(item.published, false);
    assert.equal(item.contact, "0300 7654321");
    reviewId = String(item.id);
    assert.equal((await admin.req("GET", "/admin/stats")).data.pendingTestimonials, 1);
  });
  await test("short or bot-filled reviews are refused", async () => {
    assert.equal((await anon.req("POST", "/testimonials", { name: "X", rating: 5, quote: "ok" })).status, 400);
    assert.equal((await anon.req("POST", "/testimonials", { name: "Bot", rating: 5, quote: "Buy cheap things at my website now!!", website: "spam.example" })).status, 201);
    const list = (await admin.req("GET", "/admin/content/testimonials")).data as { name: string }[];
    assert.ok(!list.some((t) => t.name === "Bot"), "honeypot submission is not stored");
  });
  await test("a waiting review can't be published or saved live without approval", async () => {
    assert.equal((await admin.req("PATCH", `/admin/content/testimonials/${reviewId}/publish`, { published: true })).status, 409);
    const item = (await admin.req("GET", `/admin/content/testimonials/${reviewId}`)).data;
    const { id: _id, createdAt: _c, updatedAt: _u, status: _s, source: _src, contact: _ct, ...editable } = item;
    assert.equal((await admin.req("PUT", `/admin/content/testimonials/${reviewId}`, { ...editable, published: true })).status, 409);
    const saved = await admin.req("PUT", `/admin/content/testimonials/${reviewId}`, { ...editable, quote: "Fast delivery of my electronics order. Very helpful team!" });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.status, "pending", "editing keeps it waiting");
    assert.equal(saved.data.contact, "0300 7654321", "editing keeps the private contact");
  });
  await test("approving publishes it without exposing private fields; rejecting hides it", async () => {
    assert.equal((await admin.req("PATCH", `/admin/content/testimonials/${reviewId}/review`, { decision: "approve" })).status, 200);
    const pub = (await anon.req("GET", "/testimonials")).data as Record<string, unknown>[];
    const shown = pub.find((t) => t.name === "Website Client");
    assert.ok(shown, "approved review is public");
    assert.equal(shown.contact, undefined);
    assert.equal(shown.status, undefined);
    assert.equal((await admin.req("PATCH", `/admin/content/testimonials/${reviewId}/review`, { decision: "reject" })).status, 200);
    assert.ok(!(await publicNames()).includes("Website Client"));
    assert.equal((await admin.req("GET", "/admin/stats")).data.pendingTestimonials, 0);
    assert.equal((await anon.req("PATCH", `/admin/content/testimonials/${reviewId}/review`, { decision: "approve" })).status, 401);
  });
  await test("a testimonial the admin adds goes live straight away", async () => {
    const made = await admin.req("POST", "/admin/content/testimonials", { name: "Admin Added", quote: "Added by the team from a phone call.", rating: 5, published: true });
    assert.equal(made.status, 201);
    assert.equal(made.data.status, "approved");
    assert.ok((await publicNames()).includes("Admin Added"));
  });

  /* ------------------------------ website pages ------------------------------ */
  const siteBase = base.replace(/\/api\/v1$/, "");
  const page = async (path: string) => {
    const res = await fetch(siteBase + path);
    return { status: res.status, html: await res.text(), headers: res.headers };
  };
  const { existsSync } = await import("node:fs");
  if (!existsSync(new URL("../../../frontend/dist/index.html", import.meta.url))) {
    console.log("  - website tests skipped: build the frontend first (npm run build --prefix frontend)");
  } else {
    await test("pages get their own title, description, canonical and preview tags", async () => {
      const home = await page("/");
      assert.equal(home.status, 200);
      assert.match(home.html, /<title data-server-seo>[^<]+<\/title>/);
      assert.match(home.html, /application\/ld\+json/);
      assert.equal((home.html.match(/<title/g) ?? []).length, 1, "only the server title remains");
      const svc = await page("/services/sea-freight");
      assert.equal(svc.status, 200);
      assert.match(svc.html, /<title data-server-seo>Sea Freight \| /);
      assert.match(svc.html, new RegExp(`rel="canonical" href="${siteBase}/services/sea-freight"`));
      assert.match(svc.html, /property="og:image"/);
      assert.equal(svc.headers.get("cache-control"), "no-cache");
    });
    await test("unknown pages return 404 and are not indexed; admin is never indexed", async () => {
      for (const p of ["/no-such-page", "/services/no-such-service"]) {
        const r = await page(p);
        assert.equal(r.status, 404, p);
        assert.match(r.html, /name="robots" content="noindex, nofollow"/);
      }
      assert.match((await page("/admin/login")).html, /name="robots" content="noindex, nofollow"/);
    });
    await test("an unpublished service disappears from its page and the sitemap", async () => {
      const list = await admin.req("GET", "/admin/content/services");
      const sea = list.data.find((s: { slug: string }) => s.slug === "sea-freight");
      await admin.req("PATCH", `/admin/content/services/${sea.id}/publish`, { published: false });
      assert.equal((await page("/services/sea-freight")).status, 404);
      assert.doesNotMatch((await page("/sitemap.xml")).html, /sea-freight/);
      await admin.req("PATCH", `/admin/content/services/${sea.id}/publish`, { published: true });
      assert.match((await page("/sitemap.xml")).html, /<loc>[^<]+\/services\/sea-freight<\/loc>/);
    });
    await test("robots.txt points to the sitemap and blocks admin", async () => {
      const r = await page("/robots.txt");
      assert.match(r.html, /Disallow: \/admin/);
      assert.match(r.html, new RegExp(`Sitemap: ${siteBase}/sitemap.xml`));
    });
    await test("build files are cached for a year; API 404s stay JSON", async () => {
      const js = /src="(\/assets\/[^"]+\.js)"/.exec((await page("/")).html)?.[1];
      assert.ok(js, "script tag found");
      assert.match((await page(js)).headers.get("cache-control") ?? "", /max-age=31536000, immutable/);
      const api404 = await fetch(`${base}/nope`);
      assert.equal(api404.status, 404);
      assert.match(api404.headers.get("content-type") ?? "", /json/);
    });
    await test("sign-in works from the site's own address and is refused from other sites", async () => {
      // ADMIN is locked by the lockout test above, so this uses Sam (password changed above).
      const samNow = { email: sam.email, password: "NewSamPass22" };
      const own = await new Client().req("POST", "/auth/login", samNow, { Origin: siteBase });
      assert.equal(own.status, 200);
      const foreign = await new Client().req("POST", "/auth/login", samNow, { Origin: "https://evil.example" });
      assert.equal(foreign.status, 403);
    });
  }

  console.log(`\nAll ${passed} tests passed.`);
} finally {
  server.close();
  await disconnectDB();
  await mongo.stop();
}
