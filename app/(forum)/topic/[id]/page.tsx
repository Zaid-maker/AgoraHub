import CommentNode from "@/components/CommentNode";
import { getTopicById } from "@/lib/actions";
import { notFound } from "next/navigation";
import VoteControl from "@/components/VoteControl";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const topic = await getTopicById(id);

    if (!topic) {
        notFound();
    }

    const topicDetail = {
        ...topic,
        author: topic.author.name,
        category: topic.category.name,
        timeAgo: new Date(topic.createdAt).toLocaleDateString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${topic.author.name}`,
        comments: topic.comments.map(c => ({
            ...c,
            author: c.author.name,
            timeAgo: new Date(c.createdAt).toLocaleDateString(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.name}`,
            replies: c.replies.map((r: any) => ({
                ...r,
                author: r.author.name,
                timeAgo: new Date(r.createdAt).toLocaleDateString(),
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author.name}`,
                replies: r.replies.map((rr: any) => ({
                    ...rr,
                    author: rr.author.name,
                    timeAgo: new Date(rr.createdAt).toLocaleDateString(),
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rr.author.name}`,
                }))
            }))
        }))
    };

    return (
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
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <img src={topicDetail.avatar} alt={topicDetail.author} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{topicDetail.author}</div>
                            <div className="text-xs text-zinc-500 italic">Author</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Rate Topic</span>
                        <VoteControl
                            id={id}
                            type="topic"
                            initialVotes={topicDetail.voteCount}
                            initialUserVote={topicDetail.userVote}
                        />
                    </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed mb-12">
                    {topicDetail.content.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                </div>
            </div>

            <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">Discussion</h2>
                    <button className="h-9 px-5 bg-gold hover:bg-gold-hover text-navy rounded-full text-sm font-bold shadow-sm transition-all">
                        Post Reply
                    </button>
                </div>

                <div className="space-y-6">
                    {topicDetail.comments.length > 0 ? (
                        topicDetail.comments.map((comment) => (
                            <CommentNode key={comment.id} comment={comment as any} />
                        ))
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No comments yet. Start the conversation!</p>
                    )}
                </div>
            </section>
        </div>
    );
}
