"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
} from "@/lib/api";

interface Conversation {
  id: string;
  listing_id: string;
  guest_id: string;
  host_id: string;
  updated_at: string;
  listings: { title: string; slug: string; images: string[] } | null;
  guest: { name: string; avatar_url: string | null } | null;
  host: { name: string; avatar_url: string | null } | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialConvoId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConvoId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConvoId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const data = await getConversations(user.id);
    const convos: Conversation[] = data.map((c) => ({
      id: c.id as string,
      listing_id: c.listing_id as string,
      guest_id: c.guest_id as string,
      host_id: c.host_id as string,
      updated_at: c.updated_at as string,
      listings: c.listings as Conversation["listings"],
      guest: c.guest as Conversation["guest"],
      host: c.host as Conversation["host"],
    }));
    setConversations(convos);
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async () => {
    if (!activeId || !user) return;
    setLoadingMsgs(true);
    const data = await getMessages(activeId);
    setMessages(data as unknown as Message[]);
    setLoadingMsgs(false);
    await markMessagesRead(activeId, user.id);
    setTimeout(scrollToBottom, 100);
  }, [activeId, user, scrollToBottom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Poll for new messages every 5s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeId || !user) return;

    pollRef.current = setInterval(async () => {
      const data = await getMessages(activeId);
      setMessages(data as unknown as Message[]);
      await markMessagesRead(activeId, user.id);
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, user]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeId || !user) return;

    setSending(true);
    const { error } = await sendMessage(activeId, user.id, newMsg.trim());
    if (!error) {
      setNewMsg("");
      await loadMessages();
      loadConversations();
    }
    setSending(false);
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowChat(true);
  }

  const activeConvo = conversations.find((c) => c.id === activeId);

  function getOtherPerson(convo: Conversation) {
    if (!user) return { name: "", avatar: "" };
    const isGuest = convo.guest_id === user.id;
    const person = isGuest ? convo.host : convo.guest;
    return {
      name: person?.name ?? "Пользователь",
      avatar: person?.avatar_url ?? "",
    };
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return d.toLocaleDateString("ru-RU", { weekday: "short" });
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Sidebar — conversation list */}
        <div
          className={`${
            mobileShowChat ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-96 bg-white border-r border-gray-200`}
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h1 className="text-xl font-bold">Сообщения</h1>
          </div>

          {loadingConvos ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-gray-400 text-sm">Загрузка...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <p className="text-gray-500 text-sm">Пока нет сообщений</p>
              <p className="text-gray-400 text-xs mt-1">Напишите хосту на странице локации</p>
              <Link href="/catalog" className="mt-4 text-primary text-sm font-medium hover:underline">
                Найти локацию
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((convo) => {
                const other = getOtherPerson(convo);
                const isActive = convo.id === activeId;
                return (
                  <button
                    key={convo.id}
                    onClick={() => selectConversation(convo.id)}
                    className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      {other.avatar ? (
                        <Image src={other.avatar} alt={other.name} fill className="object-cover" sizes="44px" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{other.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{other.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(convo.updated_at)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {convo.listings?.title ?? "Локация"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat pane */}
        <div
          className={`${
            mobileShowChat ? "flex" : "hidden md:flex"
          } flex-col flex-1 bg-white`}
        >
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {getOtherPerson(activeConvo).avatar ? (
                    <Image
                      src={getOtherPerson(activeConvo).avatar}
                      alt={getOtherPerson(activeConvo).name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {getOtherPerson(activeConvo).name[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{getOtherPerson(activeConvo).name}</div>
                  {activeConvo.listings && (
                    <Link
                      href={`/listing/${activeConvo.listings.slug}`}
                      className="text-xs text-primary hover:underline truncate block"
                    >
                      {activeConvo.listings.title}
                    </Link>
                  )}
                </div>
                {activeConvo.listings?.images?.[0] && (
                  <Link
                    href={`/listing/${activeConvo.listings.slug}`}
                    className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hidden sm:block"
                  >
                    <Image
                      src={activeConvo.listings.images[0]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </Link>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-gray-400 text-sm">Загрузка...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Начните диалог</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMine = msg.sender_id === user.id;
                      const showDate =
                        i === 0 ||
                        new Date(msg.created_at).toDateString() !==
                          new Date(messages[i - 1].created_at).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                {new Date(msg.created_at).toLocaleDateString("ru-RU", {
                                  day: "numeric",
                                  month: "long",
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? "bg-primary text-white rounded-br-md"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <div
                                className={`text-[10px] mt-1 flex items-center gap-1 ${
                                  isMine ? "text-white/60 justify-end" : "text-gray-400"
                                }`}
                              >
                                {formatTime(msg.created_at)}
                                {isMine && (
                                  <svg className={`w-3.5 h-3.5 ${msg.is_read ? "text-white/80" : "text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Напишите сообщение..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none max-h-32"
                    style={{ minHeight: "42px" }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMsg.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {sending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <svg className="w-20 h-20 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-400">Выберите беседу</h2>
              <p className="mt-1 text-sm text-gray-400">
                Выберите диалог слева или напишите хосту со страницы локации
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
