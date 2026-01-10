"use client";

import { useState } from 'react';
import VoteControl from './VoteControl';
import { useParams } from 'next/navigation';
import CommentForm from './CommentForm';
import CommentActions from './CommentActions';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Comment {
    id: string;
    author: string;
    authorId: string;
    content: string;
    timeAgo: string;
    avatar: string;
    voteCount: number;
    userVote: number;
    replies?: Comment[];
    isDeleted?: boolean;
    authorRole?: string;
}

import Link from 'next/link';

interface CommentNodeProps {
    comment: Comment;
    depth?: number;
}

export default function CommentNode({ comment, depth = 0 }: CommentNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const params = useParams();
    const topicId = params.id as string;
    const { data: session } = authClient.useSession();

    const handleReplyClick = () => {
        if (!session) {
            toast.error("Sign in required", {
                description: "You must be part of the legend to reply."
            });
            return;
        }
        setIsReplying(!isReplying);
    };

    return (
        <div className={`mt-4 ${depth > 0 ? 'ml-6 pl-4 border-l border-white/5 dark:border-slate-800' : ''}`}>
            <div className="flex items-start gap-4">
                {comment.isDeleted ? (
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 italic text-slate-500 text-sm">
                        Original comment deleted by post author
                    </div>
                ) : comment.authorRole === 'banned' ? (
                    <div className="flex-1 p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 italic text-red-500/80 text-sm">
                        This content is hidden because the author has been banned.
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center pt-1">
                            <VoteControl
                                id={comment.id}
                                type="comment"
                                initialVotes={comment.voteCount}
                                initialUserVote={comment.userVote}
                                topicId={topicId}
                            />
                        </div>

                        <Link href={`/profile/${comment.authorId}`} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden hover:ring-2 ring-gold/50 transition-all">
                            <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                        </Link>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Link href={`/profile/${comment.authorId}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-gold transition-colors">
                                    {comment.author}
                                </Link>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-400">{comment.timeAgo}</span>
                                <div className="ml-auto">
                                    <CommentActions commentId={comment.id} authorId={comment.authorId} />
                                </div>
                            </div>

                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                                {comment.content}
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <button
                                    onClick={handleReplyClick}
                                    className={cn("hover:text-gold transition-colors uppercase tracking-widest", isReplying && "text-gold")}
                                >
                                    {isReplying ? 'Cancel' : 'Reply'}
                                </button>
                                {comment.replies && comment.replies.length > 0 && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="hover:text-gold transition-colors uppercase tracking-widest"
                                    >
                                        {isExpanded ? 'Hide' : `Show ${comment.replies.length} replies`}
                                    </button>
                                )}
                            </div>

                            {isReplying && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <CommentForm
                                        topicId={topicId}
                                        parentId={comment.id}
                                        autoFocus
                                        placeholder={`Replying to ${comment.author}...`}
                                        onSuccess={() => setIsReplying(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Always show nested replies even if parent is deleted */}
            {isExpanded && comment.replies && comment.replies.length > 0 && (
                <div className={`space-y-4 ${comment.isDeleted ? 'mt-4' : ''}`}>
                    {comment.replies.map((reply) => (
                        <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
