import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCcw,
  Reply,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

function formatConversationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name) {
  const clean = String(name || "").trim();

  if (!clean) return "?";

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function Messages() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const messagesEndRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [startingConversation, setStartingConversation] = useState("");

  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        setCurrentUserId(user.id);

        const {
          data,
          error: conversationError,
        } = await supabase.rpc("get_my_conversations");

        if (conversationError) throw conversationError;

        setConversations(data || []);
      } catch (err) {
        console.error("MESSAGES CONVERSATIONS ERROR:", err);

        setError(
          err?.message ||
            "We couldn't load your conversations."
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        if (!silent) setChatLoading(true);

        const {
          data,
          error: messageError,
        } = await supabase.rpc(
          "get_conversation_messages",
          {
            p_conversation_id: conversationId,
            p_limit: 100,
            p_before: null,
          }
        );

        if (messageError) throw messageError;

        setMessages(data || []);

        const { error: readError } = await supabase.rpc(
          "mark_conversation_read",
          {
            p_conversation_id: conversationId,
          }
        );

        if (readError) {
          console.warn(
            "MARK CONVERSATION READ ERROR:",
            readError
          );
        }

        await loadConversations({ silent: true });
      } catch (err) {
        console.error("MESSAGES LOAD ERROR:", err);

        setError(
          err?.message ||
            "We couldn't load this conversation."
        );
      } finally {
        if (!silent) setChatLoading(false);
      }
    },
    [conversationId, loadConversations]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const interval = window.setInterval(() => {
      loadMessages({ silent: true });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadConversations({ silent: true });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  const selectedConversation = useMemo(() => {
    return (
      conversations.find(
        (item) =>
          item.conversation_id === conversationId
      ) || null
    );
  }, [conversations, conversationId]);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((item) => {
      const name = String(
        item.other_full_name || ""
      ).toLowerCase();

      const username = String(
        item.other_username || ""
      ).toLowerCase();

      const preview = String(
        item.last_message_content || ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        preview.includes(query)
      );
    });
  }, [conversations, conversationSearch]);

  const messageMap = useMemo(() => {
    return new Map(
      messages.map((message) => [
        message.id,
        message,
      ])
    );
  }, [messages]);

  const sendMessage = async (event) => {
    event?.preventDefault();

    if (!conversationId) return;

    const content = draft.trim();

    if (!content) return;

    try {
      setSending(true);
      setError("");

      const { error: sendError } = await supabase.rpc(
        "send_message",
        {
          p_conversation_id: conversationId,
          p_content: content,
          p_reply_to_id: replyingTo?.id || null,
        }
      );

      if (sendError) throw sendError;

      setDraft("");
      setReplyingTo(null);

      await loadMessages({ silent: true });
      await loadConversations({ silent: true });
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);

      setError(
        err?.message === "MESSAGE_TOO_LONG"
          ? "Messages can be up to 5000 characters."
          : err?.message ||
              "Your message could not be sent."
      );
    } finally {
      setSending(false);
    }
  };

  const searchUsers = useCallback(async () => {
    try {
      setUserSearchLoading(true);

      const {
        data,
        error: searchError,
      } = await supabase.rpc(
        "search_message_users",
        {
          p_query: userSearch.trim(),
          p_limit: 12,
        }
      );

      if (searchError) throw searchError;

      setUserResults(data || []);
    } catch (err) {
      console.error("MESSAGE USER SEARCH ERROR:", err);

      setError(
        err?.message ||
          "We couldn't search users."
      );

      setUserResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (!newChatOpen) return undefined;

    const timer = window.setTimeout(() => {
      searchUsers();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [newChatOpen, userSearch, searchUsers]);

  const startConversation = async (otherUserId) => {
    try {
      setStartingConversation(otherUserId);
      setError("");

      const {
        data,
        error: startError,
      } = await supabase.rpc(
        "get_or_create_conversation",
        {
          p_other_user_id: otherUserId,
        }
      );

      if (startError) throw startError;

      if (!data) {
        throw new Error("CONVERSATION_NOT_CREATED");
      }

      setNewChatOpen(false);
      setUserSearch("");
      setUserResults([]);

      await loadConversations({ silent: true });

      navigate(`/messages/${data}`);
    } catch (err) {
      console.error("START CONVERSATION ERROR:", err);

      setError(
        err?.message ||
          "The conversation could not be started."
      );
    } finally {
      setStartingConversation("");
    }
  };

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <Loader2
            size={26}
            className="mx-auto animate-spin text-[#c7ff39]"
          />

          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading messages
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 82% 0%, rgba(199,255,57,.06), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#c7ff39]"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008]"
            >
              <Plus size={14} />
              New message
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-auto max-w-[1600px] px-5 pt-5 md:px-8 lg:px-10">
            <div className="flex items-start justify-between gap-4 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto grid h-[calc(100vh-72px)] max-w-[1600px] grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)]">
          <aside
            className={`min-h-0 border-r border-white/10 bg-[#080b09]/70 ${
              conversationId
                ? "hidden md:flex"
                : "flex"
            } flex-col`}
          >
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                    Inbox
                  </p>

                  <h1 className="mt-1 text-2xl font-medium">
                    Messages
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => loadConversations()}
                  className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] hover:text-[#c7ff39]"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>

              <div className="relative mt-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  value={conversationSearch}
                  onChange={(event) =>
                    setConversationSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search conversations"
                  className="min-h-11 w-full border border-white/10 bg-white/[0.025] pl-9 pr-3 text-sm outline-none focus:border-[#c7ff39]/40"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((item) => {
                  const active =
                    item.conversation_id ===
                    conversationId;

                  const displayName =
                    item.other_full_name ||
                    item.other_username ||
                    "User";

                  const unread = Number(
                    item.unread_count || 0
                  );

                  return (
                    <button
                      key={item.conversation_id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/messages/${item.conversation_id}`
                        )
                      }
                      className={`flex w-full items-start gap-3 border-b border-white/[0.07] p-4 text-left transition ${
                        active
                          ? "bg-[#c7ff39]/[0.055]"
                          : "hover:bg-white/[0.025]"
                      }`}
                    >
                      {item.other_avatar_url ? (
                        <img
                          src={item.other_avatar_url}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-xs font-semibold text-[#c7ff39]">
                          {getInitials(displayName)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium">
                            {displayName}
                          </p>

                          <span className="shrink-0 text-[10px] text-white/30">
                            {formatConversationTime(
                              item.last_message_created_at ||
                                item.conversation_updated_at
                            )}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs text-[#a1a1aa]">
                            {item.last_message_content
                              ? item.last_message_sender_id ===
                                currentUserId
                                ? `You: ${item.last_message_content}`
                                : item.last_message_content
                              : "No messages yet"}
                          </p>

                          {unread > 0 && (
                            <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#c7ff39] px-1 text-[9px] font-bold text-[#071008]">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-7">
                  <MessageSquare
                    size={20}
                    className="text-white/25"
                  />

                  <h3 className="mt-4 text-lg font-medium">
                    No conversations yet.
                  </h3>

                  <p className="mt-2 text-sm text-[#a1a1aa]">
                    Start a conversation with another SkillSwap+ member.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section
            className={`min-h-0 ${
              conversationId
                ? "flex"
                : "hidden md:flex"
            } flex-col`}
          >
            {!conversationId ? (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <MessageSquare
                    size={28}
                    className="mx-auto text-[#c7ff39]"
                  />

                  <h2 className="mt-4 text-2xl font-medium">
                    Select a conversation
                  </h2>
                </div>
              </div>
            ) : (
              <>
                <div className="flex min-h-[74px] items-center justify-between border-b border-white/10 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/messages")}
                      className="grid h-9 w-9 place-items-center border border-white/10 md:hidden"
                    >
                      <ArrowLeft size={15} />
                    </button>

                    <div>
                      <p className="text-sm font-semibold">
                        {selectedConversation?.other_full_name ||
                          selectedConversation?.other_username ||
                          "Conversation"}
                      </p>

                      {selectedConversation?.other_username && (
                        <p className="mt-0.5 text-[11px] text-[#a1a1aa]">
                          @{selectedConversation.other_username}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadMessages()}
                    className="grid h-10 w-10 place-items-center border border-white/10 text-[#a1a1aa] hover:text-[#c7ff39]"
                  >
                    <RefreshCcw size={14} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  {chatLoading ? (
                    <div className="grid h-full place-items-center">
                      <Loader2
                        size={22}
                        className="animate-spin text-[#c7ff39]"
                      />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="mx-auto max-w-4xl space-y-3">
                      {messages.map((message) => {
                        const mine =
                          message.sender_id ===
                          currentUserId;

                        const repliedMessage =
                          message.reply_to_id
                            ? messageMap.get(
                                message.reply_to_id
                              )
                            : null;

                        return (
                          <div
                            key={message.id}
                            className={`group flex ${
                              mine
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div className="max-w-[85%] sm:max-w-[72%]">
                              {repliedMessage && (
                                <div className="mb-1 border-l-2 border-[#c7ff39]/30 bg-white/[0.025] px-3 py-2 text-xs text-[#a1a1aa]">
                                  {repliedMessage.content}
                                </div>
                              )}

                              <div
                                className={`px-4 py-3 ${
                                  mine
                                    ? "bg-[#c7ff39] text-[#071008]"
                                    : "border border-white/10 bg-[#0a0d0b]"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                  {message.content}
                                </p>

                                <div
                                  className={`mt-2 text-right text-[9px] ${
                                    mine
                                      ? "text-[#071008]/55"
                                      : "text-white/30"
                                  }`}
                                >
                                  {message.is_edited && "edited · "}
                                  {formatMessageTime(
                                    message.created_at
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setReplyingTo(message)
                                }
                                className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/25 opacity-0 group-hover:opacity-100"
                              >
                                <Reply size={11} />
                                Reply
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center">
                      <p className="text-sm text-[#a1a1aa]">
                        Send the first message.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 bg-[#080b09]/90 p-4 sm:px-6">
                  <div className="mx-auto max-w-4xl">
                    {replyingTo && (
                      <div className="mb-3 flex items-start justify-between gap-4 border border-white/10 bg-white/[0.025] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-[0.13em] text-[#c7ff39]">
                            Replying to
                          </p>

                          <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                            {replyingTo.content}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <form
                      onSubmit={sendMessage}
                      className="flex items-end gap-3"
                    >
                      <textarea
                        value={draft}
                        onChange={(event) =>
                          setDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();

                            if (
                              draft.trim() &&
                              !sending
                            ) {
                              sendMessage(event);
                            }
                          }
                        }}
                        placeholder="Write a message..."
                        rows={1}
                        maxLength={5000}
                        className="max-h-40 min-h-12 flex-1 resize-none border border-white/10 bg-white/[0.025] px-4 py-3 text-sm outline-none focus:border-[#c7ff39]/40"
                      />

                      <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="grid h-12 w-12 place-items-center bg-[#c7ff39] text-[#071008] disabled:opacity-40"
                      >
                        {sending ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {newChatOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-white/10 bg-[#0a0d0b]">
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={14}
                    className="text-[#c7ff39]"
                  />

                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                    New message
                  </p>
                </div>

                <h2 className="mt-2 text-xl font-medium">
                  Start a conversation
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewChatOpen(false);
                  setUserSearch("");
                  setUserResults([]);
                }}
                className="grid h-9 w-9 place-items-center border border-white/10"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  autoFocus
                  value={userSearch}
                  onChange={(event) =>
                    setUserSearch(event.target.value)
                  }
                  placeholder="Search by name or username"
                  className="min-h-12 w-full border border-white/10 bg-white/[0.025] pl-9 pr-3 text-sm outline-none focus:border-[#c7ff39]/40"
                />
              </div>

              <div className="mt-4 max-h-[420px] overflow-y-auto border border-white/10">
                {userSearchLoading ? (
                  <div className="grid min-h-40 place-items-center">
                    <Loader2
                      size={20}
                      className="animate-spin text-[#c7ff39]"
                    />
                  </div>
                ) : userResults.length > 0 ? (
                  userResults.map((person) => {
                    const displayName =
                      person.full_name ||
                      person.username ||
                      "User";

                    const busy =
                      startingConversation ===
                      person.id;

                    return (
                      <button
                        key={person.id}
                        type="button"
                        disabled={Boolean(startingConversation)}
                        onClick={() =>
                          startConversation(person.id)
                        }
                        className="flex w-full items-center gap-3 border-b border-white/[0.07] p-4 text-left transition last:border-b-0 hover:bg-white/[0.025] disabled:opacity-50"
                      >
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-xs font-semibold text-[#c7ff39]">
                            {getInitials(displayName)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {displayName}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#a1a1aa]">
                            @{person.username || "user"}
                          </p>
                        </div>

                        {busy && (
                          <Loader2
                            size={16}
                            className="animate-spin text-[#c7ff39]"
                          />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-7 text-center text-sm text-[#a1a1aa]">
                    No users found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
