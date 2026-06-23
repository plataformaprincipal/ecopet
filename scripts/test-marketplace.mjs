/**
 * Testes marketplace EcoPet — catálogo real, auth gate, favoritos, carrinho.
 */
const WEB = process.env.WEB_URL || "http://localhost:3000";

function assert(c, m) { if (!c) throw new Error(m); }

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const tests = [
  {
    name: "visitante vê produtos via /api/marketplace/products",
    async run() {
      const r = await req("/api/marketplace/products");
      assert(r.status === 200 && r.data.success, JSON.stringify(r.data));
      assert(Array.isArray(r.data.data.products), "products array");
    },
  },
  {
    name: "visitante vê serviços via /api/marketplace/services",
    async run() {
      const r = await req("/api/marketplace/services");
      assert(r.status === 200 && r.data.success, JSON.stringify(r.data));
      assert(Array.isArray(r.data.data.services), "services array");
    },
  },
  {
    name: "visitante vê parceiros via /api/marketplace/partners",
    async run() {
      const r = await req("/api/marketplace/partners");
      assert(r.status === 200 && r.data.success, JSON.stringify(r.data));
      assert(Array.isArray(r.data.data.partners), "partners array");
    },
  },
  {
    name: "visitante bloqueado ao favoritar (401)",
    async run() {
      const r = await req("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ productId: "fake-id" }),
      });
      assert(r.status === 401, `expected 401 got ${r.status}`);
    },
  },
  {
    name: "visitante bloqueado ao adicionar carrinho autenticado (401 ou cookie session)",
    async run() {
      const r = await req("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: "fake-id", quantity: 1 }),
      });
      assert(r.status === 404 || r.status === 401 || r.status === 400, `status ${r.status}`);
    },
  },
  {
    name: "busca global /api/marketplace/search",
    async run() {
      const r = await req("/api/marketplace/search?q=pet");
      assert(r.status === 200 && r.data.success, JSON.stringify(r.data));
    },
  },
  {
    name: "/marketplace/produtos responde",
    async run() {
      const res = await fetch(`${WEB}/marketplace/produtos`, { redirect: "manual" });
      assert(res.status === 200 || res.status === 307, `status ${res.status}`);
    },
  },
  {
    name: "/favoritos redireciona",
    async run() {
      const res = await fetch(`${WEB}/favoritos`, { redirect: "manual" });
      assert(res.status === 307 || res.status === 308, `status ${res.status}`);
    },
  },
];

async function main() {
  let passed = 0;
  for (const t of tests) {
    try {
      await t.run();
      console.log(`✓ ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`✗ ${t.name}: ${e.message}`);
    }
  }
  console.log(`\nMarketplace: ${passed}/${tests.length} passed`);
  if (passed < tests.length) process.exit(1);
}

main();
