"use server";
import { auth } from "./auth";
import { headers } from "next/headers";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getUsers() {
    await checkAdmin();
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            image: true,
            username: true
        }
    });
}

export async function updateUserRole(userId: string, role: string) {
    await checkAdmin();
    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role }
    });
    revalidatePath("/admin/users");
    return updated;
}
