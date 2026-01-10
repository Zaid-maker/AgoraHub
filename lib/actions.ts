'use server';

import prisma from './prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { headers } from 'next/headers';
import { pusherServer } from './pusher';

/**
 * Aborts processing when the provided session corresponds to a banned user.
 *
 * @param session - Session object that may contain `user` and `user.role`
 * @throws Error with message "Your account has been banned. You cannot perform this action." when `session.user.role === 'banned'`
 */
function verifyNotBanned(session: any) {
    if (session?.user && (session.user as any).role === 'banned') {
        throw new Error("Your account has been banned. You cannot perform this action.");
    }
}

/**
 * Fetches all categories including a count of associated topics.
 *
 * @returns An array of category objects where each object includes a `_count` property with the number of `topics`
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

    const topics = await prisma.topic.findMany({
        where: categoryId ? { categoryId } : {},
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
 * Fetches a topic by its ID, including category, author, votes, and nested comments, and returns the topic augmented with per-entity vote summaries and session-aware user vote values.
 *
 * The returned topic includes:
 * - `voteCount`: sum of vote values for the topic
 * - `userVote`: the current session user's vote value for the topic (or `0` if none)
 * - `comments`: top-level comments ordered by creation date, each transformed to include:
 *   - `author`: author's name
 *   - `authorId`: author's id
 *   - `authorRole`: author's role
 *   - `avatar`: generated avatar URL based on author name
 *   - `timeAgo`: formatted creation date
 *   - `voteCount`: sum of vote values for the comment
 *   - `userVote`: the current session user's vote value for the comment (or `0` if none)
 *   - `replies`: recursively processed replies with the same shape
 *
 * @param id - The topic's unique identifier
 * @returns The transformed topic object with aggregated vote fields and processed comments, or `null` if no topic is found
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
        author: c.author.name,
        authorId: c.authorId,
        authorRole: c.author.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.name}`,
        timeAgo: new Date(c.createdAt).toLocaleDateString(),
        voteCount: c.votes.reduce((acc: number, v: any) => acc + v.value, 0),
        userVote: c.votes.find((v: any) => v.userId === session?.user.id)?.value || 0,
        replies: c.replies?.map(processComment)
    });

    return {
        ...topic,
        voteCount: topic.votes.reduce((acc, v) => acc + v.value, 0),
        userVote: topic.votes.find(v => v.userId === session?.user.id)?.value || 0,
        comments: topic.comments.map(processComment)
    };
}

/**
 * Registers or toggles the current user's vote on a topic and publishes the updated vote total.
 *
 * Updates, creates, or removes the authenticated user's vote for the given topic id, emits a real-time update with the new total votes, and triggers revalidation for the home and topic pages.
 *
 * @param topicId - The id of the topic to vote on
 * @param value - The vote value (typically `1` for upvote or `-1` for downvote)
 * @throws Error - If the user is not authenticated ("Unauthorized")
 * @throws Error - If the current user is banned (verification enforces ban restriction)
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
 * Toggle or set the current user's vote on a comment and broadcast the updated vote total.
 *
 * @param commentId - ID of the comment to vote on
 * @param value - Vote value (typically `1` for upvote or `-1` for downvote)
 * @param topicId - ID of the topic containing the comment (used for notifications and revalidation)
 * @throws "Unauthorized" if there is no authenticated session
 * @throws If the current user is banned
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
 * Create a new topic from form data and associate it with the authenticated user.
 *
 * @param formData - FormData containing `title`, `content`, and `categoryId` for the new topic
 * @returns The created topic record
 * @throws Error If there is no authenticated session ("Unauthorized")
 * @throws Error If the current user is banned
 * @remarks Triggers revalidation of the home page path (`/`)
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
 * Creates a new comment for a topic and broadcasts it in real time.
 *
 * Accepts FormData containing `content`, `topicId`, and optional `parentId`, creates the comment with the current authenticated user as author, triggers a Pusher "new-comment" event for the topic, revalidates the topic page, and returns the created comment augmented with presentation fields.
 *
 * @param formData - Form data with keys:
 *   - `content`: comment text
 *   - `topicId`: ID of the topic the comment belongs to
 *   - `parentId` (optional): ID of a parent comment for replies
 * @returns The created comment augmented with:
 *   - `author`: author's name
 *   - `authorId`: author's user id
 *   - `timeAgo`: formatted creation date
 *   - `avatar`: generated avatar URL
 *   - `voteCount`: initial vote total (`0`)
 *   - `userVote`: current user's vote on the comment (`0`)
 *   - `replies`: empty array
 *
 * @throws Error with message "Unauthorized" if there is no authenticated session.
 * @throws Error if the current user is banned (via internal ban check).
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
 * Marks a comment as deleted if the current authenticated user is its author and not banned.
 *
 * @param commentId - ID of the comment to mark as deleted
 * @param topicId - ID of the topic containing the comment (used to publish updates and revalidate the topic page)
 * @returns An object with `success: true` when deletion is applied
 * @throws Error "Unauthorized" if no authenticated session is present
 * @throws Error "Comment not found" if the comment does not exist
 * @throws Error "You can only delete your own comments" if the current user is not the comment's author
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
 * Updates the current authenticated user's profile fields: name, username, and bio.
 *
 * @param formData - FormData with keys "name", "username", and "bio". If "username" is empty, the stored username will be cleared (set to null).
 * @returns An object `{ success: true }` when the update completes successfully.
 * @throws "Unauthorized" if there is no authenticated session.
 * @throws "Username already taken" if the requested username is already used by another account.
 * @throws Error if the current user's account is banned.
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
            bio
        }
    });

    revalidatePath(`/profile/${updatedUser.username || updatedUser.id}`);
    revalidatePath(`/profile/${(session.user as any).username || session.user.id}`);

    return { success: true };
}