"use client";

import { useT } from "@/lib/i18n";
import type { City, SpaceType, ActivityType } from "@/lib/types";

export function useLabels() {
  const { t } = useT();

  const cityLabels: Record<City, string> = {
    almaty: t("label.city.almaty"),
    astana: t("label.city.astana"),
    shymkent: t("label.city.shymkent"),
    karaganda: t("label.city.karaganda"),
  };

  const spaceTypeLabels: Record<SpaceType, string> = {
    photo_studio: t("label.space.photo_studio"),
    video_studio: t("label.space.video_studio"),
    sound_stage: t("label.space.sound_stage"),
    apartment: t("label.space.apartment"),
    house: t("label.space.house"),
    villa: t("label.space.villa"),
    restaurant: t("label.space.restaurant"),
    cafe: t("label.space.cafe"),
    bar: t("label.space.bar"),
    office: t("label.space.office"),
    coworking: t("label.space.coworking"),
    banquet_hall: t("label.space.banquet_hall"),
    loft: t("label.space.loft"),
    warehouse: t("label.space.warehouse"),
    yurt: t("label.space.yurt"),
    ethno: t("label.space.ethno"),
    chalet: t("label.space.chalet"),
    outdoor: t("label.space.outdoor"),
    pool: t("label.space.pool"),
    gym: t("label.space.gym"),
    other: t("label.space.other"),
  };

  const activityTypeLabels: Record<ActivityType, string> = {
    production: t("label.activity.production"),
    event: t("label.activity.event"),
    meeting: t("label.activity.meeting"),
    leisure: t("label.activity.leisure"),
  };

  return { cityLabels, spaceTypeLabels, activityTypeLabels };
}
