"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClientNote } from "@/lib/actions/clients";
import { toast } from "sonner";
import type { ClientNote } from "@/lib/types";

export function ClientNotes({
  clientId,
  notes,
}: {
  clientId: string;
  notes: ClientNote[];
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      try {
        await addClientNote(clientId, content.trim());
        setContent("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add note");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note to the activity timeline..."
          rows={2}
        />
        <Button
          onClick={handleAdd}
          disabled={isPending || !content.trim()}
          className="shrink-0"
        >
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border/50 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {note.author?.full_name ?? "Unknown"}
              </span>
              <span>·</span>
              <span>{new Date(note.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet</p>
        )}
      </div>
    </div>
  );
}
