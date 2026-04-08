import {
  SEASONAL_EVENT,
  SESSION_DAYS,
  SESSION_END_HOUR,
  SESSION_START_HOUR,
} from "./config";

export const todayStr = () => new Date().toISOString().split("T")[0];

export const isEventActive = () => {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];
  const hour = now.getUTCHours();

  if (!SEASONAL_EVENT.active) {
    return false;
  }

  const { start, startHour, end, endHour } = SEASONAL_EVENT;

  return (
    (dateString === start && hour >= startHour) ||
    (dateString > start && dateString < end) ||
    (dateString === end && hour < endHour)
  );
};

export const isFoolsDay = () => {
  const now = new Date();
  return now.getUTCMonth() === 3 && now.getUTCDate() === 1;
};

export const scrambleName = (name) => {
  if (!name) {
    return name;
  }

  const chars = [...name];
  if (chars.length <= 2) {
    return chars.reverse().join("");
  }

  const midpoint = Math.floor(chars.length / 2);
  return [...chars.slice(midpoint), ...chars.slice(0, midpoint)].join("");
};

export const getNextSession = () => {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(SESSION_START_HOUR, 0, 0, 0);

  for (let offset = 0; offset < 9; offset += 1) {
    if (SESSION_DAYS.includes(next.getUTCDay()) && next > now) {
      return next;
    }

    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(SESSION_START_HOUR, 0, 0, 0);
  }

  return next;
};

export const isLiveNow = () => {
  const now = new Date();
  return (
    SESSION_DAYS.includes(now.getUTCDay()) &&
    now.getUTCHours() >= SESSION_START_HOUR &&
    now.getUTCHours() < SESSION_END_HOUR
  );
};
