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

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
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
      // Determine entity type from existing data
      if ((p.company_name as string)?.trim() || (p.company_bin as string)?.trim()) {
        setEntityType("company");
      }
      setLoaded(true);
    });
  }, [user]);

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
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 777 123 45 67"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
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
        </div>
      </main>

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
