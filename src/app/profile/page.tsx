"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { getProfile, updateProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { deactivateAccount } from "@/lib/deactivate-account";
import VerificationTab from "@/app/dashboard/verification-tab";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [entityType, setEntityType] = useState<"individual" | "company">("individual");
  const [iin, setIin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyBin, setCompanyBin] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Payout details
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [payoutHolderName, setPayoutHolderName] = useState("");

  // Phone OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [originalPhone, setOriginalPhone] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateConfirmed, setDeactivateConfirmed] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/profile");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      if (!p) return;
      setName((p.name as string) ?? "");
      setPhone((p.phone as string) ?? "");
      setEmail((p.email as string) ?? user.email ?? "");
      setAvatarUrl((p.avatar_url as string) ?? null);
      setBio((p.bio as string) ?? "");
      setInstagram((p.instagram as string) ?? "");
      setTelegram((p.telegram as string) ?? "");
      setIin((p.iin as string) ?? "");
      setCompanyName((p.company_name as string) ?? "");
      setCompanyBin((p.company_bin as string) ?? "");
      setCompanyAddress((p.company_address as string) ?? "");
      setPayoutMethod((p.payout_method as string) ?? "");
      setPayoutDetails((p.payout_details as string) ?? "");
      setPayoutHolderName((p.payout_holder_name as string) ?? "");
      // Determine entity type from existing data
      if ((p.company_name as string)?.trim() || (p.company_bin as string)?.trim()) {
        setEntityType("company");
      }
      setPhoneVerified((p.phone_verified as boolean) ?? false);
      setOriginalPhone((p.phone as string) ?? "");
      setLoaded(true);
    });
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
        setOriginalPhone(phone);
        setOtpSent(false);
        setOtpCode("");
        showToast("success", "Телефон подтверждён");
      }
    } catch {
      setOtpError("Ошибка сети");
    }
    setOtpLoading(false);
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Файл слишком большой (макс. 2 МБ)");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      showToast("error", "Ошибка загрузки: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = urlData.publicUrl + "?t=" + Date.now();
    setAvatarUrl(newUrl);

    await updateProfile(user.id, { avatar_url: newUrl });
    setUploading(false);
    showToast("success", "Аватар обновлён");
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const { error } = await updateProfile(user.id, {
      name: name.trim(),
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      instagram: instagram.trim() || null,
      telegram: telegram.trim() || null,
      payout_method: payoutMethod.trim() || null,
      payout_details: payoutDetails.trim() || null,
      payout_holder_name: payoutHolderName.trim() || null,
      iin: entityType === "individual" ? (iin.trim() || null) : null,
      company_name: entityType === "company" ? (companyName.trim() || null) : null,
      company_bin: entityType === "company" ? (companyBin.trim() || null) : null,
      company_address: entityType === "company" ? (companyAddress.trim() || null) : null,
    });

    setSaving(false);
    if (error) {
      showToast("error", "Ошибка сохранения: " + error.message);
    } else {
      showToast("success", "Профиль сохранён");
    }
  }

  if (authLoading || !user || !loaded) {
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">{t("profile.title")}</h1>

          {/* Avatar + personal info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{t("profile.personal")}</h2>

            {/* Avatar */}
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
                  {uploading ? t("common.uploading") : t("profile.changePhoto")}
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

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя</label>
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
                      // If phone changed from verified one, reset verification
                      if (e.target.value.replace(/[\s\-()]/g, "") !== originalPhone.replace(/[\s\-()]/g, "")) {
                        setPhoneVerified(false);
                        setOtpSent(false);
                        setOtpCode("");
                        setOtpError("");
                      }
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
                      {otpLoading ? "..." : otpCooldown > 0 ? `${otpCooldown}с` : otpSent ? "Ещё раз" : "Подтвердить"}
                    </button>
                  )}
                </div>

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
                        {otpLoading ? "..." : "Ввести"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Поднимите трубку — робот продиктует 4 цифры</p>
                  </div>
                )}

                {otpError && <p className="text-xs text-red-600 mt-1.5">{otpError}</p>}

                {!phoneVerified && !otpSent && phone.trim() && (
                  <p className="text-xs text-amber-600 mt-1.5">Телефон не подтверждён. Подтвердите для бронирования.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email нельзя изменить</p>
              </div>
            </div>
          </div>

          {/* Verification */}
          {user && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Верификация</h2>
              <VerificationTab userId={user.id} userRole={user.role} />
            </div>
          )}

          {/* Bio & Socials */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{t("profile.bioSocials")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">О себе</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Расскажите о себе..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telegram</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/username"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Payout details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Реквизиты для выплат</h2>
            <p className="text-sm text-gray-500 mb-5">
              Укажите куда перечислять доход от бронирований. Выплаты производятся раз в неделю.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Банк / метод</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Не указан</option>
                  <option value="kaspi">Kaspi Gold</option>
                  <option value="halyk">Halyk Bank</option>
                  <option value="freedom">Freedom Bank</option>
                  <option value="forte">Forte Bank</option>
                  <option value="jusan">Jusan Bank</option>
                  <option value="bank_transfer">Другой банк (IBAN)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {payoutMethod === "bank_transfer" ? "IBAN (KZ...)" : "Номер карты или телефон"}
                </label>
                <input
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={payoutMethod === "bank_transfer" ? "KZ00 0000 0000 0000 0000" : "+7 777 123 45 67"}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ФИО владельца карты/счёта</label>
                <input
                  type="text"
                  value={payoutHolderName}
                  onChange={(e) => setPayoutHolderName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("profile.billing")}</h2>
            <p className="text-sm text-gray-500 mb-5">
              {t("profile.billingNote")}
            </p>

            {/* Entity type toggle */}
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setEntityType("individual")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  entityType === "individual"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("profile.individual")}
              </button>
              <button
                type="button"
                onClick={() => setEntityType("company")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  entityType === "company"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("profile.company")}
              </button>
            </div>

            {entityType === "individual" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ИИН</label>
                <input
                  type="text"
                  value={iin}
                  onChange={(e) => setIin(e.target.value)}
                  placeholder="000000000000"
                  maxLength={12}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1.5">12-значный индивидуальный идентификационный номер</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder='ТОО "Название"'
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">БИН</label>
                  <input
                    type="text"
                    value={companyBin}
                    onChange={(e) => setCompanyBin(e.target.value)}
                    placeholder="123456789012"
                    maxLength={12}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Юридический адрес
                  </label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="г. Алматы, ул. Абая 1, офис 100"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? t("profile.saving") : t("profile.save")}
          </button>

          {/* Deactivate account */}
          <div className="bg-white rounded-2xl border border-red-200 p-6 mt-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Удаление аккаунта</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              При деактивации ваш профиль и листинги будут скрыты. Активные бронирования будут отменены.
              Для полного удаления данных напишите на{" "}
              <a href="mailto:hello@lokacia.kz" className="text-primary hover:underline">hello@lokacia.kz</a>
            </p>
            <button
              type="button"
              onClick={() => setShowDeactivateModal(true)}
              className="px-5 py-2.5 rounded-lg border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Деактивировать аккаунт
            </button>
          </div>
        </div>
      </main>

      {/* Deactivate modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">Вы уверены?</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Укажите причину (необязательно)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows={3}
                placeholder="Почему вы хотите деактивировать аккаунт?"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deactivateConfirmed}
                onChange={(e) => setDeactivateConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-200"
              />
              <span className="text-sm text-gray-600">
                Я понимаю что мои листинги будут скрыты и активные бронирования отменены
              </span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateReason("");
                  setDeactivateConfirmed(false);
                }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!deactivateConfirmed || deactivating}
                onClick={async () => {
                  setDeactivating(true);
                  const result = await deactivateAccount(deactivateReason.trim());
                  setDeactivating(false);
                  if (result.ok) {
                    router.push("/?deactivated=1");
                  } else {
                    setShowDeactivateModal(false);
                    showToast("error", result.error || "Ошибка деактивации");
                  }
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deactivating ? "Деактивируем..." : "Деактивировать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <Footer />
    </div>
  );
}
