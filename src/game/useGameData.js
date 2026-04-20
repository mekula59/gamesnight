import { useEffect, useState } from "react";
import { loadGameData, persistGameData } from "./storage";

const CEREMONY_SNOOZE_KEY = "gn-s2-ceremony-snoozed";

const readCeremonySnoozed = () =>
  typeof window !== "undefined" &&
  window.sessionStorage?.getItem(CEREMONY_SNOOZE_KEY) === "1";

export const useGameData = ({ store, view }) => {
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyPending, setCeremonyPending] = useState(false);
  const [ceremonySnoozed, setCeremonySnoozed] = useState(false);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const data = await loadGameData(store);
      if (!active) {
        return;
      }

      setPlayers(data.players);
      setSessions(data.sessions);
      setCeremonyPending(data.showCeremony);
      setCeremonySnoozed(readCeremonySnoozed());
      setLoaded(true);
    };

    boot();
    return () => {
      active = false;
    };
  }, [store]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key !== "Escape" || !showCeremony) {
        return;
      }

      setShowCeremony(false);
      setCeremonySnoozed(true);
      window.sessionStorage?.setItem(CEREMONY_SNOOZE_KEY, "1");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCeremony]);

  useEffect(() => {
    if (!loaded || !ceremonyPending || showCeremony || ceremonySnoozed) {
      return undefined;
    }

    if (view !== "home") {
      return undefined;
    }

    if (typeof window !== "undefined" && window.scrollY > 120) {
      return undefined;
    }

    const timeoutId = setTimeout(() => setShowCeremony(true), 900);
    return () => clearTimeout(timeoutId);
  }, [loaded, ceremonyPending, showCeremony, ceremonySnoozed, view]);

  const persist = (nextPlayers, nextSessions) =>
    persistGameData(store, nextPlayers, nextSessions);

  const markCeremonySeen = async () => {
    setShowCeremony(false);
    setCeremonyPending(false);
    setCeremonySnoozed(false);

    if (typeof window !== "undefined") {
      window.sessionStorage?.removeItem(CEREMONY_SNOOZE_KEY);
    }

    try {
      await store.set("gn-s2-ceremony-seen", "1");
    } catch {
      return null;
    }

    return true;
  };

  const snoozeCeremony = () => {
    setShowCeremony(false);
    setCeremonySnoozed(true);

    if (typeof window !== "undefined") {
      window.sessionStorage?.setItem(CEREMONY_SNOOZE_KEY, "1");
    }
  };

  const openCeremony = () => {
    setCeremonySnoozed(false);

    if (typeof window !== "undefined") {
      window.sessionStorage?.removeItem(CEREMONY_SNOOZE_KEY);
    }

    setShowCeremony(true);
  };

  return {
    players,
    setPlayers,
    sessions,
    setSessions,
    loaded,
    persist,
    showCeremony,
    ceremonyPending,
    markCeremonySeen,
    snoozeCeremony,
    openCeremony,
  };
};
