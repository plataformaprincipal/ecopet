import { apiSuccess, apiFailure } from "@/lib/api-response";
import {
  serializeCart,
  resolveCartForRequest,
  clearCart,
  applyCartSessionCookie,
} from "@/lib/cart/cart-service";

export async function GET() {
  const { cart, newSessionId } = await resolveCartForRequest();
  const response = apiSuccess({ cart: serializeCart(cart) });
  return applyCartSessionCookie(response, newSessionId);
}

export async function DELETE() {
  const { cart, newSessionId } = await resolveCartForRequest();
  const cleared = await clearCart(cart);
  const response = apiSuccess({ cart: serializeCart(cleared) });
  return applyCartSessionCookie(response, newSessionId);
}
