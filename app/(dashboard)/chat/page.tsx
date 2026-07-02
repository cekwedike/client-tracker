import { redirect } from "next/navigation";
import { getChannels } from "@/lib/actions/chat";

export default async function ChatIndexPage() {
  const channels = await getChannels();
  const first = channels.find((c) => c.slug === "general") ?? channels[0];
  if (first) {
    redirect(`/chat/${first.slug}`);
  }
  redirect("/clients");
}
