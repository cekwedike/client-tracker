import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/sidebar";
import { ChannelList, ChatThread } from "@/components/chat/chat-thread";
import { getChannel, getChannels, getMessages } from "@/lib/actions/chat";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChatChannelPage({ params }: PageProps) {
  const { slug } = await params;

  let channel;
  let channels;
  let messages;
  try {
    [channel, channels, messages] = await Promise.all([
      getChannel(slug),
      getChannels(),
      getChannel(slug).then((c) => getMessages(c.id)),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Chat"
        description="Internal team communication — keep Smartlead for client email"
      />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-lg border p-3 lg:col-span-1">
          <p className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
            Channels
          </p>
          <ChannelList channels={channels} activeSlug={slug} />
        </div>
        <div className="lg:col-span-3">
          <ChatThread channel={channel} initialMessages={messages} />
        </div>
      </div>
    </>
  );
}
