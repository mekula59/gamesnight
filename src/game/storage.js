import { STORAGE_VERSION } from "./config";
import { CEREMONY_START_DATE } from "./seasons";
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

const getDefaultRivalOpsState = () => ({
  ops: [],
  selectedOpId: null,
  lastResolvedOpId: null,
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
    if (todayStr() >= CEREMONY_START_DATE) {
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

export const readRivalOpsState = async (store) => {
  try {
    const result = await store.get("gn-rival-ops");
    if (!result?.value) {
      return getDefaultRivalOpsState();
    }
    const parsed = JSON.parse(result.value);
    return {
      ops: parsed?.ops?.length ? [parsed.ops[0]] : [],
      selectedOpId: parsed?.selectedOpId ?? null,
      lastResolvedOpId: parsed?.lastResolvedOpId ?? null,
    };
  } catch {
    return getDefaultRivalOpsState();
  }
};

export const writeRivalOpsState = async (store, nextState) => {
  const safeState = {
    ops: nextState?.ops?.length ? [nextState.ops[0]] : [],
    selectedOpId: nextState?.selectedOpId ?? null,
    lastResolvedOpId: nextState?.lastResolvedOpId ?? null,
  };

  try {
    await store.set("gn-rival-ops", JSON.stringify(safeState));
  } catch {
    return null;
  }

  return safeState;
};

export const upsertRivalOpRecord = async (store, op, currentState) => {
  const nextState = {
    ops: op ? [op] : [],
    selectedOpId: op?.id ?? null,
    lastResolvedOpId:
      op?.state === "resolved" ? op.id : currentState?.lastResolvedOpId ?? null,
  };
  return writeRivalOpsState(store, nextState);
};

export const setSelectedRivalOpId = async (store, opId, currentState) =>
  writeRivalOpsState(store, {
    ...(currentState || getDefaultRivalOpsState()),
    selectedOpId: opId ?? null,
  });

export const pruneExpiredResolvedEcho = (persisted, nowUtc) => {
  if (!persisted?.ops?.length) {
    return getDefaultRivalOpsState();
  }
  const op = persisted.ops[0];
  if (op.state !== "resolved" || !op.resolvedAtUtc) {
    return persisted;
  }
  if (String(nowUtc).split("T")[0] <= op.resolvedAtUtc) {
    return persisted;
  }
  return {
    ...persisted,
    lastResolvedOpId: op.id,
  };
};

export const pruneInvalidRivalOps = (persisted, state, nowUtc) => {
  const safeState = persisted || getDefaultRivalOpsState();
  if (!safeState.ops.length) {
    return safeState;
  }
  const op = safeState.ops[0];
  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const hasPlayers =
    players.some((player) => player.id === op.playerAId) &&
    players.some((player) => player.id === op.playerBId);
  if (!hasPlayers || !sessions.length) {
    return getDefaultRivalOpsState();
  }
  return pruneExpiredResolvedEcho(safeState, nowUtc);
};
