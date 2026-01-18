import { Webhooks } from "@polar-sh/nextjs";
import prisma from "@/lib/prisma";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET || "",
    onPayload: async (payload) => {
        const { type, data } = payload;

        console.log(`[Polar Webhook] Received event: ${type}`);

        // Adjust based on actual Polar webhook payload structure
        // Usually metadata is under 'metadata' field if provided during checkout
        if (type === "subscription.created" || type === "subscription.updated") {
            const subscription = data as any;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionStatus: subscription.status,
                        polarSubscriptionId: subscription.id,
                    },
                });
                console.log(`[Polar Webhook] Updated subscription for user ${userId}: ${subscription.status}`);
            }
        }

        if (type === "subscription.revoked") {
            const subscription = data as any;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionStatus: "revoked",
                    },
                });
                console.log(`[Polar Webhook] Revoked subscription for user ${userId}`);
            }
        }
    },
});
