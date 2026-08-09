"use client";

import { Bot, CheckCircle2, LockKeyhole, Send, ShieldCheck, Sparkles, TriangleAlert, User } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatResponse = {
  answer: string;
  suggested_questions: string[];
  provider: string;
  model: string;
  disclaimer: string;
};

const starterQuestions = [
  "Why does this change conflict with existing rows?",
  "Which application version should deploy first?",
  "What must pass before enforcing the constraint?",
];

export default function SchemaChat({ analysisId, disabled = false }: { analysisId: string | null; disabled?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState(starterQuestions);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [busy, messages]);

  async function ask(question: string) {
    const message = question.trim();
    if (!analysisId || !message || busy || disabled) return;
    const userMessage: ChatMessage = { role: "user", content: message };
    const lastMessage = messages.at(-1);
    const history = (
      lastMessage?.role === "user" && lastMessage.content === message
        ? messages
        : [...messages, userMessage]
    ).slice(-8);
    setMessages(history);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/rollbackready/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history: messages.slice(-8) }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ChatResponse
        | { error?: { message?: string } }
        | null;
      if (!response.ok || !payload || !("answer" in payload)) {
        throw new Error(
          payload && "error" in payload
            ? payload.error?.message ?? `Schema advisor failed with ${response.status}.`
            : `Schema advisor failed with ${response.status}.`,
        );
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.answer },
      ]);
      setSuggestions(payload.suggested_questions.length ? payload.suggested_questions : starterQuestions);
      setProvider(`${payload.provider} · ${payload.model}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Schema advisor is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <section className="schema-chat" aria-labelledby="schema-chat-title">
      <header>
        <div><Sparkles size={18} /><span>Evidence advisor</span></div>
        <strong id="schema-chat-title">Ask about this schema change</strong>
        <p>Get plain-language answers grounded in this analysis, its findings, and the generated recovery plan.</p>
        <div className="schema-chat-guardrails">
          <span><CheckCircle2 size={14} /> Sanitized evidence</span>
          <span><LockKeyhole size={14} /> No fixture values</span>
          <span><ShieldCheck size={14} /> Human review required</span>
        </div>
      </header>
      <div ref={logRef} className="schema-chat-log" aria-live="polite">
        {!analysisId && <div className="schema-chat-empty"><ShieldCheck size={19} /><span>Run an analysis to start an evidence-grounded conversation.</span></div>}
        {analysisId && !messages.length && <div className="schema-chat-empty"><i><Bot size={22} /></i><div><strong>Your analysis is ready to discuss</strong><span>Choose a suggested question below or ask in your own words.</span></div></div>}
        {messages.map((message, index) => <article key={`${message.role}-${index}`} className={`schema-message schema-message-${message.role}`}><i>{message.role === "user" ? <User size={13} /> : <Bot size={13} />}</i><div><small>{message.role === "user" ? "You" : "Schema advisor"}</small><p>{message.content}</p></div></article>)}
        {busy && <div className="schema-chat-thinking"><i /><span>Grounding the answer in sanitized evidence…</span></div>}
      </div>
      {error && <div className="schema-chat-error" role="alert"><TriangleAlert size={16} /><div><strong>Advisor could not answer</strong><span>{error}</span></div></div>}
      <div className="schema-chat-prompts">{suggestions.map((question) => <button key={question} type="button" onClick={() => void ask(question)} disabled={!analysisId || busy || disabled}>{question}</button>)}</div>
      <form onSubmit={submit}>
        <label htmlFor="schema-chat-input">Question about the migration or recovery plan</label>
        <div><input id="schema-chat-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} disabled={!analysisId || busy || disabled} placeholder={analysisId ? "Ask about risk, rollout order, compatibility, or recovery…" : "Analysis required"} /><Button type="submit" size="sm" disabled={!analysisId || !input.trim() || busy || disabled}>{busy ? "Thinking" : "Ask"} <Send size={14} /></Button></div>
      </form>
      <footer><span>{provider ?? "LangGraph constrained advisor"}</span><span>Advisory only · human review required</span></footer>
    </section>
  );
}
