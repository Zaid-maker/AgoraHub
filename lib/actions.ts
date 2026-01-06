'use server';

import prisma from './prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { headers } from 'next/headers';

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
    return await prisma.topic.findMany({
        where: categoryId ? { categoryId } : {},
        include: {
            category: true,
            author: true,
            _count: {
                select: { comments: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getTopicById(id: string) {
    return await prisma.topic.findUnique({
        where: { id },
        include: {
            category: true,
            author: true,
            comments: {
                where: { parentId: null },
                include: {
                    author: true,
                    replies: {
                        include: {
                            author: true,
                            replies: {
                                include: {
                                    author: true
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
}

export async function createTopic(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

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

    const content = formData.get('content') as string;
    const topicId = formData.get('topicId') as string;
    const parentId = formData.get('parentId') as string | null;

    const comment = await prisma.comment.create({
        data: {
            content,
            topicId,
            parentId: parentId || null,
            authorId: session.user.id
        }
    });

    revalidatePath(`/topic/${topicId}`);
    return comment;
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
