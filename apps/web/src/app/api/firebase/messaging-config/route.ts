import { NextResponse } from "next/server";
import { getFirebasePublicConfig, isFirebaseClientReady } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Config pública para o service worker (apenas NEXT_PUBLIC_*).
 * Sem autenticação — valores já são públicos no bundle do cliente.
 */
export async function GET() {
  const config = getFirebasePublicConfig();
  if (!config || !isFirebaseClientReady()) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "Firebase Messaging não configurado." } },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        config: {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
          ...(config.measurementId ? { measurementId: config.measurementId } : {}),
        },
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
