"use client";

import { useState } from 'react';
import VoteControl from './VoteControl';
import { useParams } from 'next/navigation';
import CommentForm from './CommentForm';
import CommentActions from './CommentActions';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReportModal from './ReportModal';
import Link from 'next/link';

interface Comment {
    id: string;
    author: string;
    authorId: string;
    content: string | null;
    timeAgo: string;
    avatar: string;
    voteCount: number;
    userVote: number;
    replies?: Comment[];
    isDeleted?: boolean;
    authorRole?: string;
    moderated?: boolean;
}

interface CommentNodeProps {
    comment: Comment;
    depth?: number;
}

/**
 * Render a single comment node including vote controls, author info, content, actions, and its nested replies.
 *
 * Renders different placeholders when the comment is deleted, moderated, or the author is banned, shows reply/collapse controls,
 * and conditionally displays an inline reply form. Nested replies are indented according to `depth` and are always
 * rendered when expanded, even if the parent comment is deleted.
 *
 * @param comment - The comment object to render. May have `content` set to `null`; if `isDeleted` is true a deleted placeholder is shown; if `authorRole === 'banned'` a hidden-by-ban placeholder is shown; if `moderated` is true a moderation placeholder is shown.
 * @param depth - The nesting level of this comment (used to indent and style replies). Defaults to 0.
 * @returns The rendered comment node element.
 */
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
                ) : comment.moderated ? (
                    <div className="flex-1 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 italic text-amber-600/80 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        This comment has been removed by moderators for rule violations.
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

                                {session && (
                                    <ReportModal targetId={comment.id} type="comment" />
                                )}

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