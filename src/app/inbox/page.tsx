"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  getBookingsByIds,
  respondToBooking,
  getReviewedBookingIds,
  createReview,
  createQuote,
  acceptQuote,
  rejectQuote,
} from "@/lib/api";
import type { QuoteMetadata } from "@/lib/types";

const ACTIVITY_LABELS_MAP: Record<string, string> = {
  production: "Продакшн",
  event: "Мероприятие",
  meeting: "Встреча",
  leisure: "Отдых",
};

// Скрываем номера телефонов и email пока бронь не подтверждена
function maskContacts(text: string): string {
  return text
    .replace(/(\+?\d[\d\s\-()]{8,}\d)/g, "[контакт скрыт до подтверждения]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email скрыт до подтверждения]");
}

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
  type: "text" | "system" | "quote";
  booking_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface BookingMeta {
  id: string;
  listing_id: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  activity_type: string;
  total_price: number;
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
  host_id: string;
  metadata?: {
    base_price?: number;
    selected_add_ons?: string[];
    add_ons_snapshot?: Array<{ id: string; name: string; price: number; charge_type: "flat" | "per_hour"; total: number }>;
  };
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
  const [bookingsMap, setBookingsMap] = useState<Record<string, BookingMeta>>({});
  const [reviewedSet, setReviewedSet] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; listingId: string } | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const router = useRouter();
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConvoId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Load bookings referenced by system messages
  const loadBookingsForMessages = useCallback(async (msgs: Message[]) => {
    const ids = Array.from(
      new Set(msgs.filter((m) => m.type === "system" && m.booking_id).map((m) => m.booking_id!))
    );
    if (ids.length === 0) {
      setBookingsMap({});
      setReviewedSet(new Set());
      return;
    }
    const [rows, reviewed] = await Promise.all([
      getBookingsByIds(ids),
      getReviewedBookingIds(ids),
    ]);
    setReviewedSet(reviewed);
    const map: Record<string, BookingMeta> = {};
    for (const r of rows) {
      const listing = r.listings as { host_id?: string } | null;
      map[r.id as string] = {
        id: r.id as string,
        listing_id: r.listing_id as string,
        date: r.date as string,
        start_time: r.start_time as string,
        end_time: r.end_time as string,
        guest_count: r.guest_count as number,
        activity_type: r.activity_type as string,
        total_price: r.total_price as number,
        status: r.status as BookingMeta["status"],
        metadata: (r.metadata as BookingMeta["metadata"]) ?? undefined,
        host_id: (listing?.host_id as string) ?? "",
      };
    }
    setBookingsMap(map);
  }, []);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async () => {
    if (!activeId || !user) return;
    setLoadingMsgs(true);
    const data = await getMessages(activeId);
    const msgs = data as unknown as Message[];
    setMessages(msgs);
    await loadBookingsForMessages(msgs);
    setLoadingMsgs(false);
    await markMessagesRead(activeId, user.id);
    setTimeout(scrollToBottom, 100);
  }, [activeId, user, scrollToBottom, loadBookingsForMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime: подписываемся на новые/обновлённые сообщения активного диалога
  useEffect(() => {
    if (!activeId || !user) return;

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const newRow = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            const next = [...prev, newRow];
            // обновляем привязанные брони если это system-сообщение со ссылкой на бронь
            if (newRow.type === "system" && newRow.booking_id) {
              loadBookingsForMessages(next);
            }
            return next;
          });
          if (user) markMessagesRead(activeId, user.id);
          setTimeout(scrollToBottom, 50);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, user, loadBookingsForMessages, scrollToBottom]);

  // Хост подтверждает или отклоняет бронь
  async function handleRespond(bookingId: string, status: "confirmed" | "rejected") {
    if (!user) return;
    setBookingsMap((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], status } }));
    const { error } = await respondToBooking(bookingId, status, user.id);
    if (error) {
      setBookingsMap((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], status: "pending" } }));
      return;
    }
    await loadMessages();
  }

  // Есть ли подтверждённая бронь в этом диалоге → можно показывать контакты
  const hasConfirmedBooking = Object.values(bookingsMap).some(
    (b) => b.status === "confirmed" || b.status === "completed"
  );

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
                      {other.avatar && typeof other.avatar === 'string' && other.avatar.trim() !== '' ? (
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
                  {getOtherPerson(activeConvo).avatar && typeof getOtherPerson(activeConvo).avatar === 'string' && getOtherPerson(activeConvo).avatar.trim() !== '' ? (
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
                {activeConvo.listings?.images && activeConvo.listings.images.length > 0 && typeof activeConvo.listings.images[0] === 'string' && activeConvo.listings.images[0].trim() !== '' && (
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

                      const dateHeader = showDate && (
                        <div className="text-center my-4">
                          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                            {new Date(msg.created_at).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>
                      );

                      // Кастомная смета хоста
                      if (msg.type === "quote") {
                        const meta = (msg.metadata ?? {}) as unknown as QuoteMetadata;
                        const isHost = activeConvo ? activeConvo.host_id === user.id : false;
                        const listingSlug = activeConvo?.listings?.slug ?? "";
                        return (
                          <div key={msg.id}>
                            {dateHeader}
                            <QuoteCard
                              messageId={msg.id}
                              meta={meta}
                              viewerIsHost={isHost}
                              onAccept={async () => {
                                const { error } = await acceptQuote(msg.id);
                                if (error) return;
                                if (listingSlug) {
                                  router.push(`/listing/${listingSlug}?quotePrice=${meta.price}&quoteHours=${meta.hours}`);
                                }
                              }}
                              onReject={async () => {
                                await rejectQuote(msg.id);
                                await loadMessages();
                              }}
                            />
                          </div>
                        );
                      }

                      // Системная карточка бронирования
                      if (msg.type === "system" && msg.booking_id) {
                        const b = bookingsMap[msg.booking_id];
                        const isHost = activeConvo ? activeConvo.host_id === user.id : false;
                        return (
                          <div key={msg.id}>
                            {dateHeader}
                            <BookingCard
                              booking={b}
                              isHost={isHost}
                              onRespond={handleRespond}
                              fallbackText={msg.content}
                              alreadyReviewed={msg.booking_id ? reviewedSet.has(msg.booking_id) : false}
                              onReview={(bookingId, listingId) => setReviewModal({ bookingId, listingId })}
                            />
                          </div>
                        );
                      }

                      const safeContent = hasConfirmedBooking ? msg.content : maskContacts(msg.content);

                      return (
                        <div key={msg.id}>
                          {dateHeader}
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? "bg-primary text-white rounded-br-md"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{safeContent}</p>
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
                    {!hasConfirmedBooking && (
                      <div className="text-center">
                        <span className="text-[11px] text-gray-400 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                          🔒 Контакты будут открыты после подтверждения бронирования
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  {activeConvo?.host_id === user.id && (
                    <button
                      type="button"
                      onClick={() => setQuoteModalOpen(true)}
                      title="Отправить смету"
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75 18 18m-7.5-3.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM2.25 6h19.5M2.25 12h12.75M2.25 18h12.75" />
                      </svg>
                    </button>
                  )}
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

      {reviewModal && (
        <ReviewModal
          bookingId={reviewModal.bookingId}
          listingId={reviewModal.listingId}
          authorId={user.id}
          onClose={() => setReviewModal(null)}
          onSubmitted={() => {
            setReviewedSet((prev) => new Set(prev).add(reviewModal.bookingId));
            setReviewModal(null);
          }}
        />
      )}

      {quoteModalOpen && activeId && (
        <QuoteModal
          conversationId={activeId}
          hostId={user.id}
          onClose={() => setQuoteModalOpen(false)}
          onSent={async () => { setQuoteModalOpen(false); await loadMessages(); }}
        />
      )}
    </div>
  );
}

function ReviewModal({
  bookingId,
  listingId,
  authorId,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  listingId: string;
  authorId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Поставьте оценку от 1 до 5 звёзд");
      return;
    }
    if (text.trim().length < 10) {
      setError("Напишите хотя бы пару предложений (минимум 10 символов)");
      return;
    }
    setSaving(true);
    setError("");
    const { error: e2 } = await createReview({
      listingId,
      bookingId,
      authorId,
      rating,
      text,
    });
    if (e2) {
      setError("Не удалось отправить отзыв. Попробуйте снова.");
      setSaving(false);
      return;
    }
    onSubmitted();
  }

  const display = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!saving) onClose(); }}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-40"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold pr-8">Оставить отзыв</h3>
        <p className="mt-1 text-sm text-gray-500">
          Поделитесь впечатлениями — это поможет другим арендаторам.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Stars */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} звёзд`}
                >
                  <svg
                    className={`w-9 h-9 transition-colors ${
                      n <= display ? "text-amber-400" : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 h-4">
              {display === 1 && "Ужасно"}
              {display === 2 && "Плохо"}
              {display === 3 && "Нормально"}
              {display === 4 && "Хорошо"}
              {display === 5 && "Отлично"}
            </div>
          </div>

          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Что понравилось, что можно улучшить, как прошла съёмка..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? "Отправка..." : "Отправить отзыв"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  isHost,
  onRespond,
  fallbackText,
  alreadyReviewed,
  onReview,
}: {
  booking: BookingMeta | undefined;
  isHost: boolean;
  onRespond: (id: string, status: "confirmed" | "rejected") => void;
  fallbackText: string;
  alreadyReviewed: boolean;
  onReview: (bookingId: string, listingId: string) => void;
}) {
  if (!booking) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-500">
        {fallbackText}
      </div>
    );
  }

  const dateStr = new Date(booking.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const activityLabel = ACTIVITY_LABELS_MAP[booking.activity_type] ?? booking.activity_type;
  const priceStr = new Intl.NumberFormat("ru-RU").format(booking.total_price) + " ₸";

  const palette = (() => {
    switch (booking.status) {
      case "confirmed":
        return { bg: "bg-green-50", border: "border-green-200", title: "Бронь подтверждена ✓", titleClr: "text-green-700" };
      case "rejected":
        return { bg: "bg-red-50", border: "border-red-200", title: "Запрос отклонён", titleClr: "text-red-700" };
      case "cancelled":
        return { bg: "bg-gray-50", border: "border-gray-200", title: "Бронь отменена", titleClr: "text-gray-600" };
      case "completed":
        return { bg: "bg-blue-50", border: "border-blue-200", title: "Бронирование завершено", titleClr: "text-blue-700" };
      default:
        return { bg: "bg-amber-50", border: "border-amber-200", title: "Запрос на бронирование", titleClr: "text-amber-800" };
    }
  })();

  return (
    <div className={`mx-auto max-w-md rounded-2xl border ${palette.border} ${palette.bg} px-5 py-4`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M5.25 6h13.5A2.25 2.25 0 0 1 21 8.25v10.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6Z" />
          </svg>
        </div>
        <div className={`text-sm font-bold ${palette.titleClr}`}>{palette.title}</div>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm text-gray-700">
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Дата</dt>
          <dd className="font-medium text-right">{dateStr}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Время</dt>
          <dd className="font-medium">{booking.start_time}–{booking.end_time}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Активность</dt>
          <dd className="font-medium">{activityLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Гостей</dt>
          <dd className="font-medium">{booking.guest_count}</dd>
        </div>
        {booking.metadata?.add_ons_snapshot && booking.metadata.add_ons_snapshot.length > 0 && (
          <div className="pt-2 border-t border-black/5">
            <div className="text-xs text-gray-500 mb-1">Доп. услуги:</div>
            <ul className="space-y-0.5">
              {booking.metadata.add_ons_snapshot.map((a) => (
                <li key={a.id} className="flex justify-between text-xs text-gray-500">
                  <span className="truncate pr-2">+ {a.name}</span>
                  <span className="tabular-nums">{new Intl.NumberFormat("ru-RU").format(a.total)} ₸</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t border-black/5">
          <dt className="text-gray-500">Сумма</dt>
          <dd className="font-bold">{priceStr}</dd>
        </div>
      </dl>

      {isHost && booking.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onRespond(booking.id, "rejected")}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Отклонить
          </button>
          <button
            onClick={() => onRespond(booking.id, "confirmed")}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            Подтвердить
          </button>
        </div>
      )}

      {!isHost && booking.status === "pending" && (
        <div className="mt-3 text-xs text-amber-700/80 text-center">
          Хост получил ваш запрос. Обычно отвечают в течение нескольких часов.
        </div>
      )}

      {!isHost && booking.status === "completed" && (
        <div className="mt-4">
          {alreadyReviewed ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              Вы уже оставили отзыв на эту локацию
            </div>
          ) : (
            <button
              onClick={() => onReview(booking.id, booking.listing_id)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              Оценить локацию
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteCard({
  meta,
  viewerIsHost,
  onAccept,
  onReject,
}: {
  messageId: string;
  meta: QuoteMetadata;
  viewerIsHost: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const priceStr = new Intl.NumberFormat("ru-RU").format(meta.price) + " ₸";
  const validUntil = meta.valid_until
    ? new Date(meta.valid_until).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const palette = (() => {
    switch (meta.status) {
      case "accepted":
        return { bg: "bg-green-50", border: "border-green-200", title: "Смета принята ✓", titleClr: "text-green-700" };
      case "rejected":
        return { bg: "bg-gray-50", border: "border-gray-200", title: "Смета отклонена", titleClr: "text-gray-600" };
      default:
        return { bg: "bg-blue-50", border: "border-blue-200", title: "Смета от хоста", titleClr: "text-blue-800" };
    }
  })();

  return (
    <div className={`mx-auto max-w-md rounded-2xl border ${palette.border} ${palette.bg} px-5 py-4`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
          <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
        <div className={`text-sm font-bold ${palette.titleClr}`}>{palette.title}</div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{priceStr}</div>
        <div className="text-sm text-gray-600 mt-1">за {meta.hours} ч</div>
        {validUntil && (
          <div className="text-xs text-gray-500 mt-2">Действует до {validUntil}</div>
        )}
      </div>

      {!viewerIsHost && meta.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            Отклонить
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            Принять
          </button>
        </div>
      )}

      {viewerIsHost && meta.status === "pending" && (
        <div className="mt-3 text-xs text-blue-700/80 text-center">
          Ожидаем ответа клиента
        </div>
      )}
    </div>
  );
}

function QuoteModal({
  conversationId,
  hostId,
  onClose,
  onSent,
}: {
  conversationId: string;
  hostId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [price, setPrice] = useState<number>(0);
  const [hours, setHours] = useState<number>(2);
  const [validUntil, setValidUntil] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (price < 1 || hours < 1) {
      setError("Цена и часы должны быть больше нуля");
      return;
    }
    setSaving(true);
    setError("");
    const { error: err } = await createQuote(conversationId, hostId, {
      price,
      hours,
      validUntil: validUntil || undefined,
    });
    if (err) {
      setError("Не удалось отправить. Возможно, миграция БД не применена.");
      setSaving(false);
      return;
    }
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!saving) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold pr-8">Отправить смету</h3>
        <p className="text-sm text-gray-500 mt-1">Кастомная цена для этого клиента</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₸)</label>
            <input
              type="number"
              required
              min={1}
              step={1000}
              value={price || ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="35000"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Часов</label>
            <input
              type="number"
              required
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Действует до (опционально)</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Отправка..." : "Отправить смету"}
          </button>
        </form>
      </div>
    </div>
  );
}
