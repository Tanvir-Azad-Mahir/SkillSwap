import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Loader2,
  MessageSquare,
  Minimize2,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function getInitials(name) {
  const value = String(name || "User").trim();
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function DashboardMessagesDrawer({ onClose }) {
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    const { data, error: conversationsError } = await supabase.rpc(
      "get_my_conversations"
    );

    if (conversationsError) throw conversationsError;

    setConversations(data || []);
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    try {
      const { data, error: messagesError } = await supabase.rpc(
        "get_conversation_messages",
        {
          p_conversation_id: conversationId,
          p_limit: 50,
          p_before: null,
        }
      );

      if (messagesError) throw messagesError;
      setMessages(data || []);

      const { error: readError } = await supabase.rpc(
        "mark_conversation_read",
        {
          p_conversation_id: conversationId,
        }
      );

      if (readError) {
        console.error(
          "DASHBOARD MARK MESSAGE READ ERROR:",
          readError
        );
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        if (!active) return;

        setCurrentUserId(user.id);
        await loadConversations();
      } catch (err) {
        console.error("DASHBOARD MESSAGES ERROR:", err);
        if (active) setError("Messages could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadConversations, navigate]);

  useEffect(() => {
    if (!selectedId) return undefined;

    loadMessages(selectedId).catch((err) => {
      console.error("DASHBOARD THREAD ERROR:", err);
      setError("This conversation could not be loaded.");
    });

    const interval = window.setInterval(() => {
      loadMessages(selectedId).catch(() => undefined);
      loadConversations().catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadConversations, loadMessages, selectedId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.conversation_id === selectedId
  );

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = draft.trim();

    if (!content || !selectedId || sending) return;

    try {
      setSending(true);
      setError("");

      const { error: sendError } = await supabase.rpc("send_message", {
        p_conversation_id: selectedId,
        p_content: content,
        p_reply_to_id: null,
      });

      if (sendError) throw sendError;

      setDraft("");
      await loadMessages(selectedId);
      await loadConversations();
    } catch (err) {
      console.error("DASHBOARD SEND MESSAGE ERROR:", err);
      setError(err?.message || "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`pointer-events-auto absolute bottom-4 right-4 flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden border border-white/10 bg-[#080b09]/95 shadow-2xl backdrop-blur-xl transition-all sm:bottom-6 sm:right-6 ${
          minimized ? "h-[58px]" : "h-[min(560px,calc(100vh-2rem))]"
        }`}
      >
        <header
          onClick={() => minimized && setMinimized(false)}
          className={`flex min-h-[58px] shrink-0 items-center justify-between border-b border-white/10 px-4 ${
            minimized ? "cursor-pointer" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <MessageSquare size={16} className="shrink-0 text-[#c7ff39]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Messages</p>
              {!minimized && (
                <p className="text-[10px] text-[#737373]">Your conversations</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? "Expand messages" : "Minimize messages"}
              title={minimized ? "Expand" : "Minimize"}
              className="grid h-8 w-8 place-items-center text-[#a1a1aa] hover:text-[#c7ff39]"
            >
              <Minimize2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close messages"
              title="Close"
              className="grid h-8 w-8 place-items-center text-[#a1a1aa] hover:text-[#c7ff39]"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {!minimized && (
          <div className="grid min-h-0 flex-1 grid-rows-[180px_minmax(0,1fr)]">
            <div className="min-h-0 overflow-y-auto border-b border-white/10">
              {loading ? (
                <div className="grid h-full place-items-center">
                  <Loader2 size={20} className="animate-spin text-[#c7ff39]" />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const name =
                    conversation.other_full_name ||
                    conversation.other_username ||
                    "User";
                  const active = conversation.conversation_id === selectedId;

                  return (
                    <button
                      key={conversation.conversation_id}
                      type="button"
                      onClick={() => setSelectedId(conversation.conversation_id)}
                      className={`flex w-full items-center gap-3 border-b border-white/[0.07] px-4 py-3 text-left ${
                        active ? "bg-[#c7ff39]/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {conversation.other_avatar_url ? (
                        <img
                          src={conversation.other_avatar_url}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-[10px] font-semibold text-[#c7ff39]">
                          {getInitials(name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">{name}</span>
                        <span className="mt-1 block truncate text-[10px] text-[#737373]">
                          {conversation.last_message_content || "No messages yet"}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="p-5 text-sm text-[#737373]">No conversations yet.</p>
              )}
            </div>

            <div className="flex min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {selectedConversation && (
                    selectedConversation.other_avatar_url ? (
                      <img
                        src={selectedConversation.other_avatar_url}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-[9px] font-semibold text-[#c7ff39]">
                        {getInitials(
                          selectedConversation.other_full_name ||
                            selectedConversation.other_username
                        )}
                      </span>
                    )
                  )}
                  <p className="truncate text-xs font-semibold">
                    {selectedConversation?.other_full_name ||
                      selectedConversation?.other_username ||
                      "Select a conversation"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(selectedId ? `/messages/${selectedId}` : "/messages")}
                  className="inline-flex items-center gap-1 text-[10px] text-[#a1a1aa] hover:text-[#c7ff39]"
                >
                  Open full <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {messagesLoading ? (
                  <div className="grid h-full place-items-center">
                    <Loader2 size={18} className="animate-spin text-[#c7ff39]" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-2">
                    {messages.map((message) => {
                      const mine = message.sender_id === currentUserId;
                      return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] px-3 py-2 text-xs ${mine ? "bg-[#c7ff39] text-[#071008]" : "border border-white/10 bg-[#0a0d0b]"}`}>
                            <p className="whitespace-pre-wrap break-words leading-5">{message.content}</p>
                            <p className={`mt-1 text-right text-[9px] ${mine ? "text-[#071008]/55" : "text-white/30"}`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid h-full place-items-center text-center text-xs text-[#737373]">
                    <p>{selectedId ? "Send the first message." : "Choose a conversation."}</p>
                  </div>
                )}
              </div>

              {error && <p className="px-4 pb-2 text-[10px] text-[#ff8b8b]">{error}</p>}

              <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-white/10 p-3">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!selectedId || sending}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 border border-white/10 bg-white/[0.025] px-3 py-2 text-xs outline-none focus:border-[#c7ff39]/40 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!selectedId || !draft.trim() || sending}
                  aria-label="Send message"
                  className="grid h-9 w-9 shrink-0 place-items-center bg-[#c7ff39] text-[#071008] disabled:opacity-40"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
