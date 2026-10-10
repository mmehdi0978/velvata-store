"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

function renderLinks(text: string) {
  // Turn [Name](/product/slug) into clickable links
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((p, i) => {
    const m = p.match(/^\[(.*?)\]\((.*?)\)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} className="underline font-medium text-black">
          {m[1]}
        </a>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Assalam-o-Alaikum! 👋 Main Qomash Wears Assistant hun. Products, delivery, ya order ke bare me kuch poochna hai?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const newMsgs: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMsgs([...newMsgs, { role: "assistant", content: data.reply || "Kuch masla ho gaya." }]);
    } catch {
      setMsgs([...newMsgs, { role: "assistant", content: "Connection me masla hai. Dobara try karein!" }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Chat with Qomash Wears Assistant"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-stone-800 transition"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 w-[92vw] max-w-sm h-[60vh] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg">
              B
            </div>
            <div>
              <div className="font-semibold text-sm">Qomash Wears Assistant</div>
              <div className="text-xs text-stone-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-white text-stone-800 border border-stone-200 rounded-bl-sm"
                  }`}
                >
                  {renderLinks(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-stone-500">
                  <span className="animate-pulse">Likh raha hai...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-stone-200 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Apna sawal likhein..."
              className="flex-1 px-3 py-2 border border-stone-300 rounded-full text-sm focus:outline-none focus:border-black"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-40 hover:bg-stone-800 transition shrink-0"
              aria-label="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
