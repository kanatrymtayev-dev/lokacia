"use client";

import { useEffect, useState } from "react";
import { getMyVerification, uploadVerificationFile, submitHostVerification } from "@/lib/api";
import type { HostVerification } from "@/lib/types";

export default function VerificationTab({ userId }: { userId: string }) {
  const [v, setV] = useState<HostVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setV(await getMyVerification(userId));
    setLoading(false);
  }
  useEffect(() => { load(); }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idFile || !selfieFile) {
      setError("Загрузите оба файла: документ и селфи");
      return;
    }
    setSubmitting(true);
    setError("");
    const [idUrl, selfieUrl] = await Promise.all([
      uploadVerificationFile(userId, "id", idFile),
      uploadVerificationFile(userId, "selfie", selfieFile),
    ]);
    if (!idUrl || !selfieUrl) {
      setError("Не удалось загрузить файлы. Возможно, не создан bucket 'verifications' в Supabase.");
      setSubmitting(false);
      return;
    }
    const { error: subErr } = await submitHostVerification(userId, idUrl, selfieUrl);
    if (subErr) {
      setError("Не удалось отправить заявку. Возможно, миграция БД не применена.");
      setSubmitting(false);
      return;
    }
    setIdFile(null);
    setSelfieFile(null);
    setSubmitting(false);
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  if (v?.status === "verified") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
          </svg>
          <div>
            <div className="font-bold text-green-800">Профиль верифицирован</div>
            <div className="mt-1 text-sm text-green-700">Бейдж «Verified» отображается на ваших локациях. Это повышает доверие арендаторов.</div>
          </div>
        </div>
      </div>
    );
  }

  if (v?.status === "pending") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="font-bold text-amber-900">Документы на проверке</div>
        <div className="mt-1 text-sm text-amber-800">Ответ обычно за 1–2 рабочих дня. Мы пришлём письмо.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {v?.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="font-semibold text-red-800">Заявка отклонена</div>
          {v.reviewerNote && <div className="mt-1 text-sm text-red-700">{v.reviewerNote}</div>}
          <div className="mt-2 text-sm text-red-700">Загрузите документы заново и отправьте на повторную проверку.</div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-lg">Подтвердите личность</h3>
        <p className="mt-1 text-sm text-gray-500">
          Бейдж «Verified» рядом с локациями повышает доверие — арендаторы охотнее бронируют.
          Документы видим только мы и не передаём третьим лицам.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Удостоверение личности (фото)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              required
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Селфи с удостоверением в руках</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !idFile || !selfieFile}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Отправка..." : "Отправить на проверку"}
          </button>
        </form>
      </div>
    </div>
  );
}
