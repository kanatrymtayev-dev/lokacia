"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
            <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" fill="currentColor" />
            <path
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              stroke="currentColor"
              strokeWidth={1.5}
            />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">
          LOKACIA<span className="text-primary">.KZ</span>
        </span>
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Нет подключения к интернету
      </h1>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        Проверьте подключение и попробуйте снова
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
      >
        Обновить
      </button>
    </div>
  );
}
