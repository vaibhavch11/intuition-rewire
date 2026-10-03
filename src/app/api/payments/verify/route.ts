import { isSameOrigin } from "@/lib/admin/auth";
import { getSignedInUser } from "@/lib/auth/session";
import { isRazorpayConfigured, isValidPaymentSignature } from "@/lib/payments/razorpay";

/**
 * Confirms a finished Checkout really came from Razorpay by checking its
 * signature. Support payments unlock nothing, so a valid signature is all the
 * page needs before thanking the user.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  if (!isRazorpayConfigured()) {
    return Response.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  }
  if (!(await getSignedInUser())) {
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const field = (name: string) =>
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>)[name] === "string"
      ? ((body as Record<string, string>)[name] as string)
      : "";
  const orderId = field("razorpay_order_id");
  const paymentId = field("razorpay_payment_id");
  const signature = field("razorpay_signature");
  if (!orderId || !paymentId || !signature) {
    return Response.json({ error: "Missing payment details." }, { status: 400 });
  }

  if (!(await isValidPaymentSignature(orderId, paymentId, signature))) {
    return Response.json({ error: "This payment couldn't be verified." }, { status: 400 });
  }
  return Response.json({ ok: true, paymentId });
}
