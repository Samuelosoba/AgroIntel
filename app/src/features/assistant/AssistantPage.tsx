import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useLocation } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { SendHorizontal, Sparkles } from "lucide-react";
import type { ChatMessage, ChatResponse } from "@agrointel/shared";
import { ErrorNote } from "@/components/ui";
import { api } from "@/lib/api";

const STARTERS = [
  "When should I plant maize this year?",
  "Why are my tomato leaves turning yellow?",
  "How do I read my soil test results?",
  "What should I do during a long dry spell?",
];

export function AssistantPage() {
  const initial = (useLocation().state as { question?: string } | null)?.question;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  const chat = useMutation({
    mutationFn: (message: string) => api<ChatResponse>("/assistant/chat", { method: "POST", json: { message, conversationId } }),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    },
  });

  const send = (text: string) => {
    if (!text.trim() || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", content: text.trim() }]);
    setInput("");
    chat.mutate(text.trim());
  };

  useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true;
      send(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, chat.isPending]);

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <h1 className="mt-2 text-2xl font-extrabold">Ask AgroIntel</h1>
      <p className="text-sm text-earth-600">Answers use your farms, crops, local weather and recent scans.</p>

      <div className="mt-4 flex-1 space-y-3">
        {!messages.length && (
          <div className="grid gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-2xl bg-white p-3 text-left text-sm font-medium shadow-sm ring-1 ring-earth-200 hover:ring-brand-300">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                m.role === "user" ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-white shadow-sm ring-1 ring-earth-200",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex items-center gap-2 text-sm text-earth-600">
            <Sparkles className="size-4 animate-pulse text-brand-500" /> Thinking about your farm…
          </div>
        )}
        <ErrorNote error={chat.error} />
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-24 mt-4 flex items-center gap-2 rounded-2xl border border-earth-200 bg-white p-1.5 pl-3 shadow-md"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in English, Yoruba, Hausa, Igbo or Pidgin"
          className="min-h-10 flex-1 bg-transparent text-sm outline-none"
        />
        <button aria-label="Send" disabled={chat.isPending} className="grid size-10 place-items-center rounded-xl bg-brand-500 text-white disabled:opacity-50">
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </div>
  );
}
