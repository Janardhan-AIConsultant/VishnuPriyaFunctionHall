import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  X,
  PhoneCall,
  Bot,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { venueApi } from "../lib/api";
import type { ChatMessageItem } from "../types/venue";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  BUSINESS_INFO,
  buildWhatsAppHref,
  normalizeWhatsAppDigits,
} from "../data/venueData";

const QUICK_PROMPTS = [
  "What facilities and seating capacity do you have?",
  "Which events can we host?",
  "Check availability for 2026-12-15",
  "Where is the hall located in Eluru?",
  "How does the booking approval process work?",
];

export function FloatingConcierge() {
  const { data: businessInfo } = useQuery({
    queryKey: ["business"],
    queryFn: venueApi.getBusiness,
    staleTime: 60_000,
  });
  const activeWhatsApp = normalizeWhatsAppDigits(
    businessInfo?.whatsapp_number || BUSINESS_INFO.whatsapp_number
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDrawerPrompts, setShowDrawerPrompts] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: "assistant",
      content:
        "Namaskaram! I'm Mythri, your Vishnu Priya Function Hall assistant. Ask about our A/C halls, facilities, event types, or share a date (YYYY-MM-DD) to check availability.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleSend(textOverride?: string) {
    const query = (textOverride ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessageItem = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setShowDrawerPrompts(false);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const res = await venueApi.sendChatMessage(query, nextHistory);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          booking_reference: res.booking_reference || undefined,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Unable to reach Mythri right now. Please call +91 75999 96956.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Mythri — Vishnu Priya Chat Bot"
          className="fixed bottom-20 right-4 z-50 flex h-[540px] max-h-[calc(100vh-6.5rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-[#D8CBB8] bg-[#FFFDF9] shadow-2xl sm:right-6"
        >
          <div className="flex items-center justify-between border-b border-[#E5DAC8] bg-[#6B1426] px-4 py-3 text-[#FFFDF9]">
            <div>
              <p className="font-display text-lg font-semibold leading-tight">
                Mythri
              </p>
              <p className="text-xs text-[#F3ECE0]/85">
                Vishnu Priya Function Hall · Eluru
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-[#FFFDF9]/85 hover:bg-white/10"
              aria-label="Close Mythri chat bot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-[#FBF8F3]">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-3">
                <div
                  className={
                    m.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-lg bg-[#6B1426] px-3.5 py-2.5 text-sm text-[#FFFDF9]"
                        : "max-w-[90%] rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#231917]"
                    }
                  >
                    <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                    {m.booking_reference && (
                      <p className="mt-1.5 font-mono text-xs text-[#6B1426]">
                        Ref: {m.booking_reference}
                      </p>
                    )}
                  </div>
                </div>

                {idx === 0 && (
                  <div
                    aria-label="Default questions"
                    className="space-y-1.5 pt-1"
                  >
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#665851]">
                      Default Questions
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((q, qIdx) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSend(q)}
                          disabled={loading}
                          className="flex w-full items-center justify-between gap-2.5 rounded-md border border-[#D8CBB8] bg-[#FFFDF9] px-3 py-2 text-left text-xs font-medium text-[#231917] transition-colors hover:border-[#B58938] hover:bg-[#F3ECE0]/60 disabled:opacity-60 cursor-pointer"
                        >
                          <span className="flex items-start gap-2 min-w-0">
                            <span className="font-mono text-[11px] text-[#6B1426] shrink-0 pt-px">
                              0{qIdx + 1}
                            </span>
                            <span className="leading-snug whitespace-normal">
                              {q}
                            </span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#B58938]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] px-3.5 py-2 text-xs text-[#665851]">
                  Checking venue details...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#E5DAC8] bg-[#FFFDF9] px-3 py-2.5">
            {messages.length > 1 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setShowDrawerPrompts((prev) => !prev)}
                  aria-expanded={showDrawerPrompts}
                  className="flex w-full items-center justify-between rounded border border-[#E5DAC8] bg-[#FBF8F3] px-2.5 py-1.5 text-xs font-medium text-[#6B1426] hover:border-[#B58938] transition-colors cursor-pointer"
                >
                  <span>Default Questions ({QUICK_PROMPTS.length})</span>
                  {showDrawerPrompts ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                </button>

                {showDrawerPrompts && (
                  <div className="mt-1.5 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-0.5">
                    {QUICK_PROMPTS.map((q, qIdx) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="flex w-full items-center justify-between gap-2 rounded border border-[#D8CBB8] bg-[#FFFDF9] px-2.5 py-1.5 text-left text-xs text-[#231917] hover:border-[#B58938] hover:bg-[#F3ECE0]/60 disabled:opacity-60 cursor-pointer"
                      >
                        <span className="flex items-start gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-[#6B1426] shrink-0">
                            0{qIdx + 1}
                          </span>
                          <span className="leading-snug whitespace-normal">
                            {q}
                          </span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#B58938]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Mythri about facilities, dates, or events..."
                className="h-10 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating WhatsApp & AI Chat Bot Actions */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 sm:right-6">
        {activeWhatsApp && (
          <a
            href={buildWhatsAppHref(
              activeWhatsApp,
              "Namaskaram! I would like to inquire about booking Vishnu Priya Function Hall, Eluru."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-[#1E6B47] bg-[#1E6B47] px-3.5 text-xs font-medium text-white shadow-md hover:bg-[#175437] transition-colors whitespace-nowrap shrink-0"
            aria-label="Chat on WhatsApp"
          >
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}

        <Button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="h-11 shadow-md"
          aria-label="Open Chat Bot"
        >
          {open ? (
            <>
              <X className="h-4 w-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <Bot className="h-3.5 w-3.5 text-[#D4B475]" />
              <span>Chat Bot</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
