import { isSameOrigin } from "@/lib/admin/auth";
import { getSignedInUser } from "@/lib/auth/session";
import { checkSupportAmount } from "@/lib/payments/amounts";
import {
  createSupportOrder,
  isRazorpayConfigured,
  publicKeyId,
  RazorpayError,
} from "@/lib/payments/razorpay";

/**
 * Creates a Razorpay order for a signed-in user's support payment. The amount
 * comes from the browser but is re-checked here; Checkout can only charge what
 * this order says.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  if (!isRazorpayConfigured()) {
    return Response.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  }
  const user = await getSignedInUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const amount =
    typeof body === "object" && body !== null && "amount" in body
      ? Number((body as { amount: unknown }).amount)
      : NaN;
  const invalid = checkSupportAmount(amount);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  try {
    const order = await createSupportOrder(amount, user);
    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
      email: user.email,
    });
  } catch (error) {
    const status = error instanceof RazorpayError ? error.status : 500;
    const message = error instanceof RazorpayError ? error.message : "The payment couldn't be started.";
    return Response.json({ error: message }, { status });
  }
}
