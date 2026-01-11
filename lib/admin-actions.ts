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

/**
 * Updates the specified user's role and performs related cleanup when a user is banned.
 *
 * If `role` is `"banned"`, all sessions for that user are deleted and the admin users page cache is revalidated.
 *
 * @param userId - The ID of the user to update
 * @param role - The new role to assign (for example: `"admin"`, `"user"`, `"banned"`)
 * @returns The updated user record as stored in the database
 */
export async function updateUserRole(userId: string, role: string) {
    await checkAdmin();

    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { role }
        });

        if (role === "banned") {
            const deleteResult = await tx.session.deleteMany({
                where: { userId }
            });
            console.log(`Revoked ${deleteResult.count} session(s) for banned user: ${userId}`);
        }

        return updatedUser;
    });

    revalidatePath("/admin/users");
    return result;
}

export async function getReports() {
    await checkAdmin();
    return prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            reporter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true
                }
            },
            topic: {
                select: {
                    id: true,
                    title: true,
                    moderated: true
                }
            },
            comment: {
                select: {
                    id: true,
                    content: true,
                    moderated: true
                }
            }
        }
    });
}

export async function updateReportStatus(reportId: string, status: string) {
    await checkAdmin();
    const result = await prisma.$transaction(async (tx) => {
        const report = await tx.report.update({
            where: { id: reportId },
            data: { status },
            include: {
                topic: { select: { id: true } },
                comment: { select: { id: true, topicId: true } }
            }
        });

        if (status === "resolved") {
            if (report.topicId) {
                await tx.topic.update({
                    where: { id: report.topicId },
                    data: { moderated: true }
                });
            } else if (report.commentId) {
                await tx.comment.update({
                    where: { id: report.commentId },
                    data: { moderated: true }
                });
            }
        } else if (status === "pending" || status === "dismissed") {
            if (report.topicId) {
                await tx.topic.update({
                    where: { id: report.topicId },
                    data: { moderated: false }
                });
            } else if (report.commentId) {
                await tx.comment.update({
                    where: { id: report.commentId },
                    data: { moderated: false }
                });
            }
        }
        return report;
    });

    revalidatePath("/admin/reports");
    if (result.topicId) {
        revalidatePath(`/topic/${result.topicId}`);
    } else if (result.comment && result.comment.topicId) {
        revalidatePath(`/topic/${result.comment.topicId}`);
    }

    return result;
}