"use client";

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';
import CommentNode from './CommentNode';

interface CommentsSectionProps {
    topicId: string;
    initialComments: any[];
}

export default function CommentsSection({ topicId, initialComments }: CommentsSectionProps) {
    const [comments, setComments] = useState(initialComments);

    useEffect(() => {
        pusherClient.subscribe(`topic-${topicId}`);

        const handleNewComment = (newComment: any) => {
            setComments((prev) => {
                // Determine if this is a top-level or nested comment
                if (!newComment.parentId) {
                    // Check if already exists (optimistic or duplicate)
                    if (prev.find(c => c.id === newComment.id)) return prev;
                    return [...prev, newComment];
                } else {
                    // Recursive function to add reply
                    const addReply = (nodes: any[]): any[] => {
                        return nodes.map(node => {
                            if (node.id === newComment.parentId) {
                                const replies = node.replies || [];
                                if (replies.find((r: any) => r.id === newComment.id)) return node;
                                return { ...node, replies: [...replies, newComment] };
                            }
                            if (node.replies) {
                                return { ...node, replies: addReply(node.replies) };
                            }
                            return node;
                        });
                    };
                    return addReply(prev);
                }
            });
        };

        pusherClient.bind('new-comment', handleNewComment);

        return () => {
            pusherClient.unbind('new-comment', handleNewComment);
            pusherClient.unsubscribe(`topic-${topicId}`);
        };
    }, [topicId]);

    return (
        <div className="space-y-6">
            {comments.length > 0 ? (
                comments.map((comment) => (
                    <CommentNode key={comment.id} comment={comment} />
                ))
            ) : (
                <p className="text-zinc-500 text-center py-8">No comments yet. Start the conversation!</p>
            )}
        </div>
    );
}
