import MainLayout from "@/components/MainLayout";
import TopicCard from "@/components/TopicCard";
import { getTopics } from "@/lib/actions";

export default async function Home() {
  const topicsData = await getTopics();

  const topics = topicsData.map(t => ({
    id: t.id,
    title: t.title,
    excerpt: t.content.substring(0, 150) + (t.content.length > 150 ? '...' : ''),
    author: t.author.name,
    category: t.category.name,
    replies: t._count.comments,
    timeAgo: new Date(t.createdAt).toLocaleDateString(), // Simple date for now
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.author.name}`
  }));

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
          {topics.length > 0 ? (
            topics.map((topic) => (
              <TopicCard key={topic.id} {...topic} />
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-zinc-500 font-medium">No discussions yet. Be the first to start one!</p>
            </div>
          )}
        </div>

        {topics.length > 0 && (
          <div className="pt-8 flex justify-center">
            <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Load more discussions
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
