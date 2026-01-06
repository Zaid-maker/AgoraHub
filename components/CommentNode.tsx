"use client";

import { useState } from 'react';
import VoteControl from './VoteControl';
import { useParams } from 'next/navigation';

interface Comment {
    id: string;
    author: string;
    content: string;
    timeAgo: string;
    avatar: string;
    voteCount: number;
    userVote: number;
    replies?: Comment[];
}

interface CommentNodeProps {
    comment: Comment;
    depth?: number;
}

export default function CommentNode({ comment, depth = 0 }: CommentNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const params = useParams();
    const topicId = params.id as string;

    return (
        <div className={`mt-4 ${depth > 0 ? 'ml-6 pl-4 border-l border-white/5 dark:border-slate-800' : ''}`}>
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center pt-1">
                    <VoteControl
                        id={comment.id}
                        type="comment"
                        initialVotes={comment.voteCount}
                        initialUserVote={comment.userVote}
                        topicId={topicId}
                    />
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                    <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.author}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{comment.timeAgo}</span>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        {comment.content}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <button className="hover:text-gold transition-colors uppercase tracking-widest">Reply</button>
                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hover:text-gold transition-colors uppercase tracking-widest"
                            >
                                {isExpanded ? 'Hide' : `Show ${comment.replies.length} replies`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4">
                    {comment.replies.map((reply) => (
                        <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
