'use server';

import prisma from './prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { headers } from 'next/headers';
import { pusherServer } from './pusher';

function verifyNotBanned(session: any) {
    if (session?.user && (session.user as any).role === 'banned') {
        throw new Error("Your account has been banned. You cannot perform this action.");
    }
}

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
