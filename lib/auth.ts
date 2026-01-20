import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "https://frank-seasnail-suited.ngrok-free.app",
        "http://localhost:3000"
    ],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    user: {
        additionalFields: {
            bio: {
                type: "string",
                required: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false
            }
        }
    },
    plugins: [
        username()
    ],
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    if (!user.username) {
                        // Auto-generate username from name or email
                        const base = user.name?.split(" ")[0].toLowerCase() || "user";
                        const random = Math.floor(1000 + Math.random() * 9000);
                        user.username = `${base}${random}`;
                    }
                    return {
                        data: user
                    };
                }
            }
        },
        session: {
            create: {
                before: async (session) => {
                    const user = await prisma.user.findUnique({
                        where: { id: session.userId }
                    });
                    if (user?.role === "banned") {
                        throw new Error("Your account has been banned.");
                    }
                    return {
                        data: session
                    };
                }
            }
        }
    }
});
