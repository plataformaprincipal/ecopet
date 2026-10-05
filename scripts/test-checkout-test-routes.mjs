import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const temp = await mkdtemp(join(root, '.checkout-test-tests-'));
let serial = 0;
const harness = { user: null, limited: false };
globalThis.__checkoutTestHarness = harness;
const mocks = {
  '@/lib/auth/guards': `export async function requireAuth() { const h=globalThis.__checkoutTestHarness; return h.user ? {user:h.user,error:null} : {user:null,error:new Response('{}',{status:401})}; }`,
  '@/lib/auth': `export async function getCurrentUser(){return globalThis.__checkoutTestHarness.user;}`,
  '@/lib/api-response': `export function apiSuccess(data,status=200){return new Response(JSON.stringify({success:true,data}),{status});} export function apiFailure(code,message,status=400){return new Response(JSON.stringify({success:false,error:{code,message}}),{status});}`,
  '@/lib/prisma': `export const prisma=new Proxy({}, {get(_,k){return globalThis.__checkoutTestHarness.db[k]}});`,
  '@/lib/mercado-pago/checkout-test-rate-limit': `export async function checkCheckoutTestRateLimit(){return !globalThis.__checkoutTestHarness.limited;}`,
  '@/lib/commerce/checkout-flags': `export function assertCheckoutEnabled(){}`,
  '@/lib/commerce/apply-coupon': `export class CouponError extends Error {}`,
  '@/lib/pricing/service': `export class PricingError extends Error {}`,
  '@/lib/mercado-pago/test-client': `export async function createTestMercadoPagoOrder(body,key){return globalThis.__checkoutTestHarness.createRemote(body,key);} export async function getTestMercadoPagoOrder(id){return globalThis.__checkoutTestHarness.getRemote(id);} export async function getTestMercadoPagoInstallments(){return {ok:true,data:[]}}; export async function getTestMercadoPagoPaymentMethods(){return {ok:true,data:[]}};`,
  'next/navigation': `export function redirect(path){throw Error('REDIRECT:'+path)};`,
  '@/components/features/marketplace/checkout-test-panel': `export function CheckoutTestPanel(){return null}`,
  '@/components/features/marketplace/checkout-test-banner': `export function CheckoutTestBanner(){return null}`,
  '@/components/features/marketplace/checkout-test-payment-poller': `export function CheckoutTestPaymentPoller(){return null}`,
  '@/components/ui/button': `export function Button(){return null}`,
  '@/components/ui/card': `export function Card(){return null} export function CardContent(){return null}`,
  'next/link': `export default function Link(){return null}`,
  'server-only': '',
};
async function load(path, overrides={}) {
  const all={...mocks,...overrides};
  const result=await build({ entryPoints:[resolve(root,path)], bundle:true, platform:'node', format:'esm', packages:'external', jsx:'automatic', write:false, tsconfig:resolve(root,'apps/web/tsconfig.json'), plugins:[{name:'fixture-dependencies',setup(b){b.onResolve({filter:/.*/},args=>Object.hasOwn(all,args.path)?{path:args.path,namespace:'fixture'}:null); b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:all[args.path],loader:'js'}));}}] });
  const file=join(temp,`${serial++}.mjs`);await writeFile(file,result.outputFiles[0].text);return import(pathToFileURL(file));
}
function credentials(enabled=true){process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN=enabled?'TEST-fixture-access-only':'';process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY=enabled?'TEST-fixture-public-only':'';}
function fixtureOrder(){return {id:'test-order',userId:'user',orderNumber:1001,total:0,status:'PENDING',deliveryNotes:'[CHECKOUT-TEST]',pricingSnapshot:{checkoutTest:true,isolated:true,testAmount:10},items:[],payments:[]};}
const savedEnv={...process.env};
try {
await test('All TEST APIs reject anonymous callers before database/provider work', async()=>{
  harness.user=null;harness.db=new Proxy({}, {get(){throw Error('anonymous DB access')}});
  for(const path of ['route.ts','mercado-pago/config/route.ts','mercado-pago/payment-methods/route.ts','mercado-pago/installments/route.ts','mercado-pago/order/route.ts','mercado-pago/order/[id]/route.ts']){
    const route=await load('apps/web/src/app/api/checkout-test/'+path);
    const res=await (route.POST??route.GET)(new Request('https://fixture/api',{method:'POST',body:'{}'}),{params:Promise.resolve({id:'test-order'})});
    assert.equal(res.status,401,path);
  }
});
await test('TEST config accepts all authenticated roles; fails closed on missing/non-TEST credentials',async()=>{
  const route=await load('apps/web/src/app/api/checkout-test/mercado-pago/config/route.ts');
  for(const role of ['ADMIN','CLIENT','TUTOR','PARTNER','ONG','VET','GROOMER']){harness.user={id:'user',role};credentials(); const res=await route.GET(); assert.equal(res.status,200,role);assert.ok(!JSON.stringify(await res.json()).includes('fixture-access'));}
  credentials(false);assert.equal((await route.GET()).status,503);
  credentials();process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN='APP_USR-invalid';assert.equal((await route.GET()).status,503);
  credentials();process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY='APP_USR-invalid';assert.equal((await route.GET()).status,503);
  credentials();harness.limited=true;assert.equal((await route.GET()).status,429);harness.limited=false;
});
await test('Existing Order is reused across refresh/concurrent calls without stock/cart/coupon/financial effects',async()=>{
  credentials();harness.user={id:'user',role:'CLIENT'};let persisted=null,creates=0;let queue=Promise.resolve();
  const tx={
    $executeRaw:async()=>0,
    order:{findFirst:async()=>persisted,aggregate:async()=>({_max:{orderNumber:1000}}),create:async({data})=>{creates++;assert.equal(data.total,0);assert.equal(data.platformFeeAmount,0);assert.equal(data.partnerAmount,0);assert.equal(data.fulfillmentBlocked,true);assert.equal(data.partnerId,undefined);assert.ok(data.items.create.every(i=>!i.productId&&!i.partnerId));persisted={...data,id:'test-order',items:data.items.create,payments:[]};return persisted;}},
    cart:{findUnique:async()=>({items:[{quantity:1,itemType:'product',product:{name:'Fixture',price:10,status:'ACTIVE',approvalStatus:'APPROVED'}}]})},
  };
  harness.db={$transaction:(fn)=>{const run=queue.then(()=>fn(tx));queue=run.catch(()=>{});return run;}};
  const {checkoutTestFromCart}=await load('apps/web/src/lib/mercado-pago/checkout-test-service.ts');
  const input={userId:'user',deliveryMethod:'PICKUP_LOCAL',phone:'fixture',notes:'[CHECKOUT-TEST]',address:{}};
  const results=await Promise.all(Array.from({length:8},()=>checkoutTestFromCart(input)));
  assert.equal(creates,1);assert.ok(results.every(o=>o.id==='test-order'&&o.total===10));assert.equal(persisted.total,0);
});
await test('Payment idempotency and ownership use TEST only; approval never marks real Order PAID',async()=>{
  credentials();let payment=null;const keys=[];const order=fixtureOrder();
  harness.db={
    order:{findUnique:async()=>({...order,payments:payment?[payment]:[]})},
    payment:{upsert:async({create})=>payment??=( {...create,id:'test-payment'}),findUnique:async()=>({...payment,order}),update:async({data})=>payment={...payment,...data}},
    paymentEvent:{create:async()=>({})},
  };
  harness.createRemote=async(body,key)=>{keys.push(key);assert.equal(body.total_amount,'10.00');return {ok:true,data:{id:'mp-test',status:'processed',status_detail:'accredited'}};};
  harness.getRemote=async()=>({ok:true,data:{id:'mp-test',status:'processed',status_detail:'accredited'}});
  const api=await load('apps/web/src/lib/mercado-pago/create-checkout-test-order.ts');
  const input={userId:'user',orderId:'test-order',paymentMethodId:'pix',payerEmail:'fixture@example.invalid'};
  await assert.rejects(()=>api.createMercadoPagoCheckoutTestOrder({...input,userId:'another'}),/ORDER_FORBIDDEN/);
  await Promise.all([api.createMercadoPagoCheckoutTestOrder(input),api.createMercadoPagoCheckoutTestOrder(input)]);
  assert.equal(new Set(keys).size,1);assert.equal(payment.environment,'test');assert.equal(payment.amount,0);assert.equal(payment.status,'TEST_APPROVED');assert.equal(order.status,'PENDING');
  await assert.rejects(()=>api.createMercadoPagoCheckoutTestOrder(input),/ALREADY_PAID/);
});
await test('TEST order lookup cannot read another user order',async()=>{
  credentials();harness.user={id:'user'};harness.db={payment:{findFirst:async({where})=>{assert.equal(where.userId,'user');return null;}}};
  const route=await load('apps/web/src/app/api/checkout-test/mercado-pago/order/[id]/route.ts');
  assert.equal((await route.GET(new Request('https://fixture/api/order/other?as=order'),{params:Promise.resolve({id:'other'})})).status,403);
});
await test('Both TEST pages execute authentication and ownership checks',async()=>{
  const checkout=await load('apps/web/src/app/(app)/checkout-test/page.tsx');
  const success=await load('apps/web/src/app/(app)/checkout-test/sucesso/[orderId]/page.tsx');
  harness.user=null;
  await assert.rejects(()=>checkout.default(), /REDIRECT:\/login\?callbackUrl=\/checkout-test/);
  await assert.rejects(()=>success.default({params:Promise.resolve({orderId:'other'})}), /REDIRECT:\/login\?callbackUrl=\/checkout-test/);
  for(const role of ['CLIENT','ADMIN','PARTNER','ONG']){
    harness.user={id:'user',role};harness.db={order:{findFirst:async({where})=>{assert.equal(where.userId,'user');return null;}}};
    assert.ok(await checkout.default());assert.ok(await success.default({params:Promise.resolve({orderId:'other'})}));
  }
});
await test('Both TEST pages keep login redirect and noindex; LIVE files remain outside test service',async()=>{
  for(const file of ['apps/web/src/app/(app)/checkout-test/page.tsx','apps/web/src/app/(app)/checkout-test/sucesso/[orderId]/page.tsx']){const text=await readFile(join(root,file),'utf8');assert.ok(text.includes('redirect("/login?callbackUrl=/checkout-test")'));assert.ok(text.includes('index: false'));assert.ok(!text.includes('UserRole.ADMIN'));}
  const {canAccessRoute,isAdminOnlyPath}=await load('apps/web/src/lib/edge/permissions.ts');
  for(const role of ['ADMIN','CLIENT','PARTNER','ONG','VET','GROOMER','TUTOR']){assert.equal(canAccessRoute(role,'/checkout-test'),true);assert.equal(canAccessRoute(role,'/checkout-test/sucesso/order'),true);}
  assert.equal(isAdminOnlyPath('/checkout-test'),false);assert.equal(isAdminOnlyPath('/admin'),true);
});
await test('TEST rate limit is fail-closed and conservative',async()=>{
  const {checkCheckoutTestRateLimit}=await load('apps/web/src/lib/mercado-pago/checkout-test-rate-limit.ts');
  harness.db={$transaction:async()=>{throw Error('DB unavailable')}};assert.equal(await checkCheckoutTestRateLimit('fixture',3,60000),false);
  let bucket=null;harness.db={$transaction:async(fn)=>fn({$executeRaw:async()=>0,rateLimitBucket:{findUnique:async()=>bucket,upsert:async({create})=>bucket=create,update:async()=>bucket.count++}})};
  assert.equal(await checkCheckoutTestRateLimit('fixture',3,60000),true);assert.equal(await checkCheckoutTestRateLimit('fixture',3,60000),true);assert.equal(await checkCheckoutTestRateLimit('fixture',3,60000),true);assert.equal(await checkCheckoutTestRateLimit('fixture',3,60000),false);
});
} finally { process.env=savedEnv;delete globalThis.__checkoutTestHarness;await rm(temp,{recursive:true,force:true}); }
