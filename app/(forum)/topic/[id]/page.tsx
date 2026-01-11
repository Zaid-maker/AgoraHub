import Link from "next/link";
import CommentsSection from "@/components/CommentsSection";
import { getTopicById } from "@/lib/actions";
import { notFound } from "next/navigation";
import VoteControl from "@/components/VoteControl";
import SidebarWrapper from "@/components/SidebarWrapper";
import CommentForm from "@/components/CommentForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ReportModal from "@/components/ReportModal";

/**
 * Render the topic page for a given topic id.
 *
 * Loads the topic and session, then renders topic details (category, title, author, avatar, time), voting controls, content (hidden if the author is banned), discussion comments, and a contribution area or sign-in prompt.
 *
 * @param params - A promise that resolves to an object containing the route `id` string for the topic
 * @returns The page's React element containing the topic detail layout, discussion, and contribution UI
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

    if (topicDetail.moderated) {
        return (
            <SidebarWrapper>
                <div className="max-w-4xl mx-auto py-20 text-center">
                    <div className="p-12 rounded-[2.5rem] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 shadow-sm animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-4">Topic Moderated</h1>
                        <p className="max-w-md mx-auto text-amber-800/70 dark:text-amber-200/60 font-medium leading-relaxed italic">
                            This topic has been removed for violating AgoraHub community guidelines.
                            Our team has reviewed the reports and taken appropriate action.
                        </p>
                        <div className="mt-8">
                            <Link
                                href="/"
                                className="inline-flex items-center h-10 px-6 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 font-bold rounded-xl text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                Back to Forum
                            </Link>
                        </div>
                    </div>
                </div>
            </SidebarWrapper>
        );
    }

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
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-6 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Rate</span>
                                    <VoteControl
                                        id={id}
                                        type="topic"
                                        initialVotes={topicDetail.voteCount}
                                        initialUserVote={topicDetail.userVote}
                                    />
                                </div>

                                {session && (
                                    <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                                        <ReportModal targetId={id} type="topic" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed mb-12">
                        {topicDetail.authorRole === 'banned' ? (
                            <div className="p-8 rounded-3xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 italic text-red-500/80 text-center">
                                This content is hidden because the author has been banned.
                            </div>
                        ) : (
                            (topicDetail.content || '').split('\n\n').map((paragraph: string, i: number) => (
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