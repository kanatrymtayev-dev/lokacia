/**
 * Verified badge — shows a shield icon + "Verified" text.
 * Renders nothing if idVerified is false.
 */

export default function VerifiedBadge({ idVerified }: { idVerified?: boolean }) {
  if (!idVerified) return null;

  return (
    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.661 2.237a1 1 0 0 1 .678 0l6 2.18a1 1 0 0 1 .661.94v4.157c0 3.579-2.297 6.74-5.72 7.986a1 1 0 0 1-.56 0C7.297 16.254 5 13.093 5 9.514V5.357a1 1 0 0 1 .661-.94l4-1.18Zm.839 7.263a.75.75 0 1 0-1-1.118L7.88 9.86l-.38-.38a.75.75 0 0 0-1.06 1.06l.91.91a.75.75 0 0 0 1.08.03l2.07-1.98Z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  );
}

/**
 * Trust section — shows verification status items in a list.
 */
export function TrustSection({
  phoneVerified,
  idVerified,
  reviewCount,
  memberSince,
}: {
  phoneVerified?: boolean;
  idVerified?: boolean;
  reviewCount?: number;
  memberSince?: string; // ISO date
}) {
  const sinceDate = memberSince ? new Date(memberSince) : null;
  const sinceLabel = sinceDate
    ? sinceDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    : null;

  const items = [
    { label: "Телефон подтверждён", done: !!phoneVerified },
    { label: "Личность проверена", done: !!idVerified },
    ...(reviewCount !== undefined ? [{ label: `${reviewCount} ${reviewCount === 1 ? "отзыв" : reviewCount < 5 ? "отзыва" : "отзывов"}`, done: reviewCount > 0 }] : []),
    ...(sinceLabel ? [{ label: `На платформе с ${sinceLabel}`, done: true }] : []),
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Доверие и безопасность</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            {item.done ? (
              <svg className="w-4.5 h-4.5 text-green-600 flex-shrink-0" style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1-5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm1-7a1 1 0 0 0-.894.553l-.448.894a.75.75 0 1 1-1.342-.67l.449-.894A2.5 2.5 0 0 1 12.5 7.5 1.5 1.5 0 0 1 11 9h-.25a.75.75 0 0 1 0-1.5H11a0 0 0 0 0 0 0 1 1 0 0 0-1-1Z" clipRule="evenodd"/>
              </svg>
            )}
            <span className={item.done ? "text-gray-800" : "text-gray-400"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
