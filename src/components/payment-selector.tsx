"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

type ProviderKey = "kaspi" | "halyk_qr" | "halyk_card";

const providers: Array<{
  key: ProviderKey;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    key: "kaspi",
    label: "Kaspi QR",
    subtitle: "Оплата через Kaspi.kz",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
        K
      </div>
    ),
  },
  {
    key: "halyk_qr",
    label: "Halyk QR",
    subtitle: "Оплата через Halyk Bank",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
        H
      </div>
    ),
  },
  {
    key: "halyk_card",
    label: "Банковская карта",
    subtitle: "Visa, Mastercard, любой банк",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      </div>
    ),
  },
];

interface PaymentSelectorProps {
  bookingId: string;
  totalPrice: number;
  onSuccess?: () => void;
}

export default function PaymentSelector({
  bookingId,
  totalPrice,
  onSuccess,
}: PaymentSelectorProps) {
  const [loading, setLoading] = useState<ProviderKey | null>(null);
  const [error, setError] = useState("");

  async function handlePay(provider: ProviderKey) {
    setLoading(provider);
    setError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, provider }),
      });

      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text);
      } catch {
        /* empty */
      }

      if (!res.ok) {
        setError((data.error as string) || "Ошибка создания платежа");
        setLoading(null);
        return;
      }

      const paymentUrl = data.paymentUrl as string;
      if (paymentUrl) {
        onSuccess?.();
        window.location.href = paymentUrl;
      } else {
        setError("Не удалось получить ссылку на оплату");
        setLoading(null);
      }
    } catch {
      setError("Ошибка сети");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-1">К оплате</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(totalPrice)}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {providers.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePay(p.key)}
            disabled={loading !== null}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              loading === p.key
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            {p.icon}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">{p.label}</div>
              <div className="text-xs text-gray-500">{p.subtitle}</div>
            </div>
            {loading === p.key ? (
              <svg
                className="w-5 h-5 text-primary animate-spin flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        Безопасная оплата. 0% комиссии.
      </p>
    </div>
  );
}
