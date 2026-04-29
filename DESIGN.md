# LOKACIA.KZ — Design System v2

Маркетплейс аренды локаций и спортивных площадок в Казахстане. UI на русском языке.

## Концепт: "Найди свою сцену"

Кинематографичный контраст + Hand-drawn тепло + Apple-like движение.
Тёмный hero (как кинотеатр перед началом фильма) → светлый контент (как свет на площадке).

---

## Brand

- **Название:** LOKACIA.KZ
- **Позиционирование:** Казахстанский Peerspace/Giggster — кинематографичный, тёплый, надёжный
- **Тон:** Доверие, жизнь, ясность, дружелюбный, креативный, тёплый, надёжный
- **Целевая аудитория:** Киношники, контент-мейкеры, ивент-агентства, спортивные команды

---

## Типографика

### Основной шрифт: **Space Grotesk** (Google Fonts)
Геометрический гротеск с характером. Субсеты: latin, latin-ext.
CSS variable: `--font-heading`

### Рукописный акцент: **Caveat** (Google Fonts)
Для аннотаций, пометок, стрелок — "hand-drawn" ощущение.
CSS variable: `--font-handwritten`
Utility class: `.font-handwritten`

| Элемент | Шрифт | Размер | Вес | Tailwind |
|---------|-------|--------|-----|----------|
| Hero заголовок | Space Grotesk | 56-72px | 700 | `text-5xl sm:text-6xl lg:text-7xl font-bold` |
| Секции h2 | Space Grotesk | 30-48px | 700 | `text-3xl sm:text-4xl font-bold` |
| h3 | Space Grotesk | 20-28px | 600-700 | `text-xl font-bold` |
| Body | Space Grotesk | 16-18px | 400 | `text-base` |
| Рукописные пометки | Caveat | 20-28px | 700 | `font-handwritten text-xl` |
| Навигация | Space Grotesk | 14-15px | 500 | `text-sm font-medium` |

---

## Цвета

### Brand (функциональные)

| Token | Hex | CSS var | Tailwind | Использование |
|-------|-----|---------|----------|---------------|
| `primary` | `#7c3aed` | `--primary` | `text-primary`, `bg-primary` | CTA, ссылки, активные элементы |
| `primary-light` | `#a78bfa` | `--primary-light` | `text-primary-light` | Hover, secondary |
| `primary-dark` | `#5b21b6` | `--primary-dark` | `text-primary-dark` | Pressed state |
| `accent` | `#f59e0b` | `--accent` | `text-accent`, `bg-accent` | Звёзды, бейджи, highlight, золотой текст |

### Тёмная палитра (Hero, секции, footer)

| Token | Hex | CSS var | Tailwind | Использование |
|-------|-----|---------|----------|---------------|
| `dark` | `#0c0a14` | `--dark` | `bg-dark` | Hero фон, тёмные секции, footer |
| `dark-surface` | `#1a1625` | `--dark-surface` | `bg-dark-surface` | Карточки на тёмном фоне |
| `dark-border` | `#2d2640` | `--dark-border` | `border-dark-border` | Границы на тёмном |
| `dark-text` | `#e2dff0` | `--dark-text` | `text-dark-text` | Основной текст на тёмном |
| `dark-muted` | `#9590a8` | `--dark-muted` | `text-dark-muted` | Вторичный текст на тёмном |

### Тёплые декоративные

| Token | Hex | CSS var | Tailwind | Использование |
|-------|-----|---------|----------|---------------|
| `warm` | `#fef3c7` | `--warm` | `bg-warm` | Тёплый фон секций (benefits) |
| `cream` | `#faf7f2` | `--cream` | `bg-cream` | Основной светлый фон страниц (вместо gray-50) |
| `rose` | `#fda4af` | `--rose` | `text-rose` | Декоративные акценты, иллюстрации |
| `teal` | `#5eead4` | `--teal` | `text-teal` | Вторичный декоративный цвет |
| `surface` | `#faf5ff` | `--surface` | `bg-surface` | Фиолетовый тёплый фон |

### Semantic

| Token | Hex | Tailwind | Использование |
|-------|-----|----------|---------------|
| `success` | `#16a34a` | `text-green-600` | Подтверждения, верификация |
| `error` | `#dc2626` | `text-red-600` | Ошибки, удаление |
| `warning` | `#d97706` | `text-amber-600` | Предупреждения |
| `info` | `#2563eb` | `text-blue-600` | Информация |

---

## Анимации

### Библиотеки
- **GSAP** v3.15 + **ScrollTrigger** — scroll-triggered анимации, sticky sections
- **Lenis** v1.3 — smooth scroll

### CSS Keyframes (globals.css)

| Анимация | Длительность | Описание | Utility class |
|----------|-------------|----------|---------------|
| `float` | 3s infinite | Плавание вверх-вниз | `.animate-float` |
| `float` (slow) | 5s infinite | Медленное плавание | `.animate-float-slow` |
| `wiggle` | 0.4s | Покачивание ±5° | `.animate-wiggle` |
| `fadeInUp` | 0.6s | Появление снизу | `.animate-fade-in-up` |
| `fadeInScale` | 0.5s | Появление с масштабом | `.animate-fade-in-scale` |
| `bounceSoft` | 2s infinite | Мягкий bounce | `.animate-bounce-soft` |
| `sparkle` | 2s infinite | Мерцание | `.animate-sparkle` |
| `draw` | 1.5s | SVG stroke drawing | `.illustration-draw` |

### Stagger delays
`.stagger-1` через `.stagger-6` — задержки 0-500ms с шагом 100ms

### Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Иллюстрации

### Стиль: "Режиссёрские заметки"
Неидеальные линии, тёплые цвета, как набросок на полях сценария. НЕ детские — артистичные.

### Компоненты: `src/components/illustrations/`

| Компонент | Файл | Использование |
|-----------|------|---------------|
| `HeroDecor` | `hero-decor.tsx` | Плавающие дудлы в Hero (камера, звезда, пин, спарклы) |
| `IllustrationCamera` | `camera.tsx` | Категория: Фотостудии |
| `IllustrationParty` | `party.tsx` | Категория: Ивент-площадки |
| `IllustrationHouse` | `house.tsx` | Категория: Жильё |
| `IllustrationFilm` | `film.tsx` | Категория: Sound Stages |
| `IllustrationYurt` | `yurt.tsx` | Категория: Этно-пространства |
| `IllustrationCutlery` | `cutlery.tsx` | Категория: Рестораны |
| `IllustrationDesk` | `desk.tsx` | Категория: Переговорные |
| `IllustrationMountain` | `mountain.tsx` | Категория: Горные шале |
| `IllustrationEmptySearch` | `empty-search.tsx` | EmptyState: поиск |
| `IllustrationEmptyBookings` | `empty-bookings.tsx` | EmptyState: бронирования |
| `IllustrationEmptyFavorites` | `empty-favorites.tsx` | EmptyState: избранное |
| `IllustrationEmptyInbox` | `empty-inbox.tsx` | EmptyState: почта |
| `IllustrationErrorPin` | `error-pin.tsx` | 404/ошибки |
| `WaveDivider` | `wave-divider.tsx` | Волнистый разделитель секций |

Все иллюстрации используют CSS-переменные (`var(--primary)`, `var(--accent)`, `var(--rose)`, `var(--teal)`).

---

## Компоненты

### AnimatedSection
`src/components/animated-section.tsx` — client component, обёртка с `useInView` для scroll-анимаций.
```tsx
<AnimatedSection animation="fade-in-up" delay="100ms">
  <div>...</div>
</AnimatedSection>
```

### CountUp
`src/components/count-up.tsx` — анимация числа от 0 до target при входе в viewport.

### StickySteps
`src/components/sticky-steps.tsx` — секция "Как это работает" с большими иллюстрациями.

### useInView
`src/hooks/use-in-view.ts` — IntersectionObserver хук, `{ ref, isInView }`.

### Button
`src/components/ui/button.tsx`
- `active:scale-[0.97]` — micro-interaction при нажатии
- `transition-all` вместо `transition-colors`

### ListingCard
`src/components/listing-card.tsx`
- `hover:-translate-y-1` — поднятие при hover

### Navbar
`src/components/navbar.tsx`
- Прозрачный на hero, при скролле >50px → белый blur фон
- Логотип: `hover:rotate-6 transition-transform`

### Footer
`src/components/footer.tsx`
- Фон: `bg-dark` (#0c0a14)
- Текст: `text-dark-muted`, ссылки `hover:text-white`

---

## Структура главной страницы

```
NAVBAR (прозрачный → blur)
HERO — bg-dark, фото с overlay, "Найди свою сцену", дудлы, CountUp stats
WAVE DIVIDER (dark → cream)
КАТЕГОРИИ — bg-cream, карточки с фото + hand-drawn иконки, staggered reveal
ПОПУЛЯРНЫЕ ЛОКАЦИИ — bg-white, ListingCard с hover lift
КАК ЭТО РАБОТАЕТ — bg-white, StickySteps (текст + большая иллюстрация), Caveat пометки
BENEFITS — bg-warm/50, 2 колонки, AnimatedSection
TESTIMONIALS — bg-cream, карточки с hover lift
FAQ — bg-white, аккордеон
CTA — bg-dark, градиентный акцент, Caveat пометка, форма в тёмной карточке
FOOTER — bg-dark
```

---

## Паттерны страниц

### Публичные с hero
`for-hosts`, `about`, `protection` — тёмный hero + WaveDivider + cream/white контент

### Формы (login, register, reset-password)
Фон: `bg-cream`, белая карточка с border

### Каталог, список, детали
Фон: `bg-cream`, карточки белые

### Dashboard, admin, inbox
Фон: `bg-gray-50` (НЕ менять — внутренние страницы)

---

## Spacing

Базовый юнит: **4px**. Кратные значения.

| Token | Value | Tailwind | Использование |
|-------|-------|----------|---------------|
| `xs` | 4px | `1` | Зазоры иконка-текст |
| `sm` | 8px | `2` | Паддинги бейджей |
| `md` | 16px | `4` | Паддинги инпутов |
| `lg` | 24px | `6` | Паддинги карточек |
| `xl` | 32px | `8` | Между секциями |
| `2xl` | 48px | `12` | Hero, page top |

---

## Border Radius

| Token | Value | Tailwind | Использование |
|-------|-------|----------|---------------|
| `sm` | 8px | `rounded-lg` | Инпуты, бейджи |
| `md` | 12px | `rounded-xl` | Кнопки, toast |
| `lg` | 16px | `rounded-2xl` | Карточки, модалки |
| `full` | 9999 | `rounded-full` | Аватары, pill-кнопки, бейджи |

---

## Iconography

**Библиотека:** [Lucide React](https://lucide.dev) (`lucide-react`), strokeWidth 1.5–2.
Для декоративных иллюстраций — кастомные SVG из `src/components/illustrations/`.

---

## Файловая структура

```
src/
├── app/
│   ├── globals.css           # CSS variables, @theme, анимации
│   ├── layout.tsx            # Шрифты (Space Grotesk + Caveat)
│   ├── page.tsx              # Главная
│   └── home-sections.tsx     # Client-компоненты героя
├── components/
│   ├── illustrations/        # 15 SVG-иллюстраций
│   │   ├── index.ts          # Barrel export
│   │   ├── hero-decor.tsx
│   │   ├── camera.tsx
│   │   ├── ...
│   │   └── wave-divider.tsx
│   ├── ui/                   # Переиспользуемые UI-компоненты
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx
│   │   └── error-boundary.tsx
│   ├── animated-section.tsx
│   ├── count-up.tsx
│   ├── sticky-steps.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── listing-card.tsx
│   ├── hero-search.tsx
│   └── ...
├── hooks/
│   └── use-in-view.ts       # IntersectionObserver hook
├── lib/
│   └── gsap.tsx              # GSAP + ScrollTrigger utilities
```

---

## Anti-patterns (не делать)

- Не использовать `bg-gray-50` для публичных страниц — использовать `bg-cream` или `bg-warm`
- Не добавлять градиенты на кнопки — кнопки flat
- Не использовать Geist Sans — шрифт теперь Space Grotesk
- Не создавать hero секции с фиолетовым gradient — использовать тёмный `bg-dark`
- Map-файлы (map.tsx, map-wrapper.tsx, listing-map.tsx) — НЕ трогать без прямой команды
- Dashboard/admin/inbox — НЕ менять фоны на cream (оставить gray-50)
