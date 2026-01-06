import Link from 'next/link';
import VoteControl from './VoteControl';

interface TopicCardProps {
    id: string;
    title: string;
    excerpt: string;
    author: string;
    category: string;
    replies: number;
    timeAgo: string;
    avatar: string;
    voteCount: number;
    userVote: number;
}

export default function TopicCard({ id, title, excerpt, author, category, replies, timeAgo, avatar, voteCount, userVote }: TopicCardProps) {
    return (
        <article className="bg-white dark:bg-zinc-900/50 border rounded-xl p-5 card-hover group relative">
            <div className="flex items-start gap-6">
                <VoteControl
                    id={id}
                    type="topic"
                    initialVotes={voteCount}
                    initialUserVote={userVote}
                />

                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                    {avatar ? (
                        <img src={avatar} alt={author} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                            {author[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
                            {category}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{timeAgo}</span>
                    </div>

                    <Link href={`/topic/${id}`} className="block group-hover:text-gold transition-colors">
                        <h2 className="text-lg font-bold leading-tight mb-2 truncate text-slate-900 dark:text-white">
                            {title}
                        </h2>
                    </Link>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{author}</span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-xs font-medium">{replies} replies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
