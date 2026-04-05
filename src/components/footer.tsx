import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" fill="currentColor" />
                <path
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
            <span className="text-white font-bold">LOKACIA.KZ</span>
          </Link>
          <p className="text-sm">
            Маркетплейс аренды локаций для съёмок, мероприятий и встреч в Казахстане
          </p>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          &copy; {new Date().getFullYear()} LOKACIA.KZ. Все права защищены. Алматы, Казахстан.
        </div>
      </div>
    </footer>
  );
}
