'use server';

import prisma from './prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { headers } from 'next/headers';
import { pusherServer } from './pusher';

/**
 * Prevents banned users from performing actions by validating the session.
 *
 * @param session - The current user session object (may be `null`). Expected shape: `{ user?: { role?: string | null } }`.
 * @throws Error with message "Your account has been banned. You cannot perform this action." when `session.user.role` is `'banned'`.
 */
function verifyNotBanned(session: { user?: { role?: string | null } } | null) {
    if (session?.user?.role === 'banned') {
        throw new Error("Your account has been banned. You cannot perform this action.");
    }
}

/**
 * Fetches all categories including a count of topics for each category.
 *
 * @returns An array of category records where each item includes a `_count` object with `topics` indicating the number of topics in that category.
 */
export async function getCategories() {
    return await prisma.category.findMany({
        include: {
            _count: {
                select: { topics: true }
            }
        }
    });
}

export async function getTopics(categoryId?: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const isAdmin = (session?.user as any)?.role === 'admin';

    const topics = await prisma.topic.findMany({
        where: {
            ...(categoryId ? { categoryId } : {}),
            ...(isAdmin ? {} : { moderated: false })
        },
        include: {
            category: true,
            author: true,
            _count: {
                select: { comments: true }
            },
            votes: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return topics.map(t => ({
        ...t,
        voteCount: t.votes.reduce((acc, v) => acc + v.value, 0),
        userVote: t.votes.find(v => v.userId === session?.user.id)?.value || 0
    }));
}

/**
 * Fetches a topic by id and returns a presentation-ready object with aggregated vote data, user-specific vote, author role, and processed nested comments.
 *
 * The returned topic includes: `authorRole`, `voteCount` (sum of vote values), `userVote` (current session user's vote or 0), and `comments` where each comment and its nested replies include `author`, `authorId`, `authorRole`, `avatar`, `timeAgo`, `voteCount`, `userVote`, and `replies`. If a topic's or comment author's role is `'banned'`, that item's `content` is returned as `null`.
 *
 * @param id - The topic's unique identifier
 * @returns The transformed topic object with aggregated fields and processed comments, or `null` if no topic with the given `id` exists
 */
export async function getTopicById(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const topic = await prisma.topic.findUnique({
        where: { id },
        include: {
            category: true,
            author: true,
            votes: true,
            comments: {
                where: { parentId: null },
                include: {
                    author: true,
                    votes: true,
                    replies: {
                        include: {
                            author: true,
                            votes: true,
                            replies: {
                                include: {
                                    author: true,
                                    votes: true,
                                    replies: {
                                        include: {
                                            author: true,
                                            votes: true,
                                            replies: {
                                                include: {
                                                    author: true,
                                                    votes: true,
                                                    replies: {
                                                        include: {
                                                            author: true,
                                                            votes: true,
                                                            replies: {
                                                                include: {
                                                                    author: true,
                                                                    votes: true
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });

    if (!topic) return null;

    const processComment = (c: any): any => ({
        ...c,
        content: (c.author.role === 'banned' || c.moderated) ? null : c.content,
        author: c.author.name,
        authorId: c.authorId,
        authorRole: c.author.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.name}`,
        timeAgo: new Date(c.createdAt).toLocaleDateString(),
        voteCount: c.votes.reduce((acc: number, v: any) => acc + v.value, 0),
        userVote: c.votes.find((v: any) => v.userId === session?.user.id)?.value || 0,
        replies: c.replies?.map(processComment),
        moderated: c.moderated
    });

    return {
        ...topic,
        content: (topic.author.role === 'banned' || topic.moderated) ? null : topic.content,
        authorRole: topic.author.role,
        voteCount: topic.votes.reduce((acc, v) => acc + v.value, 0),
        userVote: topic.votes.find(v => v.userId === session?.user.id)?.value || 0,
        comments: topic.comments.map(processComment),
        moderated: topic.moderated
    };
}

/**
 * Toggle or set the current user's vote on a topic, update the aggregated vote count, and notify clients.
 *
 * If the user has an existing vote with the same value the vote is removed; if the value differs the vote is updated; if no vote exists a new one is created. Afterward the topic's vote total is aggregated, a real-time update is emitted, and relevant pages are revalidated.
 *
 * @param topicId - The ID of the topic to vote on
 * @param value - The vote value to apply (typically `1` for upvote or `-1` for downvote)
 * @throws Error - "Unauthorized" if there is no active session
 * @throws Error - If the user's account is banned (message: "Your account has been banned. You cannot perform this action.")
 */
export async function voteTopic(topicId: string, value: number) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");
    verifyNotBanned(session);

    const existingVote = await prisma.vote.findUnique({
        where: {
            userId_topicId: {
                userId: session.user.id,
                topicId
            }
        }
    });

    if (existingVote) {
        if (existingVote.value === value) {
            // Remove vote if clicking same button
            await prisma.vote.delete({ where: { id: existingVote.id } });
        } else {
            // Change vote direction
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { value }
            });
        }
    } else {
        await prisma.vote.create({
            data: {
                userId: session.user.id,
                topicId,
                value
            }
        });
    }

    const votes = await prisma.vote.aggregate({
        where: { topicId },
        _sum: { value: true }
    });

    await pusherServer.trigger(`topic-${topicId}`, 'new-vote', {
        id: topicId,
        type: 'topic',
        votes: votes._sum.value || 0
    });

    revalidatePath(`/`);
    revalidatePath(`/topic/${topicId}`);
}

/**
 * Casts, updates, or toggles the current user's vote on a comment and notifies listeners.
 *
 * Toggles the user's existing vote if the same value is submitted, updates it if different, or creates a new vote if none exists; after updating the database it emits a real-time `new-vote` event for the comment on the topic channel and revalidates the topic page.
 *
 * @param commentId - The ID of the comment to vote on
 * @param value - The vote value (use `1` for upvote, `-1` for downvote)
 * @param topicId - The ID of the topic containing the comment (used for event channel and revalidation)
 * @throws Error - If there is no authenticated session ("Unauthorized")
 * @throws Error - If the current user is banned (message: "Your account has been banned. You cannot perform this action.")
 */
export async function voteComment(commentId: string, value: number, topicId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");
    verifyNotBanned(session);

    const existingVote = await prisma.vote.findUnique({
        where: {
            userId_commentId: {
                userId: session.user.id,
                commentId
            }
        }
    });

    if (existingVote) {
        if (existingVote.value === value) {
            await prisma.vote.delete({ where: { id: existingVote.id } });
        } else {
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { value }
            });
        }
    } else {
        await prisma.vote.create({
            data: {
                userId: session.user.id,
                commentId,
                value
            }
        });
    }

    const votes = await prisma.vote.aggregate({
        where: { commentId },
        _sum: { value: true }
    });

    await pusherServer.trigger(`topic-${topicId}`, 'new-vote', {
        id: commentId,
        type: 'comment',
        votes: votes._sum.value || 0
    });

    revalidatePath(`/topic/${topicId}`);
}
/**
 * Creates a new topic from submitted form data and returns the created topic.
 *
 * @param formData - FormData containing 'title', 'content', and 'categoryId' fields.
 * @returns The newly created topic record.
 * @throws Error - If the user is not authenticated ("Unauthorized").
 * @throws Error - If the user's account is banned ("Your account has been banned. You cannot perform this action.").
 */
export async function createTopic(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

    verifyNotBanned(session);

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const categoryId = formData.get('categoryId') as string;

    const topic = await prisma.topic.create({
        data: {
            title,
            content,
            authorId: session.user.id,
            categoryId
        }
    });

    revalidatePath('/');
    return topic;
}

/**
 * Creates a new comment for a topic (optionally as a reply) and broadcasts it in real time.
 *
 * @param formData - FormData containing `content` (string), `topicId` (string), and optional `parentId` (string or null)
 * @returns The created comment object augmented with `author` (name), `authorId`, `timeAgo`, `avatar`, `voteCount` (0), `userVote` (0), and `replies` (empty array)
 * @throws Error - "Unauthorized" if there is no active session
 * @throws Error - "Your account has been banned. You cannot perform this action." if the current user is banned
 */
export async function createComment(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

    verifyNotBanned(session);

    const content = formData.get('content') as string;
    const topicId = formData.get('topicId') as string;
    const parentId = formData.get('parentId') as string | null;

    const comment = await prisma.comment.create({
        data: {
            content,
            topicId,
            parentId: parentId || null,
            authorId: session.user.id
        },
        include: {
            author: true
        }
    });

    const commentWithData = {
        ...comment,
        author: comment.author.name,
        authorId: comment.authorId,
        timeAgo: new Date(comment.createdAt).toLocaleDateString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.name}`,
        voteCount: 0,
        userVote: 0,
        replies: []
    };

    await pusherServer.trigger(`topic-${topicId}`, 'new-comment', commentWithData);

    revalidatePath(`/topic/${topicId}`);
    return commentWithData;
}

/**
 * Marks a comment as deleted (soft delete) when performed by the comment's author, notifies subscribers, and revalidates the topic page.
 *
 * @param commentId - The ID of the comment to mark as deleted.
 * @param topicId - The ID of the parent topic used for broadcasting the update and revalidating the topic page.
 * @throws "Unauthorized" when there is no authenticated session.
 * @throws "Comment not found" when no comment exists with the given `commentId`.
 * @throws "You can only delete your own comments" when the current user is not the comment's author.
 * @returns An object with `success: true` if the comment was successfully marked as deleted.
 */
export async function deleteComment(commentId: string, topicId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    verifyNotBanned(session);

    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== session.user.id) {
        throw new Error("You can only delete your own comments");
    }

    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { isDeleted: true },
        include: { author: true }
    });

    const commentData = {
        ...updatedComment,
        author: updatedComment.author.name,
        authorId: updatedComment.authorId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${updatedComment.author.name}`,
        timeAgo: new Date(updatedComment.createdAt).toLocaleDateString(),
        // Vote counts might ideally be preserved or reset? User didn't specify. Keeping them is easier for now.
        // Actually I don't need to return vote count if client just updates the 'isDeleted' flag.
    };

    await pusherServer.trigger(`topic-${topicId}`, 'comment-updated', {
        id: commentId,
        isDeleted: true
    });

    revalidatePath(`/topic/${topicId}`);
    return { success: true };
}

/**
 * Creates a report for a topic.
 *
 * @param topicId - The ID of the topic being reported
 * @param reason - The reason for reporting the topic
 * @returns An object with `success: true` if the report was created
 * @throws Error - "Unauthorized" if there is no active session
 * @throws Error - "Reason is required" if reason is empty after trimming
 * @throws Error - "Topic not found" if the topic does not exist
 */
export async function reportTopic(topicId: string, reason: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");
    verifyNotBanned(session);

    const trimmedReason = reason.trim();
    if (!trimmedReason) throw new Error("Reason is required");

    const topic = await prisma.topic.findUnique({
        where: { id: topicId }
    });
    if (!topic) throw new Error("Topic not found");

    // Deduplication - only block if a 'pending' report from this user exists
    const existingPendingReport = await prisma.report.findFirst({
        where: {
            reporterId: session.user.id,
            topicId,
            status: "pending"
        }
    });

    if (existingPendingReport) {
        console.log(`[reportTopic] User ${session.user.id} already has a pending report for topic ${topicId}`);
        return { success: true, alreadyReported: true };
    }

    await prisma.report.create({
        data: {
            topicId,
            reason: trimmedReason,
            reporterId: session.user.id,
        }
    });

    console.log(`[reportTopic] Created new report for topic ${topicId} by user ${session.user.id}`);
    revalidatePath("/admin/reports");
    return { success: true };
}

/**
 * Creates a report for a comment.
 *
 * @param commentId - The ID of the comment being reported
 * @param reason - The reason for reporting the comment
 * @returns An object with `success: true` if the report was created
 * @throws Error - "Unauthorized" if there is no active session
 * @throws Error - "Reason is required" if reason is empty after trimming
 * @throws Error - "Comment not found" if the comment does not exist
 */
export async function reportComment(commentId: string, reason: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");
    verifyNotBanned(session);

    const trimmedReason = reason.trim();
    if (!trimmedReason) throw new Error("Reason is required");

    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    });
    if (!comment) throw new Error("Comment not found");

    // Deduplication - only block if a 'pending' report from this user exists
    const existingPendingReport = await prisma.report.findFirst({
        where: {
            reporterId: session.user.id,
            commentId,
            status: "pending"
        }
    });

    if (existingPendingReport) {
        console.log(`[reportComment] User ${session.user.id} already has a pending report for comment ${commentId}`);
        return { success: true, alreadyReported: true };
    }

    await prisma.report.create({
        data: {
            commentId,
            reason: trimmedReason,
            reporterId: session.user.id,
        }
    });

    console.log(`[reportComment] Created new report for comment ${commentId} by user ${session.user.id}`);
    revalidatePath("/admin/reports");
    return { success: true };
}

export async function seedData() {
    // 1. Seed User
    const user = await prisma.user.upsert({
        where: { email: 'admin@agorahub.com' },
        update: {},
        create: {
            name: 'Agora Admin',
            email: 'admin@agorahub.com',
        }
    });

    // 2. Seed Categories
    const categoryNames = ['Technology', 'Design', 'Development', 'General', 'Feedback'];
    const categories = [];

    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { name },
            update: {},
            create: {
                name,
                slug: slugify(name, { lower: true })
            }
        });
        categories.push(cat);
    }

    const devCat = categories.find(c => c.name === 'Development');
    const techCat = categories.find(c => c.name === 'Technology');

    // 3. Seed Topics
    if (devCat && techCat) {
        const topic1 = await prisma.topic.create({
            data: {
                title: "How to handle large scale state in React 19?",
                content: "I've been working on a massive enterprise application and we're starting to hit some performance bottlenecks with our current state management approach. We use a mix of Context and Prop drilling (I know, I know). \n\nWith React 19's focus on stability and performance, what are the best practices now? Should we look into signals, or is the new 'use' hook and server components enough to mitigate global state needs?",
                authorId: user.id,
                categoryId: devCat.id
            }
        });

        const topic2 = await prisma.topic.create({
            data: {
                title: "The future of CSS: Tailwind v4 vs StyleX",
                content: "Tailwind v4 is bringing some massive changes. But StyleX from Meta offers a very different approach with build-time CSS. Which one is better for a design system team?",
                authorId: user.id,
                categoryId: techCat.id
            }
        });

        // 4. Seed Comments for Topic 1
        const comment1 = await prisma.comment.create({
            data: {
                content: "React 19 doesn't fundamentally change how we should handle global state, but it does make some things easier. Personally, I think Zustand is still the way to go for most use cases.",
                authorId: user.id,
                topicId: topic1.id
            }
        });

        await prisma.comment.create({
            data: {
                content: "Do you find Zustand handles complex derived state well? We have a lot of inter-dependent state slices.",
                authorId: user.id,
                topicId: topic1.id,
                parentId: comment1.id
            }
        });

        await prisma.comment.create({
            data: {
                content: "Have you tried looking into Preact-style signals? There are some great libraries that bring that mental model to React.",
                authorId: user.id,
                topicId: topic1.id
            }
        });
    }
}

export async function getUserProfile(identifier: string) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: identifier },
                { username: identifier }
            ]
        },
        include: {
            topics: {
                include: {
                    category: true,
                    _count: { select: { comments: true } },
                    votes: true
                },
                orderBy: { createdAt: 'desc' }
            },
            comments: {
                include: {
                    topic: {
                        include: { category: true }
                    },
                    votes: true
                },
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    topics: true,
                    comments: true
                }
            }
        }
    });

    if (!user) return null;

    return {
        ...user,
        topicCount: user._count.topics,
        commentCount: user._count.comments,
        topics: user.topics.map(t => ({
            ...t,
            voteCount: t.votes.reduce((acc, v) => acc + v.value, 0)
        })),
        comments: user.comments.map(c => ({
            ...c,
            voteCount: c.votes.reduce((acc, v) => acc + v.value, 0)
        }))
    };
}

/**
 * Updates the current user's profile using values from the provided form data.
 *
 * @param formData - FormData containing the fields:
 *   - "name": the user's display name
 *   - "username": desired username (optional; checked for uniqueness when changed)
 *   - "bio": the user's profile biography
 * @returns An object `{ success: true }` when the profile was updated successfully
 * @throws Error "Unauthorized" when there is no authenticated session
 * @throws Error "Username already taken" when the requested username is already in use
 * @throws Error "Your account has been banned. You cannot perform this action." when the current user is banned
 */
export async function updateProfile(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    verifyNotBanned(session);

    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const bio = formData.get("bio") as string;
    const bannerImage = formData.get("bannerImage") as string;

    let validatedBannerImage: string | null = null;
    if (bannerImage && bannerImage.trim()) {
        const trimmedBanner = bannerImage.trim();
        if (trimmedBanner.length > 1024) {
            throw new Error("Banner URL is too long (max 1024 characters)");
        }

        try {
            const url = new URL(trimmedBanner);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("Invalid URL scheme. Only http:// and https:// are allowed.");
            }
            validatedBannerImage = trimmedBanner;
        } catch (e: any) {
            if (e.message?.includes("Only http")) throw e;
            throw new Error("Invalid Banner URL format");
        }
    }

    // Check if username is taken if it's changing
    if (username && username !== (session.user as any).username) {
        const existing = await prisma.user.findUnique({
            where: { username }
        });
        if (existing) {
            throw new Error("Username already taken");
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name,
            username: username || null,
            bio,
            bannerImage: validatedBannerImage
        }
    });

    revalidatePath(`/profile/${updatedUser.username || updatedUser.id}`);
    revalidatePath(`/profile/${(session.user as any).username || session.user.id}`);

    return { success: true };
}