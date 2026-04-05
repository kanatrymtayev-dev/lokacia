"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const spaceTypes = [
  "Фотостудия",
  "Видеостудия / Sound Stage",
  "Ивент-площадка / Банкетный зал",
  "Квартира / Дом",
  "Ресторан / Кафе",
  "Офис / Переговорная",
  "Лофт / Склад",
  "Юрта / Этно-пространство",
  "Другое",
];

const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Другой город"];

export default function HostForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await supabase.from("host_applications").insert({
      name: data.name as string,
      phone: data.phone as string,
      city: data.city as string,
      space_type: data.spaceType as string,
      area: data.area ? Number(data.area) : null,
      description: (data.description as string) || null,
    });

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-4 text-2xl font-bold">Заявка отправлена!</h3>
        <p className="mt-2 text-gray-600">
          Мы свяжемся с вами в течение 24 часов для обсуждения деталей и организации
          бесплатной фотосъёмки вашего помещения.
        </p>
        <div className="mt-6 p-4 bg-primary/5 rounded-xl">
          <p className="text-sm text-primary font-medium">
            Вы в числе первых 100 хостов — 0% комиссии на 6 месяцев гарантировано
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 space-y-6"
    >
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
          Ваше имя *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Канат"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          Телефон (WhatsApp) *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          placeholder="+7 777 123 4567"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
        />
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
          Город *
        </label>
        <select
          id="city"
          name="city"
          required
          defaultValue=""
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 bg-white"
        >
          <option value="" disabled>
            Выберите город
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Space type */}
      <div>
        <label htmlFor="spaceType" className="block text-sm font-medium text-gray-700 mb-1.5">
          Тип помещения *
        </label>
        <select
          id="spaceType"
          name="spaceType"
          required
          defaultValue=""
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 bg-white"
        >
          <option value="" disabled>
            Выберите тип
          </option>
          {spaceTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Area */}
      <div>
        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1.5">
          Площадь (м²)
        </label>
        <input
          type="number"
          id="area"
          name="area"
          placeholder="100"
          min={1}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
          Расскажите о помещении
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Что есть: оборудование, мебель, парковка, особенности..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-4 rounded-xl text-base font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Отправляем...
          </>
        ) : (
          <>
            Оставить заявку
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
      </p>
    </form>
  );
}
