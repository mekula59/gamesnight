import { useEffect, useState } from "react";
import { normalizeGameData } from "./aliases";
import { loadGameData, persistGameData } from "./storage";

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
      setCeremonySnoozed(false);
      setLoaded(true);
    };

    boot();
    return () => {
      active = false;
    };
  }, [store]);

  useEffect(() => {
    return undefined;
  }, [showCeremony]);

  useEffect(() => {
    return undefined;
  }, [loaded, ceremonyPending, showCeremony, ceremonySnoozed, view]);

  const setNormalizedPlayers = (nextPlayers) => {
    setPlayers((currentPlayers) => {
      const resolvedPlayers =
        typeof nextPlayers === "function" ? nextPlayers(currentPlayers) : nextPlayers;
      return normalizeGameData(resolvedPlayers, sessions).players;
    });
  };

  const setNormalizedSessions = (nextSessions) => {
    setSessions((currentSessions) => {
      const resolvedSessions =
        typeof nextSessions === "function" ? nextSessions(currentSessions) : nextSessions;
      return normalizeGameData(players, resolvedSessions).sessions;
    });
  };

  const persist = (nextPlayers, nextSessions) =>
    persistGameData(store, nextPlayers, nextSessions);

  const markCeremonySeen = async () => {
    setShowCeremony(false);
    setCeremonyPending(false);
    setCeremonySnoozed(false);

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
  };

  const openCeremony = () => {
    setCeremonySnoozed(true);
    setShowCeremony(false);
  };

  return {
    players,
    setPlayers: setNormalizedPlayers,
    sessions,
    setSessions: setNormalizedSessions,
    loaded,
    persist,
    showCeremony,
    ceremonyPending,
    markCeremonySeen,
    snoozeCeremony,
    openCeremony,
  };
};
