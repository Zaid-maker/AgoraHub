import TopicCard from "@/components/TopicCard";
import { getTopics } from "@/lib/actions";
import CreateTopicButton from "@/components/CreateTopicButton";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const topicsData = await getTopics();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const topics = topicsData.map(t => ({
    id: t.id,
    title: t.title,
    excerpt: t.content.substring(0, 150) + (t.content.length > 150 ? '...' : ''),
    author: t.author.name,
    category: t.category.name,
    replies: t._count.comments,
    timeAgo: new Date(t.createdAt).toLocaleDateString(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.author.name}`,
    voteCount: t.voteCount,
    userVote: t.userVote
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Recent Discussions</h1>
          <p className="text-zinc-500 mt-1">Stay up to date with the latest from the community.</p>
        </div>
        <CreateTopicButton />
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
  );
}
