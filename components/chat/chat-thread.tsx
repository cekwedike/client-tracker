"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/lib/actions/chat";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Channel, Message } from "@/lib/types";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChannelList({
  channels,
  activeSlug,
}: {
  channels: Channel[];
  activeSlug: string;
}) {
  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <a
          key={channel.id}
          href={`/chat/${channel.slug}`}
          className={cn(
            "block rounded-lg px-3 py-2 text-sm transition-colors",
            activeSlug === channel.slug
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="text-muted-foreground">#</span>
          {channel.name}
        </a>
      ))}
    </div>
  );
}

export function ChatThread({
  channel,
  initialMessages,
}: {
  channel: Channel;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      const supabase = createClient();
      const channel_sub = supabase
        .channel(`messages:${channel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${channel.id}`,
          },
          async (payload) => {
            const { data } = await supabase
              .from("messages")
              .select("*, author:profiles(id, full_name, email)")
              .eq("id", payload.new.id)
              .single();
            if (data) {
              setMessages((prev) => [...prev, data as Message]);
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel_sub);
      };
    } catch {
      // Supabase not configured — realtime disabled
    }
  }, [channel.id]);

  const handleSend = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      try {
        const msg = await sendMessage(channel.id, content.trim());
        setMessages((prev) => [...prev, msg]);
        setContent("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">#{channel.name}</h2>
        {channel.description && (
          <p className="text-xs text-muted-foreground">{channel.description}</p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[oklch(0.55_0.12_85)] text-xs text-primary-foreground">
                  {msg.author?.full_name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {msg.author?.full_name ?? "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message #${channel.name}`}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isPending || !content.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
