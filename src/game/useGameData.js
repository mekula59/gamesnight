import { useEffect, useState } from "react";
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
