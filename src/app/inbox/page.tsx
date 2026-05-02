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
  hasHostReviewedGuest,
  createDispute,
  sendScoutInvite,
  respondToScout,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
import type { Notification } from "@/lib/api";
import type { QuoteMetadata } from "@/lib/types";
import EmptyState from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n";

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
  scout_status: string | null;
  listings: { title: string; slug: string; images: string[]; address?: string } | null;
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
  renter_id: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  activity_type: string;
  total_price: number;
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
  payment_status: string;
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
  const { t } = useT();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialConvoId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConvoId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookingsMap, setBookingsMap] = useState<Record<string, BookingMeta>>({});
  const [reviewedSet, setReviewedSet] = useState<Set<string>>(new Set());
  const [guestReviewedSet, setGuestReviewedSet] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; listingId: string; targetType: "listing" | "guest"; targetUserId?: string } | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [scoutModalOpen, setScoutModalOpen] = useState(false);
  const [scoutDate, setScoutDate] = useState("");
  const [scoutTime, setScoutTime] = useState("14:00");
  const [scoutDeclineModalOpen, setScoutDeclineModalOpen] = useState(false);
  const [scoutDeclineReason, setScoutDeclineReason] = useState("");
  const [scoutBusy, setScoutBusy] = useState(false);
  const router = useRouter();
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConvoId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotifId, setActiveNotifId] = useState<string | null>(null);
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
      scout_status: (c.scout_status as string | null) ?? null,
      listings: c.listings as Conversation["listings"],
      guest: c.guest as Conversation["guest"],
      host: c.host as Conversation["host"],
    }));
    setConversations(convos);
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
    if (user) getNotifications(user.id).then(setNotifications);
  }, [loadConversations, user]);

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  async function handleSelectNotif(id: string) {
    setActiveNotifId(id);
    setActiveId(null); // deselect conversation
    setMobileShowChat(true);
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.is_read) {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    }
  }

  async function handleMarkAllNotifsRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  // Load bookings referenced by system messages
  const loadBookingsForMessages = useCallback(async (msgs: Message[]) => {
    const ids = Array.from(
      new Set(msgs.filter((m) => m.type === "system" && m.booking_id).map((m) => m.booking_id!))
    );
    if (ids.length === 0) {
      setBookingsMap({});
      setReviewedSet(new Set());
      setGuestReviewedSet(new Set());
      return;
    }
    const [rows, reviewed] = await Promise.all([
      getBookingsByIds(ids),
      getReviewedBookingIds(ids),
    ]);
    setReviewedSet(reviewed);

    // Хост-отзывы о госте: проверяем только для тех броней, где текущий user — хост
    if (user) {
      const guestReviewed = new Set<string>();
      await Promise.all(
        ids.map(async (bid) => {
          const ok = await hasHostReviewedGuest(bid, user.id);
          if (ok) guestReviewed.add(bid);
        })
      );
      setGuestReviewedSet(guestReviewed);
    }
    const map: Record<string, BookingMeta> = {};
    for (const r of rows) {
      const listing = r.listings as { host_id?: string } | null;
      map[r.id as string] = {
        id: r.id as string,
        listing_id: r.listing_id as string,
        renter_id: r.renter_id as string,
        date: r.date as string,
        start_time: r.start_time as string,
        end_time: r.end_time as string,
        guest_count: r.guest_count as number,
        activity_type: r.activity_type as string,
        total_price: r.total_price as number,
        status: r.status as BookingMeta["status"],
        payment_status: (r.payment_status as string) ?? "unpaid",
        metadata: (r.metadata as BookingMeta["metadata"]) ?? undefined,
        host_id: (listing?.host_id as string) ?? "",
      };
    }
    setBookingsMap(map);
  }, [user]);

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

  const [contactWarning, setContactWarning] = useState(false);

  // Dispute
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSending, setDisputeSending] = useState(false);
  const [disputeSent, setDisputeSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeId || !user) return;

    setSending(true);
    const result = await sendMessage(activeId, user.id, newMsg.trim());
    if (!result.error) {
      setNewMsg("");
      if ((result as Record<string, unknown>).contactBlocked) {
        setContactWarning(true);
        setTimeout(() => setContactWarning(false), 5000);
      }
      await loadMessages();
      loadConversations();
    }
    setSending(false);
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setActiveNotifId(null);
    setMobileShowChat(true);
  }

  const activeConvo = conversations.find((c) => c.id === activeId);

  function getOtherPerson(convo: Conversation) {
    if (!user) return { name: "", avatar: "" };
    const isGuest = convo.guest_id === user.id;
    const person = isGuest ? convo.host : convo.guest;
    return {
      name: person?.name ?? t("inbox.user"),
      avatar: person?.avatar_url ?? "",
    };
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return t("inbox.yesterday");
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
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">{t("inbox.messages")}</h1>
              {unreadNotifCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadNotifCount}</span>
              )}
            </div>
          </div>

          {/* Notifications section — always visible if there are any */}
          {notifications.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-5 py-2 flex items-center justify-between bg-primary/5">
                <span className="text-xs font-semibold text-primary uppercase">{t("inbox.notifTitle")}</span>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {t("inbox.readAll")}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.slice(0, 20).map((n) => {
                  const isActive = activeNotifId === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleSelectNotif(n.id)}
                      className={`w-full text-left px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      } ${!n.is_read ? "bg-primary/[0.03]" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">L</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm truncate ${!n.is_read ? "font-bold text-gray-900" : "text-gray-700"}`}>
                              LOKACIA
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {new Date(n.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className={`text-sm truncate mt-0.5 ${!n.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                            {n.title}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{n.body}</div>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loadingConvos ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-gray-400 text-sm">{t("inbox.loading")}</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="inbox"
                title={t("inbox.emptyTitle")}
                description={t("inbox.emptyDesc")}
                action={{ label: t("inbox.findLocation"), href: "/catalog" }}
              />
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
                        {convo.listings?.title ?? t("inbox.location")}
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
          {activeNotifId && !activeId ? (
            /* Notification detail view */
            (() => {
              const notif = notifications.find((n) => n.id === activeNotifId);
              if (!notif) return null;
              return (
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
                    <button
                      onClick={() => { setActiveNotifId(null); setMobileShowChat(false); }}
                      className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">L</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">LOKACIA</h2>
                      <p className="text-xs text-gray-500">
                        {notif.type === "broadcast" ? t("inbox.broadcast") : notif.type === "booking" ? t("inbox.bookingNotif") : t("inbox.notification")}
                      </p>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 bg-gray-50">
                    <div className="max-w-lg mx-auto">
                      <div className="text-xs text-gray-400 mb-4">
                        {new Date(notif.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{notif.title}</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{notif.body}</p>
                      </div>
                      {notif.link && notif.link !== "/inbox" && (
                        <a
                          href={notif.link}
                          className="inline-flex items-center gap-2 mt-4 text-sm text-primary font-medium hover:underline"
                        >
                          {t("inbox.goTo")}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : activeConvo ? (
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

                {/* Report button */}
                {Object.keys(bookingsMap).length > 0 && (
                  <button
                    onClick={() => { setDisputeOpen(true); setDisputeSent(false); setDisputeReason(""); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title={t("inbox.report")}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dispute modal */}
              {disputeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDisputeOpen(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                    {disputeSent ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg">{t("inbox.reportSent")}</h3>
                        <p className="text-sm text-gray-500 mt-2">{t("inbox.reportSentDesc")}</p>
                        <button onClick={() => setDisputeOpen(false)} className="mt-4 px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
                          {t("inbox.close")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-lg mb-2">{t("inbox.report")}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t("inbox.reportDesc")}</p>
                        <textarea
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder={t("inbox.reportPh")}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none mb-4"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDisputeOpen(false)}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t("inbox.cancel")}
                          </button>
                          <button
                            onClick={async () => {
                              if (!disputeReason.trim() || !user) return;
                              setDisputeSending(true);
                              // Find a booking ID from this conversation
                              const bookingIds = Object.keys(bookingsMap);
                              if (bookingIds.length > 0) {
                                await createDispute(bookingIds[0], user.id, disputeReason.trim());
                              }
                              setDisputeSending(false);
                              setDisputeSent(true);
                            }}
                            disabled={disputeSending || !disputeReason.trim()}
                            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                          >
                            {disputeSending ? t("inbox.reportSending") : t("inbox.reportSubmit")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-gray-400 text-sm">{t("inbox.loading")}</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">{t("inbox.startChat")}</p>
                  </div>
                ) : (
                  <>
                    {/* Contact exchange banner */}
                    {!hasConfirmedBooking && (
                      <div className="mx-4 mt-3 mb-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                        </svg>
                        {t("inbox.contactBanner")}
                      </div>
                    )}

                    {/* Contact blocked toast */}
                    {contactWarning && (
                      <div className="mx-4 mt-2 mb-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2 animate-pulse">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                        {t("inbox.contactBlocked")}
                      </div>
                    )}

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
                              onReview={(bookingId, listingId) => setReviewModal({ bookingId, listingId, targetType: "listing" })}
                              guestReviewed={msg.booking_id ? guestReviewedSet.has(msg.booking_id) : false}
                              onReviewGuest={(bookingId, listingId, renterId) => setReviewModal({ bookingId, listingId, targetType: "guest", targetUserId: renterId })}
                            />
                          </div>
                        );
                      }

                      // Scout invite card
                      if (msg.type === "system" && (msg.metadata as Record<string, unknown>)?.type === "scout_invite") {
                        const meta = msg.metadata as Record<string, unknown>;
                        const address = activeConvo?.listings?.address ?? t("inbox.addressHidden");
                        return (
                          <div key={msg.id}>
                            {dateHeader}
                            <div className="mx-auto max-w-sm bg-white border-2 border-primary/20 rounded-2xl p-5 space-y-2">
                              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                {t("inbox.scoutInvite")}
                              </div>
                              <div className="text-sm text-gray-700 font-medium">{address}</div>
                              <div className="text-sm text-gray-500">
                                {meta.date as string} в {meta.time as string}
                              </div>
                              <div className="text-xs text-gray-400">{t("inbox.scoutHostWaiting")}</div>
                            </div>
                          </div>
                        );
                      }

                      // Scout response card
                      if (msg.type === "system" && (msg.metadata as Record<string, unknown>)?.type === "scout_response") {
                        const meta = msg.metadata as Record<string, unknown>;
                        const isBook = meta.result === "book";
                        return (
                          <div key={msg.id}>
                            {dateHeader}
                            <div className={`mx-auto max-w-sm rounded-2xl p-4 text-center text-sm font-medium ${
                              isBook
                                ? "bg-green-50 border border-green-200 text-green-700"
                                : "bg-gray-50 border border-gray-200 text-gray-600"
                            }`}>
                              {isBook
                                ? t("inbox.renterWantsBook")
                                : `${t("inbox.scoutDeclined")}${meta.reason ? `: ${meta.reason}` : ""}`}
                            </div>
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
                          🔒 {t("inbox.contactLocked")}
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Scout response bar — for renter after scout invite */}
              {activeConvo?.scout_status === "invited" && activeConvo.guest_id === user.id && (
                <div className="px-4 py-3 border-t border-gray-200 bg-primary/5">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t("inbox.scoutHow")}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={scoutBusy}
                      onClick={async () => {
                        setScoutBusy(true);
                        await respondToScout(activeConvo.id, user.id, "book");
                        setScoutBusy(false);
                        if (activeConvo.listings?.slug) {
                          router.push(`/listing/${activeConvo.listings.slug}`);
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {t("inbox.scoutBook")}
                    </button>
                    <button
                      type="button"
                      disabled={scoutBusy}
                      onClick={() => setScoutDeclineModalOpen(true)}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {t("inbox.scoutNotFit")}
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  {activeConvo?.host_id === user.id && (
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Scout invite button — only if no scout yet */}
                      {!activeConvo.scout_status && (
                        <button
                          type="button"
                          onClick={() => setScoutModalOpen(true)}
                          title={t("inbox.inviteScout")}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setQuoteModalOpen(true)}
                        title={t("inbox.sendEstimate")}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75 18 18m-7.5-3.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM2.25 6h19.5M2.25 12h12.75M2.25 18h12.75" />
                        </svg>
                      </button>
                    </div>
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
                    placeholder={t("inbox.msgPh")}
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
              <h2 className="text-lg font-semibold text-gray-400">{t("inbox.selectConvo")}</h2>
              <p className="mt-1 text-sm text-gray-400">
                {t("inbox.selectConvoDesc")}
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
          targetType={reviewModal.targetType}
          targetUserId={reviewModal.targetUserId}
          onClose={() => setReviewModal(null)}
          onSubmitted={() => {
            if (reviewModal.targetType === "guest") {
              setGuestReviewedSet((prev) => new Set(prev).add(reviewModal.bookingId));
            } else {
              setReviewedSet((prev) => new Set(prev).add(reviewModal.bookingId));
            }
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

      {/* Scout invite modal — host picks date & time */}
      {scoutModalOpen && activeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setScoutModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{t("inbox.inviteScout")}</h3>
            <p className="text-sm text-gray-500">{t("inbox.scoutRenterSees")}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("inbox.scoutDate")}</label>
              <input
                type="date"
                value={scoutDate}
                onChange={(e) => setScoutDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("inbox.scoutTime")}</label>
              <input
                type="time"
                value={scoutTime}
                onChange={(e) => setScoutTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setScoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("inbox.cancel")}
              </button>
              <button
                type="button"
                disabled={!scoutDate || scoutBusy}
                onClick={async () => {
                  setScoutBusy(true);
                  await sendScoutInvite(activeId, user.id, scoutDate, scoutTime);
                  setScoutBusy(false);
                  setScoutModalOpen(false);
                  setScoutDate("");
                  await loadMessages();
                  // Update scout_status locally
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === activeId ? { ...c, scout_status: "invited" } : c
                    )
                  );
                }}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {scoutBusy ? "..." : t("inbox.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scout decline modal — renter gives reason */}
      {scoutDeclineModalOpen && activeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setScoutDeclineModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{t("inbox.scoutDeclineTitle")}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("inbox.scoutDeclineLabel")}</label>
              <textarea
                value={scoutDeclineReason}
                onChange={(e) => setScoutDeclineReason(e.target.value)}
                rows={3}
                placeholder={t("inbox.scoutDeclinePh")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setScoutDeclineModalOpen(false); setScoutDeclineReason(""); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("inbox.cancel")}
              </button>
              <button
                type="button"
                disabled={scoutBusy}
                onClick={async () => {
                  setScoutBusy(true);
                  await respondToScout(activeId, user.id, "declined", scoutDeclineReason.trim() || undefined);
                  setScoutBusy(false);
                  setScoutDeclineModalOpen(false);
                  setScoutDeclineReason("");
                  await loadMessages();
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === activeId ? { ...c, scout_status: "declined" } : c
                    )
                  );
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {scoutBusy ? "..." : t("inbox.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewModal({
  bookingId,
  listingId,
  authorId,
  targetType = "listing",
  targetUserId,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  listingId: string;
  authorId: string;
  targetType?: "listing" | "guest";
  targetUserId?: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t("inbox.rateStars"));
      return;
    }
    if (text.trim().length < 10) {
      setError(t("inbox.reviewMinChars"));
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
      targetType,
      targetUserId,
    });
    if (e2) {
      setError(t("inbox.reviewError"));
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

        <h3 className="text-lg font-bold pr-8">
          {targetType === "guest" ? t("inbox.rateGuest") : t("inbox.leaveReview")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {targetType === "guest"
            ? t("inbox.guestQ")
            : t("inbox.reviewQ")}
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
              {display === 1 && t("inbox.star1")}
              {display === 2 && t("inbox.star2")}
              {display === 3 && t("inbox.star3")}
              {display === 4 && t("inbox.star4")}
              {display === 5 && t("inbox.star5")}
            </div>
          </div>

          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("inbox.reviewPh")}
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
            {saving ? t("inbox.reviewSending") : t("inbox.reviewSubmit")}
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
  guestReviewed,
  onReviewGuest,
}: {
  booking: BookingMeta | undefined;
  isHost: boolean;
  onRespond: (id: string, status: "confirmed" | "rejected") => void;
  fallbackText: string;
  alreadyReviewed: boolean;
  onReview: (bookingId: string, listingId: string) => void;
  guestReviewed: boolean;
  onReviewGuest: (bookingId: string, listingId: string, renterId: string) => void;
}) {
  const { t } = useT();

  const actLabels: Record<string, string> = {
    production: t("search.production"),
    event: t("search.event"),
    meeting: t("search.meeting"),
    leisure: t("search.leisure"),
  };

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
  const activityLabel = actLabels[booking.activity_type] ?? booking.activity_type;
  const priceStr = new Intl.NumberFormat("ru-RU").format(booking.total_price) + " ₸";

  const palette = (() => {
    switch (booking.status) {
      case "confirmed":
        return { bg: "bg-green-50", border: "border-green-200", title: t("inbox.statusConfirmed"), titleClr: "text-green-700" };
      case "rejected":
        return { bg: "bg-red-50", border: "border-red-200", title: t("inbox.statusRejected"), titleClr: "text-red-700" };
      case "cancelled":
        return { bg: "bg-gray-50", border: "border-gray-200", title: t("inbox.statusCancelled"), titleClr: "text-gray-600" };
      case "completed":
        return { bg: "bg-blue-50", border: "border-blue-200", title: t("inbox.statusCompleted"), titleClr: "text-blue-700" };
      default:
        return { bg: "bg-amber-50", border: "border-amber-200", title: t("inbox.statusPending"), titleClr: "text-amber-800" };
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
          <dt className="text-gray-500">{t("inbox.bookingDate")}</dt>
          <dd className="font-medium text-right">{dateStr}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{t("inbox.bookingTime")}</dt>
          <dd className="font-medium">{booking.start_time}–{booking.end_time}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{t("inbox.bookingActivity")}</dt>
          <dd className="font-medium">{activityLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">{t("inbox.bookingGuests")}</dt>
          <dd className="font-medium">{booking.guest_count}</dd>
        </div>
        {booking.metadata?.add_ons_snapshot && booking.metadata.add_ons_snapshot.length > 0 && (
          <div className="pt-2 border-t border-black/5">
            <div className="text-xs text-gray-500 mb-1">{t("inbox.bookingAddOns")}</div>
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
          <dt className="text-gray-500">{t("inbox.bookingTotal")}</dt>
          <dd className="font-bold">{priceStr}</dd>
        </div>
        {booking.status === "confirmed" && (
          <div className="flex justify-between gap-2 pt-1">
            <dt className="text-gray-500">{t("inbox.bookingPayment")}</dt>
            <dd>
              {booking.payment_status === "paid" ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  {t("inbox.bookingPaid")}
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">{t("inbox.bookingPendingPay")}</span>
              )}
            </dd>
          </div>
        )}
      </dl>

      {isHost && booking.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onRespond(booking.id, "rejected")}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            {t("inbox.bookingReject")}
          </button>
          <button
            onClick={() => onRespond(booking.id, "confirmed")}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            {t("inbox.bookingConfirm")}
          </button>
        </div>
      )}

      {!isHost && booking.status === "confirmed" && booking.payment_status !== "paid" && (
        <div className="mt-4">
          <Link
            href={`/bookings?open=${booking.id}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
            {t("inbox.payBooking")}
          </Link>
        </div>
      )}

      {!isHost && booking.status === "pending" && (
        <div className="mt-3 text-xs text-amber-700/80 text-center">
          {t("inbox.hostPending")}
        </div>
      )}

      {!isHost && booking.status === "completed" && (
        <div className="mt-4">
          {alreadyReviewed ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              {t("inbox.alreadyReviewed")}
            </div>
          ) : (
            <button
              onClick={() => onReview(booking.id, booking.listing_id)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              {t("inbox.rateLocation")}
            </button>
          )}
        </div>
      )}

      {isHost && booking.status === "completed" && (
        <div className="mt-4">
          {guestReviewed ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-purple-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              {t("inbox.alreadyRatedGuest")}
            </div>
          ) : (
            <button
              onClick={() => onReviewGuest(booking.id, booking.listing_id, booking.renter_id)}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
              </svg>
              {t("inbox.rateGuestBtn")}
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
  const { t } = useT();
  const priceStr = new Intl.NumberFormat("ru-RU").format(meta.price) + " ₸";
  const validUntil = meta.valid_until
    ? new Date(meta.valid_until).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const palette = (() => {
    switch (meta.status) {
      case "accepted":
        return { bg: "bg-green-50", border: "border-green-200", title: t("inbox.estimateAccepted"), titleClr: "text-green-700" };
      case "rejected":
        return { bg: "bg-gray-50", border: "border-gray-200", title: t("inbox.estimateRejected"), titleClr: "text-gray-600" };
      default:
        return { bg: "bg-blue-50", border: "border-blue-200", title: t("inbox.estimateFrom"), titleClr: "text-blue-800" };
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
        <div className="text-sm text-gray-600 mt-1">{t("inbox.estimateFor", { h: String(meta.hours) })}</div>
        {validUntil && (
          <div className="text-xs text-gray-500 mt-2">{t("inbox.estimateValidDate", { d: validUntil })}</div>
        )}
      </div>

      {!viewerIsHost && meta.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            {t("inbox.estimateDecline")}
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            {t("inbox.estimateAccept")}
          </button>
        </div>
      )}

      {viewerIsHost && meta.status === "pending" && (
        <div className="mt-3 text-xs text-blue-700/80 text-center">
          {t("inbox.estimateWaiting")}
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
  const { t } = useT();
  const [price, setPrice] = useState<number>(0);
  const [hours, setHours] = useState<number>(2);
  const [validUntil, setValidUntil] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (price < 1 || hours < 1) {
      setError(t("inbox.estimateError"));
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
      setError(t("inbox.estimateSaveError"));
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

        <h3 className="text-lg font-bold pr-8">{t("inbox.sendEstimate")}</h3>
        <p className="text-sm text-gray-500 mt-1">{t("inbox.estimateDesc")}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("inbox.estimatePrice")}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("inbox.estimateHours")}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("inbox.estimateValidUntil")}</label>
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
            {saving ? t("inbox.estimateSending") : t("inbox.estimateSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
