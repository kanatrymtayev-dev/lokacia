"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { updateProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const CITIES = [
  { value: "almaty", label: "Алматы" },
  { value: "astana", label: "Астана" },
  { value: "shymkent", label: "Шымкент" },
  { value: "karaganda", label: "Караганда" },
];

export default function OnboardingPage() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Phone OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Step 2
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user && user.onboarding_completed) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setAvatarUrl(user.avatar_url ?? null);
      if (user.phone_verified) setPhoneVerified(true);
    }
  }, [user]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  async function handleSendOtp() {
    if (!user || !phone.trim()) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Ошибка отправки SMS");
      } else {
        setOtpSent(true);
        setOtpCooldown(60);
      }
    } catch {
      setOtpError("Ошибка сети");
    }
    setOtpLoading(false);
  }

  async function handleVerifyOtp() {
    if (!user || !otpCode.trim()) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Неверный код");
      } else {
        setPhoneVerified(true);
        setOtpSent(false);
        setOtpCode("");
      }
    } catch {
      setOtpError("Ошибка сети");
    }
    setOtpLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = urlData.publicUrl + "?t=" + Date.now();
    setAvatarUrl(newUrl);
    await updateProfile(user.id, { avatar_url: newUrl });
    setUploading(false);
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);

    await updateProfile(user.id, {
      name: name.trim() || user.name,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    });

    // Mark onboarding as completed
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    // Refresh local user state so OnboardingGuard sees the update
    await refreshProfile();

    setSaving(false);

    if (user.role === "host") {
      router.push("/dashboard/new");
    } else {
      router.push("/catalog");
    }
  }

  function handleSkip() {
    handleFinish();
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">
            LOKACIA<span className="text-primary">.KZ</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          {/* Step 1: Avatar + Name + Phone */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t("onboarding.step1.title")}</h2>
              <p className="text-sm text-gray-500 mb-6">{t("onboarding.step1.subtitle")}</p>

              <div className="flex items-center gap-5 mb-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                  {avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() !== "" ? (
                    <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {name ? name[0].toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                    {uploading ? t("common.uploading") : t("onboarding.step1.uploadPhoto")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">JPG, PNG до 2 МБ</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ваше имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneVerified) setPhoneVerified(false);
                        setOtpSent(false);
                        setOtpCode("");
                        setOtpError("");
                      }}
                      placeholder="+7 777 123 45 67"
                      disabled={phoneVerified}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    {phoneVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium whitespace-nowrap">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
                        </svg>
                        Подтверждён
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || !phone.trim() || otpCooldown > 0}
                        className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {otpLoading ? "..." : otpCooldown > 0 ? `${otpCooldown}с` : otpSent ? "Ещё раз" : "Получить код"}
                      </button>
                    )}
                  </div>

                  {/* OTP input */}
                  {otpSent && !phoneVerified && (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="4 цифры"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tracking-[0.3em] text-center font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || otpCode.length < 4}
                          className="px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {otpLoading ? "..." : "Подтвердить"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Поднимите трубку — робот продиктует 4 цифры</p>
                    </div>
                  )}

                  {otpError && (
                    <p className="text-xs text-red-600 mt-1.5">{otpError}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Bio + City */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t("onboarding.step2.title")}</h2>
              <p className="text-sm text-gray-500 mb-6">{t("onboarding.step2.subtitle")}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">О себе</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder={user.role === "host" ? "Расскажите о ваших площадках и опыте..." : "Чем вы занимаетесь, для чего ищете площадки..."}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Город</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CITIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCity(city === c.value ? "" : c.value)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          city === c.value
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: CTA based on role */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                {user.role === "host" ? (
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user.role === "host" ? t("onboarding.step3.hostTitle") : t("onboarding.step3.renterTitle")}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {user.role === "host" ? t("onboarding.step3.hostSubtitle") : t("onboarding.step3.renterSubtitle")}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {t("onboarding.back")}
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t("onboarding.skip")}
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("onboarding.next")}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving
                  ? t("profile.saving")
                  : user.role === "host"
                    ? t("onboarding.step3.hostCta")
                    : t("onboarding.step3.renterCta")}
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="text-center mt-4 text-xs text-gray-400">
          {t("onboarding.stepOf", { n: String(step) })}
        </div>
      </div>
    </div>
  );
}
