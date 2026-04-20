"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/api";

interface EditBioProps {
  hostId: string;
  initialBio: string;
  initialInstagram: string;
  initialTelegram: string;
}

export default function EditHostBio({ hostId, initialBio, initialInstagram, initialTelegram }: EditBioProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [telegram, setTelegram] = useState(initialTelegram);
  const [saving, setSaving] = useState(false);

  if (!user || user.id !== hostId) return null;

  async function handleSave() {
    setSaving(true);
    await updateProfile(hostId, {
      bio: bio.trim() || null,
      instagram: instagram.trim() || null,
      telegram: telegram.trim() || null,
    });
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
        Редактировать профиль
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Расскажите о себе и ваших площадках..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/username"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="https://t.me/username"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        <button
          onClick={() => { setEditing(false); setBio(initialBio); setInstagram(initialInstagram); setTelegram(initialTelegram); }}
          className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
