import Link from "next/link";
import CommentsSection from "@/components/CommentsSection";
import { getTopicById } from "@/lib/actions";
import { notFound } from "next/navigation";
import VoteControl from "@/components/VoteControl";
import SidebarWrapper from "@/components/SidebarWrapper";
import CommentForm from "@/components/CommentForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Render the full topic detail page for a given topic id.
 *
 * Fetches the topic by id and session information, triggers a 404 response if the topic does not exist, and returns the composed page UI that includes the topic header, author info, content (hidden if the author is banned), voting controls (hidden for banned authors), discussion comments, and a comment form or sign-in prompt depending on session state.
 *
 * @param params - An object whose `id` property is a Promise resolving to the topic id string
 * @returns The topic detail page as a JSX element
 */
export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const topic = await getTopicById(id);

    if (!topic) {
        notFound();
    }

    const topicDetail = {
        ...topic,
        author: topic.author.name,
        authorId: topic.authorId,
        category: topic.category.name,
        timeAgo: new Date(topic.createdAt).toLocaleDateString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${topic.author.name}`,
        authorRole: topic.author.role
    };

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <SidebarWrapper>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black">
                            {topicDetail.category}
                        </span>
                        <span className="text-sm text-zinc-500">{topicDetail.timeAgo}</span>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight mb-6 leading-tight">
                        {topicDetail.title}
                    </h1>

                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${topicDetail.authorId}`} className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 hover:ring-2 ring-gold/50 transition-all">
                                <img src={topicDetail.avatar} alt={topicDetail.author} className="w-full h-full object-cover" />
                            </Link>
                            <div>
                                <Link href={`/profile/${topicDetail.authorId}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-gold transition-colors block">
                                    {topicDetail.author}
                                </Link>
                                <div className="text-xs text-zinc-500 italic">Author</div>
                            </div>
                        </div>

                        {topicDetail.authorRole !== 'banned' && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Rate Topic</span>
                                <VoteControl
                                    id={id}
                                    type="topic"
                                    initialVotes={topicDetail.voteCount}
                                    initialUserVote={topicDetail.userVote}
                                />
                            </div>
                        )}
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed mb-12">
                        {topicDetail.authorRole === 'banned' ? (
                            <div className="p-8 rounded-3xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 italic text-red-500/80 text-center">
                                This content is hidden because the author has been banned.
                            </div>
                        ) : (
                            topicDetail.content.split('\n\n').map((paragraph: string, i: number) => (
                                <p key={i} className="mb-4">{paragraph}</p>
                            ))
                        )}
                    </div>
                </div>

                <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Discussion</h2>
                    </div>

                    <div className="space-y-6 mb-12">
                        <CommentsSection topicId={id} initialComments={topicDetail.comments} />
                    </div>

                    <div className="mt-12 pt-12 border-t border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-xl font-bold mb-6">Your Contribution</h3>
                        {session ? (
                            <CommentForm topicId={id} />
                        ) : (
                            <div className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <p className="text-slate-500 mb-6 italic font-serif">You must be part of the legend to contribute to this discussion.</p>
                                <Link
                                    href="/sign-in"
                                    className="inline-flex items-center h-12 px-8 bg-navy text-white dark:bg-gold dark:text-navy font-black rounded-2xl uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                                >
                                    Sign In to Reply
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </SidebarWrapper>
    );
}