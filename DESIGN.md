# LOKACIA.KZ — Design System

Маркетплейс аренды локаций в Казахстане. UI на русском языке.

## Brand

- **Название:** LOKACIA.KZ
- **Позиционирование:** Казахстанский Giggster — профессиональная, доверительная, доступная платформа
- **Тон:** Чистый, минималистичный, дружелюбный. Без кричащих градиентов. Белый фон, фиолетовый акцент
- **Шрифт:** Geist Sans (Google Fonts, subsets: latin + cyrillic)

---

## Colors

### Brand

| Token            | Hex       | Tailwind          | Использование                  |
|------------------|-----------|-------------------|--------------------------------|
| `primary`        | `#6d28d9` | `text-primary`    | CTA, ссылки, активные элементы |
| `primary-light`  | `#8b5cf6` | `text-primary-light` | Hover, фоны с opacity       |
| `primary-dark`   | `#5b21b6` | `text-primary-dark`  | Pressed state, тёмные тексты |
| `accent`         | `#f59e0b` | `text-accent`     | Бейджи "Новое", звёзды, featured |

### Semantic

| Token     | Hex       | Tailwind класс      | Использование              |
|-----------|-----------|----------------------|----------------------------|
| `success` | `#16a34a` | `text-green-600`     | Подтверждения, верификация  |
| `error`   | `#dc2626` | `text-red-600`       | Ошибки, удаление, danger    |
| `warning` | `#d97706` | `text-amber-600`     | Предупреждения, ожидание    |
| `info`    | `#2563eb` | `text-blue-600`      | Информация, подсказки       |

### Neutral

| Token        | Hex       | Tailwind          | Использование             |
|--------------|-----------|-------------------|---------------------------|
| `foreground` | `#0f172a` | `text-foreground`  | Основной текст            |
| `muted`      | `#6b7280` | `text-gray-500`    | Вторичный текст           |
| `subtle`     | `#9ca3af` | `text-gray-400`    | Плейсхолдеры, подписи     |
| `border`     | `#e5e7eb` | `border-gray-200`  | Границы карточек, инпутов |
| `surface`    | `#f9fafb` | `bg-gray-50`       | Фон страниц               |
| `background` | `#ffffff` | `bg-white`         | Карточки, модалки          |

### CSS Variables (globals.css)

```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --primary: #6d28d9;
  --primary-light: #8b5cf6;
  --primary-dark: #5b21b6;
  --accent: #f59e0b;
}
```

---

## Typography

Шрифт: **Geist Sans** (`--font-geist-sans`). Fallback: Arial, Helvetica, sans-serif.

| Token         | Size   | Weight   | Line-height | Tailwind                        | Использование          |
|---------------|--------|----------|-------------|---------------------------------|------------------------|
| `heading-1`   | 30px   | 700 bold | 1.2         | `text-3xl font-bold`            | Заголовки страниц      |
| `heading-2`   | 24px   | 700 bold | 1.25        | `text-2xl font-bold`            | Заголовки секций       |
| `heading-3`   | 20px   | 600 semi | 1.3         | `text-xl font-semibold`         | Подзаголовки           |
| `heading-4`   | 18px   | 600 semi | 1.35        | `text-lg font-semibold`         | Названия карточек      |
| `body`        | 16px   | 400      | 1.5         | `text-base`                     | Основной текст         |
| `body-medium` | 14px   | 500      | 1.5         | `text-sm font-medium`           | Labels, навигация      |
| `body-small`  | 12px   | 400      | 1.5         | `text-xs`                       | Подписи, метаданные    |
| `caption`     | 10px   | 500      | 1.4         | `text-[10px] font-medium`       | Бейджи, статусы        |

---

## Spacing

Базовый юнит: **4px**. Используй кратные значения.

| Token  | Value | Tailwind | Использование                     |
|--------|-------|----------|-----------------------------------|
| `xs`   | 4px   | `1`      | Зазоры между иконкой и текстом    |
| `sm`   | 8px   | `2`      | Паддинги бейджей, gap в строке    |
| `md`   | 16px  | `4`      | Паддинги инпутов, gap в форме     |
| `lg`   | 24px  | `6`      | Паддинги карточек, секций         |
| `xl`   | 32px  | `8`      | Отступы между секциями            |
| `2xl`  | 48px  | `12`     | Большие отступы (hero, page top)  |

### Consistency rules

- Внутри карточек: `p-6` (24px)
- Между карточками/секциями: `mb-6` (24px)
- Форма fields gap: `space-y-4` или `space-y-5`
- Страница: `py-10 px-4 sm:px-6`, max-width: `max-w-2xl` (формы) или `max-w-7xl` (каталог)

---

## Border Radius

| Token  | Value | Tailwind       | Использование                        |
|--------|-------|----------------|--------------------------------------|
| `sm`   | 8px   | `rounded-lg`   | Инпуты, бейджи, маленькие кнопки     |
| `md`   | 12px  | `rounded-xl`   | Кнопки, toast, dropdown              |
| `lg`   | 16px  | `rounded-2xl`  | Карточки, модалки, секции             |
| `full` | 9999  | `rounded-full` | Аватары, бейджи-pill, FAB            |

---

## Shadows

| Token  | Value                                    | Tailwind         | Использование              |
|--------|------------------------------------------|------------------|-----------------------------|
| `sm`   | `0 1px 2px rgba(0,0,0,0.05)`            | `shadow-sm`      | Кнопки, бейджи              |
| `md`   | `0 4px 6px -1px rgba(0,0,0,0.1)`        | `shadow-md`      | Dropdown, hover-карточки     |
| `lg`   | `0 10px 15px -3px rgba(0,0,0,0.1)`      | `shadow-lg`      | Модалки, floating elements   |
| `xl`   | `0 20px 25px -5px rgba(0,0,0,0.1)`      | `shadow-xl`      | Hero search bar              |
| `primary` | `0 10px 15px -3px rgba(109,40,217,0.1)` | `shadow-lg shadow-primary/10` | Highlighted cards |

---

## Components

### Button

4 варианта, 3 размера. Всегда `font-semibold`, `transition-colors`, `disabled:opacity-50`.

| Variant     | Classes                                                                                     |
|-------------|---------------------------------------------------------------------------------------------|
| `primary`   | `bg-primary text-white hover:bg-primary-dark`                                               |
| `secondary` | `bg-gray-100 text-gray-700 hover:bg-gray-200`                                               |
| `danger`    | `bg-red-600 text-white hover:bg-red-700`                                                    |
| `ghost`     | `bg-transparent text-gray-700 hover:bg-gray-100`                                            |
| `outline`   | `border-2 border-primary text-primary hover:bg-primary/5`                                    |

| Size    | Classes                            |
|---------|------------------------------------|
| `sm`    | `px-3 py-1.5 text-xs rounded-lg`  |
| `md`    | `px-5 py-2.5 text-sm rounded-xl`  |
| `lg`    | `px-6 py-3.5 text-sm rounded-xl`  |

**Full-width:** добавь `w-full`. **Loading:** заменить текст на `...` или спиннер + `disabled`.

```tsx
// Primary CTA
<button className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
  Зарегистрироваться
</button>

// Secondary
<button className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors">
  Отмена
</button>

// Danger outline
<button className="px-5 py-2.5 rounded-lg border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
  Деактивировать
</button>
```

### Input

Стандартный стиль для всех текстовых полей:

```
w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm
focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
```

- **Disabled:** `disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`
- **Error:** `border-red-300 focus:ring-red-200 focus:border-red-400`
- **Label:** `block text-sm font-medium text-gray-700 mb-1.5` (над инпутом)
- **Helper text:** `text-xs text-gray-400 mt-1.5` (под инпутом)
- **Error text:** `text-xs text-red-600 mt-1.5`

### Card

Базовая карточка-контейнер:

```
bg-white rounded-2xl border border-gray-200 p-6
```

- **Hover (listing card):** `hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300`
- **Highlighted:** `border-primary shadow-lg shadow-primary/10`
- **Danger card:** `border-red-200` (деактивация аккаунта)

### Modal

Оверлей + центрированный контейнер:

```tsx
// Overlay
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
  {/* Container */}
  <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
    {/* Title */}
    <h3 className="text-lg font-bold text-gray-900">Заголовок</h3>
    {/* Content */}
    ...
    {/* Actions — всегда внизу */}
    <div className="flex gap-3">
      <button className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Отмена
      </button>
      <button className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50">
        Подтвердить
      </button>
    </div>
  </div>
</div>
```

### Badge

Pill-shaped статусные бейджи:

| Variant      | Classes                                                  | Использование       |
|--------------|----------------------------------------------------------|---------------------|
| `verified`   | `bg-green-50 text-green-700 text-[10px] font-medium`    | Верифицирован       |
| `pending`    | `bg-amber-50 text-amber-700 text-[10px] font-medium`    | На модерации        |
| `featured`   | `bg-amber-400 text-amber-950 text-xs font-bold`         | Топ-листинг         |
| `new`        | `bg-accent text-gray-900 text-xs font-bold`              | Новое               |
| `host`       | `bg-purple-100 text-purple-700 text-[10px] font-medium` | Роль хост           |
| `renter`     | `bg-blue-100 text-blue-700 text-[10px] font-medium`     | Роль арендатор      |
| `danger`     | `bg-red-50 text-red-600 text-[10px] font-medium`        | Заблокирован        |
| `deactivated`| `bg-orange-50 text-orange-600 text-[10px] font-medium`  | Деактивирован       |

Общий паттерн: `px-2 py-0.5 rounded-full` (или `px-2.5 py-1 rounded-full` для крупных).

### Toast

Фиксированный в правом нижнем углу:

```tsx
<div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
  type === "success" ? "bg-green-600 text-white"
  : type === "error" ? "bg-red-600 text-white"
  : type === "warning" ? "bg-amber-500 text-white"
  : "bg-blue-600 text-white"
}`}>
  {message}
</div>
```

- Auto-dismiss: 4 секунды
- Позиция: `fixed bottom-6 right-6 z-50`

### Alert / Error Block

Инлайн-сообщение об ошибке в формах:

```
bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl
```

Success variant: `bg-green-50 text-green-700`

---

## Layout

### Page structure

```
<div className="flex flex-col min-h-screen">
  <Navbar />
  <main className="flex-1 bg-gray-50">
    <div className="max-w-{size} mx-auto px-4 sm:px-6 py-10">
      ...
    </div>
  </main>
  <Footer />
</div>
```

- Формы / профиль: `max-w-2xl`
- Каталог: `max-w-7xl`
- Одна колонка + sidebar (листинг): `max-w-6xl`, grid `lg:grid-cols-3`

### Navbar

- Высота: `h-16`
- Фон: `bg-white border-b border-gray-100`
- Лого: фиолетовый квадрат `rounded-lg bg-primary` + белый текст `LOKACIA`
- Desktop: ссылки + dropdown browse + user menu
- Mobile: бургер → slide-in panel

### Section card

Каждая логическая секция на странице (профиль, дашборд):

```
<div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-5">Заголовок секции</h2>
  ...
</div>
```

---

## Iconography

Inline SVG из Heroicons (outline, 24x24). Стандартные размеры:

| Context        | Class          |
|----------------|----------------|
| В тексте       | `w-4 h-4`     |
| В кнопке       | `w-5 h-5`     |
| Декоративная   | `w-7 h-7`     |
| Большая        | `w-14 h-14`   |

---

## States

| State      | Pattern                                           |
|------------|---------------------------------------------------|
| Hover      | `hover:bg-{color}`, `hover:shadow-md`             |
| Focus      | `focus:ring-2 focus:ring-primary/20 focus:border-primary` |
| Active     | `active:scale-[0.98]` (опционально)               |
| Disabled   | `disabled:opacity-50 disabled:cursor-not-allowed`  |
| Loading    | Текст заменяется на `...` или `animate-pulse`      |
| Empty      | Серый текст по центру, опционально SVG-иллюстрация |

---

## Transitions

| Element          | Duration | Easing  | Properties              |
|------------------|----------|---------|-------------------------|
| Buttons, links   | 150ms    | default | `transition-colors`     |
| Cards            | 300ms    | default | `transition-all`        |
| Images (hover)   | 500ms    | default | `transition-transform`  |
| Modals           | 200ms    | ease-out| opacity + scale (TODO)  |
| Toasts           | 300ms    | ease-out| slide-in (TODO)         |

---

## Responsive Breakpoints

Tailwind defaults. Ключевые адаптации:

| Breakpoint | Width  | Что меняется                          |
|------------|--------|---------------------------------------|
| `sm`       | 640px  | Hero search: стек → row               |
| `md`       | 768px  | Каталог: 1 col → 2 col               |
| `lg`       | 1024px | Каталог: 2 col → 3 col + sidebar map |
| `xl`       | 1280px | Max-width контейнеры                  |

---

## File Structure

```
src/
├── app/globals.css          # CSS variables, @theme
├── components/
│   ├── ui/                  # Переиспользуемые UI-компоненты (TODO)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   └── card.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── listing-card.tsx
│   ├── hero-search.tsx
│   └── ...
```

---

## Anti-patterns (не делать)

- Не использовать абсолютные пиксели для spacing — только Tailwind классы
- Не смешивать `rounded-xl` и `rounded-2xl` в одном контексте (карточки = `2xl`, инпуты = `lg`)
- Не дублировать inline стили кнопок — использовать паттерны из этого файла
- Не добавлять градиенты на основные элементы (бренд = flat, чистый)
- Не использовать `shadow-2xl` для карточек (только для hero search bar)
- Map-файлы (map.tsx, map-wrapper.tsx, listing-map.tsx) — НЕ трогать без прямой команды
