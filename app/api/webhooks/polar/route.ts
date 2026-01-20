import { Webhooks } from "@polar-sh/nextjs";
import prisma from "@/lib/prisma";

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("POLAR_WEBHOOK_SECRET is required in production");
    } else {
        console.error("POLAR_WEBHOOK_SECRET is missing. Webhooks will not work.");
    }
}

export const POST = Webhooks({
    webhookSecret: webhookSecret || "",
    onPayload: async (payload) => {
        const { type, data } = payload;

        console.log(`[Polar Webhook] Received event: ${type}`);

        if (type === "subscription.created" || type === "subscription.updated") {
            const subscription = data as any;
            const userId = subscription.metadata?.userId;

            if (!userId) {
                console.warn(`[Polar Webhook] Missing userId in metadata for event ${type}. SubId: ${subscription.id}`);
            }

            if (userId) {
                try {
                    // Using updateMany to avoid exceptions if user is missing
                    await prisma.user.updateMany({
                        where: { id: userId },
                        data: {
                            subscriptionStatus: subscription.status,
                            polarSubscriptionId: subscription.id,
                        },
                    });
                    console.log(`[Polar Webhook] Updated subscription for user ${userId}: ${subscription.status}`);
                } catch (error) {
                    console.error(`[Polar Webhook] Failed to update user ${userId}. SubId: ${subscription.id}, Status: ${subscription.status}`, error);
                }
            }
        }

        if (type === "subscription.revoked") {
            const subscription = data as any;
            const userId = subscription.metadata?.userId;

            if (!userId) {
                console.warn(`[Polar Webhook] Missing userId in metadata for revocation. SubId: ${subscription.id}`);
            }

            if (userId) {
                try {
                    await prisma.user.updateMany({
                        where: { id: userId },
                        data: {
                            subscriptionStatus: "revoked",
                        },
                    });
                    console.log(`[Polar Webhook] Revoked subscription for user ${userId}`);
                } catch (error) {
                    console.error(`[Polar Webhook] Failed to revoke subscription for user ${userId}. SubId: ${subscription.id}`, error);
                }
            }
        }
    },
});
