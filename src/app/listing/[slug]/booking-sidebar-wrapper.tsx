"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

const BookingSidebar = dynamic(() => import("./booking-sidebar"), { ssr: false });

export default function BookingSidebarWrapper({ listing }: { listing: Listing }) {
  return <BookingSidebar listing={listing} />;
}
