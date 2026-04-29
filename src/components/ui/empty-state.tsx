import type { ReactNode } from "react";
import {
  IllustrationEmptySearch,
  IllustrationEmptyBookings,
  IllustrationEmptyFavorites,
  IllustrationEmptyInbox,
} from "@/components/illustrations";
import { LayoutGrid } from "lucide-react";

function IllustrationWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center animate-float">
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-primary/[0.06]" />
      <div className="absolute inset-3 rounded-full bg-primary/[0.04]" />
      {children}
    </div>
  );
}

const illustrations: Record<string, ReactNode> = {
  search: (
    <IllustrationEmptySearch className="w-[120px] h-[120px] animate-float" />
  ),
  bookings: (
    <IllustrationEmptyBookings className="w-[120px] h-[120px] animate-float" />
  ),
  favorites: (
    <IllustrationEmptyFavorites className="w-[120px] h-[120px] animate-float" />
  ),
  inbox: (
    <IllustrationEmptyInbox className="w-[120px] h-[120px] animate-float" />
  ),
  listings: (
    <IllustrationWrapper>
      <LayoutGrid className="w-12 h-12 text-primary/30" strokeWidth={1.5} />
    </IllustrationWrapper>
  ),
};

interface EmptyStateProps {
  icon: keyof typeof illustrations;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const ActionTag = action?.href ? "a" : "button";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center page-transition">
      <div className="mb-6">{illustrations[icon]}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <ActionTag
          href={action.href}
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          {action.label}
        </ActionTag>
      )}
    </div>
  );
}
