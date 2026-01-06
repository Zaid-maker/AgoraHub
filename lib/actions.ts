'use server';

import prisma from './prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';

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
            comments: {
                where: { parentId: null },
                include: {
                    replies: {
                        include: {
                            replies: true // This only goes 2 levels deep. Recursive fetching is complex in Prisma.
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
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const author = formData.get('author') as string;
    const categoryId = formData.get('categoryId') as string;

    const topic = await prisma.topic.create({
        data: {
            title,
            content,
            author,
            categoryId
        }
    });

    revalidatePath('/');
    return topic;
}

export async function createComment(formData: FormData) {
    const content = formData.get('content') as string;
    const author = formData.get('author') as string;
    const topicId = formData.get('topicId') as string;
    const parentId = formData.get('parentId') as string | null;

    const comment = await prisma.comment.create({
        data: {
            content,
            author,
            topicId,
            parentId: parentId || null
        }
    });

    revalidatePath(`/topic/${topicId}`);
    return comment;
}

export async function seedData() {
    // 1. Seed Categories
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

    // 2. Seed Topics
    if (devCat && techCat) {
        const topic1 = await prisma.topic.create({
            data: {
                title: "How to handle large scale state in React 19?",
                content: "I've been working on a massive enterprise application and we're starting to hit some performance bottlenecks with our current state management approach. We use a mix of Context and Prop drilling (I know, I know). \n\nWith React 19's focus on stability and performance, what are the best practices now? Should we look into signals, or is the new 'use' hook and server components enough to mitigate global state needs?",
                author: "frontend_guru",
                categoryId: devCat.id
            }
        });

        const topic2 = await prisma.topic.create({
            data: {
                title: "The future of CSS: Tailwind v4 vs StyleX",
                content: "Tailwind v4 is bringing some massive changes. But StyleX from Meta offers a very different approach with build-time CSS. Which one is better for a design system team?",
                author: "design_system_pro",
                categoryId: techCat.id
            }
        });

        // 3. Seed Comments for Topic 1
        const comment1 = await prisma.comment.create({
            data: {
                content: "React 19 doesn't fundamentally change how we should handle global state, but it does make some things easier. Personally, I think Zustand is still the way to go for most use cases.",
                author: "react_lover",
                topicId: topic1.id
            }
        });

        await prisma.comment.create({
            data: {
                content: "Do you find Zustand handles complex derived state well? We have a lot of inter-dependent state slices.",
                author: "frontend_guru",
                topicId: topic1.id,
                parentId: comment1.id
            }
        });

        await prisma.comment.create({
            data: {
                content: "Have you tried looking into Preact-style signals? There are some great libraries that bring that mental model to React.",
                author: "signal_fan",
                topicId: topic1.id
            }
        });
    }
}
