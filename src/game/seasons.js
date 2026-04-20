import { SEASONS } from "./config";

export const APRIL_FOOLS_DATE = "2026-04-01";
export const GOOD_FRIDAY_DATE = "2026-04-03";
export const EASTER_SATURDAY_DATE = "2026-04-04";

export const SEASON_TWO_ID = "s2";
export const SEASON_TWO_LAUNCH_DATE = APRIL_FOOLS_DATE;
export const SEASON_TWO_LAUNCH_AT = "2026-04-01T17:00:00Z";
export const CEREMONY_START_DATE = SEASON_TWO_LAUNCH_DATE;

export const SPECIAL_DATE_MARKERS = {
  [APRIL_FOOLS_DATE]: { icon: "🃏", label: "April Fools" },
  [GOOD_FRIDAY_DATE]: { icon: "💪", label: "Good Friday" },
  [EASTER_SATURDAY_DATE]: { icon: "🥚", label: "Easter" },
};

export const getSeasonById = (seasonId) =>
  SEASONS.find((season) => season.id === seasonId) ?? null;

export const getSeasonForDate = (date) => {
  if (!date) {
    return null;
  }

  return (
    SEASONS.find((season) => date >= season.start && date <= season.end) ?? null
  );
};

export const filterSessionsBySeason = (sessions, seasonId = "all") => {
  if (seasonId === "all") {
    return sessions;
  }

  const season = getSeasonById(seasonId);
  if (!season) {
    return sessions;
  }

  return sessions.filter(
    (session) => session.date >= season.start && session.date <= season.end,
  );
};
