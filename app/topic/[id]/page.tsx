import MainLayout from "@/components/MainLayout";
import CommentNode from "@/components/CommentNode";

const MOCK_TOPIC_DETAIL = {
    id: "1",
    title: "How to handle large scale state in React 19?",
    content: "I've been working on a massive enterprise application and we're starting to hit some performance bottlenecks with our current state management approach. We use a mix of Context and Prop drilling (I know, I know). \n\nWith React 19's focus on stability and performance, what are the best practices now? Should we look into signals, or is the new 'use' hook and server components enough to mitigate global state needs?",
    author: "frontend_guru",
    category: "Development",
    timeAgo: "2 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    comments: [
        {
            id: "c1",
            author: "react_lover",
            content: "React 19 doesn't fundamentally change how we should handle global state, but it does make some things easier. Personally, I think Zustand is still the way to go for most use cases.",
            timeAgo: "1 hour ago",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Moxie",
            replies: [
                {
                    id: "c2",
                    author: "frontend_guru",
                    content: "Do you find Zustand handles complex derived state well? We have a lot of inter-dependent state slices.",
                    timeAgo: "45 mins ago",
                    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                    replies: [
                        {
                            id: "c3",
                            author: "react_lover",
                            content: "It does! You can use selectors to compute derived state. It's very efficient because it only triggers re-renders for the specific components using that slice.",
                            timeAgo: "30 mins ago",
                            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Moxie",
                        }
                    ]
                }
            ]
        },
        {
            id: "c4",
            author: "signal_fan",
            content: "Have you tried looking into Preact-style signals? There are some great libraries that bring that mental model to React. It completely bypasses the virtual DOM diffing for state updates.",
            timeAgo: "50 mins ago",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby",
        }
    ]
};

export default function TopicPage() {
    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black">
                            {MOCK_TOPIC_DETAIL.category}
                        </span>
                        <span className="text-sm text-zinc-500">{MOCK_TOPIC_DETAIL.timeAgo}</span>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight mb-6 leading-tight">
                        {MOCK_TOPIC_DETAIL.title}
                    </h1>

                    <div className="flex items-center gap-3 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <img src={MOCK_TOPIC_DETAIL.avatar} alt={MOCK_TOPIC_DETAIL.author} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{MOCK_TOPIC_DETAIL.author}</div>
                            <div className="text-xs text-zinc-500 italic">Author</div>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-lg leading-relaxed mb-12">
                        {MOCK_TOPIC_DETAIL.content.split('\n\n').map((paragraph, i) => (
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
                        {MOCK_TOPIC_DETAIL.comments.map((comment) => (
                            <CommentNode key={comment.id} comment={comment} />
                        ))}
                    </div>
                </section>
            </div>
        </MainLayout>
    );
}
