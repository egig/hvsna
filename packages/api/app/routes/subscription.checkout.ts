import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createCheckout } from "@/lib/lemonsqueezy";
import { requireAuth } from "@/lib/require-auth";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireAuth(request);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new ApiError(401, "TOKEN_EXPIRED", "User no longer exists");
    }

    const url = await createCheckout({
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    });

    return jsonOk({ url });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
