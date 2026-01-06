import MainLayout from "@/components/MainLayout";
import TopicCard from "@/components/TopicCard";

const MOCK_TOPICS = [
  {
    id: "1",
    title: "How to handle large scale state in React 19?",
    excerpt: "With the new features in React 19, I'm curious how everyone is approaching global state management. Are you sticking with Zustand or moving more towards native hooks?",
    author: "frontend_guru",
    category: "Development",
    replies: 24,
    timeAgo: "2 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  },
  {
    id: "2",
    title: "The future of CSS: Tailwind v4 vs StyleX",
    excerpt: "We've been using Tailwind for years, but StyleX seems to offer some interesting benefits for large design systems. What's your take on the performance trade-offs?",
    author: "design_system_pro",
    category: "Design",
    replies: 15,
    timeAgo: "5 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
  },
  {
    id: "3",
    title: "What is your favorite local development setup?",
    excerpt: "I'm looking to optimize my workflow. Currently using Bun + Vite + VS Code. Any extensions or tools that are game changers for you lately?",
    author: "dev_ops_wizard",
    category: "Technology",
    replies: 42,
    timeAgo: "1 day ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo"
  }
];

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Recent Discussions</h1>
            <p className="text-zinc-500 mt-1">Stay up to date with the latest from the community.</p>
          </div>
          <button className="hidden sm:inline-flex h-10 items-center justify-center rounded-full bg-gold hover:bg-gold-hover px-6 text-sm font-bold text-navy transition-all shadow-sm">
            Start a Topic
          </button>
        </div>

        <div className="grid gap-4">
          {MOCK_TOPICS.map((topic) => (
            <TopicCard key={topic.id} {...topic} />
          ))}
        </div>

        <div className="pt-8 flex justify-center">
          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Load more discussions
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
