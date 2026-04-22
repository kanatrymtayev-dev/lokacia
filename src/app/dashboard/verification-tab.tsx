"use client";

import { useEffect, useState } from "react";
import { getMyVerification, uploadVerificationFile, submitVerification } from "@/lib/api";
import { validateIIN, validateBIN } from "@/lib/validate-iin";
import type { HostVerification } from "@/lib/types";

type EntityType = "individual" | "company";

export default function VerificationTab({ userId, userRole }: { userId: string; userRole?: "host" | "renter" }) {
  const [v, setV] = useState<HostVerification | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [entityType, setEntityType] = useState<EntityType>("individual");
  const [iin, setIin] = useState("");
  const [companyBin, setCompanyBin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [companyDocFile, setCompanyDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setV(await getMyVerification(userId));
    setLoading(false);
  }
  useEffect(() => { load(); }, [userId]);

  // Validation
  const iinResult = iin ? validateIIN(iin) : null;
  const binResult = companyBin ? validateBIN(companyBin) : null;

  function canSubmit(): boolean {
    if (entityType === "individual") {
      return !!(idFile && selfieFile && iin && iinResult?.valid);
    }
    return !!(idFile && selfieFile && companyDocFile && companyBin && binResult?.valid && companyName.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (entityType === "individual" && (!iinResult?.valid)) {
      setError(iinResult?.error || "Введите корректный ИИН");
      return;
    }
    if (entityType === "company" && (!binResult?.valid)) {
      setError(binResult?.error || "Введите корректный БИН");
      return;
    }
    if (!idFile || !selfieFile) {
      setError("Загрузите удостоверение и селфи");
      return;
    }
    if (entityType === "company" && !companyDocFile) {
      setError("Загрузите свидетельство о регистрации");
      return;
    }

    setSubmitting(true);
    setError("");

    // Upload files
    const uploads = [
      uploadVerificationFile(userId, "id", idFile),
      uploadVerificationFile(userId, "selfie", selfieFile),
    ];
    if (entityType === "company" && companyDocFile) {
      uploads.push(uploadVerificationFile(userId, "company_doc", companyDocFile));
    }

    const results = await Promise.all(uploads);
    const idUrl = results[0];
    const selfieUrl = results[1];
    const companyDocUrl = results[2] ?? null;

    if (!idUrl || !selfieUrl) {
      setError("Не удалось загрузить файлы. Проверьте что bucket 'verifications' создан в Supabase.");
      setSubmitting(false);
      return;
    }
    if (entityType === "company" && !companyDocUrl) {
      setError("Не удалось загрузить свидетельство.");
      setSubmitting(false);
      return;
    }

    const { error: subErr } = await submitVerification(userId, {
      idDocUrl: idUrl,
      selfieUrl,
      entityType,
      iin: entityType === "individual" ? iin : undefined,
      companyBin: entityType === "company" ? companyBin : undefined,
      companyName: entityType === "company" ? companyName.trim() : undefined,
      companyDocUrl: entityType === "company" ? companyDocUrl : undefined,
      userRole: userRole ?? "host",
    });

    if (subErr) {
      setError("Не удалось отправить заявку. Попробуйте позже.");
      setSubmitting(false);
      return;
    }

    setIdFile(null);
    setSelfieFile(null);
    setCompanyDocFile(null);
    setSubmitting(false);
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  // Verified state
  if (v?.status === "verified") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
          </svg>
          <div>
            <div className="font-bold text-green-800">Профиль верифицирован</div>
            <div className="mt-1 text-sm text-green-700">
              {userRole === "renter"
                ? "Бейдж «Verified» повышает доверие хостов к вашим бронированиям."
                : "Бейдж «Verified» отображается на ваших локациях. Это повышает доверие арендаторов."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending state
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
          {userRole === "renter"
            ? "Верификация повышает доверие хостов и открывает доступ к бронированиям от 100 000 ₸."
            : "Бейдж «Verified» рядом с локациями повышает доверие — арендаторы охотнее бронируют."}
          {" "}Документы видим только мы и не передаём третьим лицам.
        </p>

        {/* Entity type toggle */}
        <div className="mt-5 mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEntityType("individual")}
              className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                entityType === "individual"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Физлицо
            </button>
            <button
              type="button"
              onClick={() => setEntityType("company")}
              className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                entityType === "company"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Юрлицо / ИП
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Individual: IIN */}
          {entityType === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИИН</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={iin}
                onChange={(e) => setIin(e.target.value.replace(/\D/g, ""))}
                placeholder="12 цифр"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono tracking-wider ${
                  iin && !iinResult?.valid ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-primary"
                }`}
              />
              {iin && iinResult && !iinResult.valid && (
                <p className="text-xs text-red-600 mt-1">{iinResult.error}</p>
              )}
              {iin && iinResult?.valid && (
                <p className="text-xs text-green-600 mt-1">ИИН корректен</p>
              )}
            </div>
          )}

          {/* Company: BIN + Name */}
          {entityType === "company" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">БИН</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={companyBin}
                  onChange={(e) => setCompanyBin(e.target.value.replace(/\D/g, ""))}
                  placeholder="12 цифр"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono tracking-wider ${
                    companyBin && !binResult?.valid ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-primary"
                  }`}
                />
                {companyBin && binResult && !binResult.valid && (
                  <p className="text-xs text-red-600 mt-1">{binResult.error}</p>
                )}
                {companyBin && binResult?.valid && (
                  <p className="text-xs text-green-600 mt-1">БИН корректен</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название организации</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ТОО «Название»"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Свидетельство о регистрации (фото/скан)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCompanyDocFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                />
              </div>
            </>
          )}

          {/* Common: ID doc + Selfie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entityType === "company" ? "Удостоверение директора (фото)" : "Удостоверение личности (фото)"}
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Селфи с удостоверением в руках</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !canSubmit()}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Отправка..." : "Отправить на проверку"}
          </button>
        </form>
      </div>
    </div>
  );
}
