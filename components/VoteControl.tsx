"use client";

import { useState, useEffect } from "react";
import { voteTopic, voteComment } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";

interface VoteControlProps {
    id: string;
    type: "topic" | "comment";
    initialVotes: number;
    initialUserVote: number; // 1, -1, or 0
    topicId?: string; // required if type === 'comment'
}

export default function VoteControl({ id, type, initialVotes, initialUserVote, topicId }: VoteControlProps) {
    const [votes, setVotes] = useState(initialVotes);
    const [userVote, setUserVote] = useState(initialUserVote);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const channelName = type === 'topic' ? `topic-${id}` : `topic-${topicId}`;
        if (!channelName || (type === 'comment' && !topicId)) return;

        pusherClient.subscribe(channelName);

        const handleVoteUpdate = (data: { id: string, type: string, votes: number }) => {
            if (data.id === id && data.type === type) {
                setVotes(data.votes);
            }
        };

        pusherClient.bind('new-vote', handleVoteUpdate);

        return () => {
            pusherClient.unbind('new-vote', handleVoteUpdate);
            pusherClient.unsubscribe(channelName);
        };
    }, [id, type, topicId]);

    async function handleVote(value: number) {
        if (loading) return;

        let newValue = value;
        if (userVote === value) {
            newValue = 0; // Toggle off
        }

        // Optimistic UI
        const diff = newValue - userVote;
        setVotes(prev => prev + diff);
        setUserVote(newValue);
        setLoading(true);

        try {
            if (type === "topic") {
                await voteTopic(id, value);
            } else if (type === "comment" && topicId) {
                await voteComment(id, value, topicId);
            }
        } catch (err: any) {
            // Revert on error
            setVotes(prev => prev - diff);
            setUserVote(initialUserVote);
            toast.error("Action Failed", {
                description: "Please sign in to vote."
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-1 min-w-[32px]">
            <button
                onClick={() => handleVote(1)}
                disabled={loading}
                className={cn(
                    "p-1.5 rounded-lg transition-all hover:bg-gold/10",
                    userVote === 1 ? "text-gold" : "text-slate-400"
                )}
            >
                <svg className="w-5 h-5" fill={userVote === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
            </button>
            <span className={cn(
                "text-xs font-black tabular-nums",
                userVote === 1 ? "text-gold" : userVote === -1 ? "text-red-500" : "text-slate-500"
            )}>
                {votes}
            </span>
            <button
                onClick={() => handleVote(-1)}
                disabled={loading}
                className={cn(
                    "p-1.5 rounded-lg transition-all hover:bg-red-500/10",
                    userVote === -1 ? "text-red-500" : "text-slate-400"
                )}
            >
                <svg className="w-5 h-5" fill={userVote === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
        </div>
    );
}
