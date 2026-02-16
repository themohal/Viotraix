import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

const VARIANT_MAP: Record<string, string | undefined> = {
  single: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_SINGLE,
  basic: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_BASIC,
  pro: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_PRO,
};

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !VARIANT_MAP[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const variantId = VARIANT_MAP[tier];
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!variantId || !storeId || !apiKey) {
      return NextResponse.json(
        { error: "Payment configuration missing" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: auth.user.email,
              custom: {
                user_id: auth.user.id,
                tier: tier,
              },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const checkoutUrl = data.data?.attributes?.url;

    return NextResponse.json({ checkoutUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
