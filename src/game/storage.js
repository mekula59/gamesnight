import { STORAGE_VERSION } from "./config";
import { INITIAL_PLAYERS, INITIAL_SESSIONS } from "./seedData";
import { todayStr } from "./time";

export const createStorageAdapter = () => {
  const hasSharedStorage =
    typeof window !== "undefined" &&
    Boolean(window.storage) &&
    typeof window.storage.get === "function";

  return {
    hasSharedStorage,
    async get(key) {
      if (hasSharedStorage) {
        return window.storage.get(key).catch(() => null);
      }

      const value = window.localStorage?.getItem(key);
      return value ? { value } : null;
    },
    async set(key, value) {
      if (hasSharedStorage) {
        return window.storage.set(key, value).catch(() => null);
      }

      window.localStorage?.setItem(key, value);
      return { value };
    },
  };
};

const getDefaultState = () => ({
  players: INITIAL_PLAYERS,
  sessions: INITIAL_SESSIONS,
  pollVote: null,
  s2Prediction: null,
  showCeremony: false,
});

export const loadGameData = async (store) => {
  try {
    const versionResult = await store.get("gn-version");
    const currentVersion = versionResult?.value ?? null;

    if (currentVersion !== STORAGE_VERSION) {
      await store.set("gn-version", STORAGE_VERSION);
      await store.set("gn-players", JSON.stringify(INITIAL_PLAYERS));
      await store.set("gn-sessions", JSON.stringify(INITIAL_SESSIONS));
      return getDefaultState();
    }

    const playersResult = await store.get("gn-players");
    const sessionsResult = await store.get("gn-sessions");
    const storedPlayers = playersResult ? JSON.parse(playersResult.value) : INITIAL_PLAYERS;
    const storedSessions = sessionsResult ? JSON.parse(sessionsResult.value) : null;

    const pollKey = `gn-poll-${todayStr()}`;
    const pollResult = await store.get(pollKey);
    const predictionResult = await store.get("gn-s2-prediction");

    let showCeremony = false;
    if (todayStr() >= "2026-04-01") {
      const ceremonySeen = await store.get("gn-s2-ceremony-seen");
      showCeremony = !ceremonySeen?.value;
    }

    return {
      players: storedPlayers,
      sessions: storedSessions && storedSessions.length > 0 ? storedSessions : INITIAL_SESSIONS,
      pollVote: pollResult?.value ?? null,
      s2Prediction: predictionResult?.value ?? null,
      showCeremony,
    };
  } catch {
    return getDefaultState();
  }
};

export const persistGameData = async (store, players, sessions) => {
  try {
    await store.set("gn-players", JSON.stringify(players));
    await store.set("gn-sessions", JSON.stringify(sessions));
  } catch {
    return null;
  }

  return { players, sessions };
};
