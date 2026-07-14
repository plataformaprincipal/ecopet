/**
 * Test-only fake providers. Guarded so they cannot load in production.
 * Import from `@/lib/integrations/fakes` only inside NODE_ENV=test suites.
 */

function assertTestEnv(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Fake integration providers are only available when NODE_ENV=test");
  }
}

export class FakeAIProvider {
  readonly name = "fake-ai";
  constructor(private readonly reply = "Resposta de teste EcoPet AI.") {
    assertTestEnv();
  }
  async generate(input: string): Promise<{ content: string; provider: string }> {
    return { content: `${this.reply} (eco: ${input.slice(0, 40)})`, provider: this.name };
  }
}

export class FakeEmailProvider {
  readonly name = "fake-email";
  readonly sent: Array<{ to: string; subject: string }> = [];
  constructor() {
    assertTestEnv();
  }
  async send(params: { to: string; subject: string; html: string }) {
    this.sent.push({ to: params.to, subject: params.subject });
    return { sent: true as const, id: `fake-email-${this.sent.length}` };
  }
}

export class FakeSmsProvider {
  readonly name = "fake-sms";
  readonly sent: Array<{ to: string; body: string }> = [];
  constructor() {
    assertTestEnv();
  }
  async send(params: { to: string; body: string }) {
    this.sent.push(params);
    return { sent: true as const, messageSid: `fake-sms-${this.sent.length}` };
  }
}

export class FakeUploadProvider {
  readonly name = "fake-upload";
  constructor() {
    assertTestEnv();
  }
  async upload(params: { fileName: string }) {
    return {
      url: `https://test.invalid/uploads/${encodeURIComponent(params.fileName)}`,
      publicId: `fake/${params.fileName}`,
      provider: "fake-upload" as const,
    };
  }
}

export class FakePaymentProvider {
  readonly name = "fake-payment";
  constructor() {
    assertTestEnv();
  }
  async createPaymentIntent(params: { amountCents: number; currency?: string }) {
    return {
      id: `fake_pi_${Date.now()}`,
      status: "PENDING_CONFIRMATION" as const,
      amountCents: params.amountCents,
      currency: params.currency ?? "BRL",
      provider: this.name,
    };
  }
}
