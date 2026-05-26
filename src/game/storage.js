import { STORAGE_VERSION } from "./config";
import { normalizeGameData } from "./aliases";
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

const getDefaultState = () => {
  const normalized = normalizeGameData(INITIAL_PLAYERS, INITIAL_SESSIONS);
  return {
    players: normalized.players,
    sessions: normalized.sessions,
    pollVote: null,
    showCeremony: false,
  };
};

const OFFICIAL_REPLACEMENT_DATES = new Set(["2026-05-01"]);

const getSessionNumber = (session) =>
  Number(String(session?.id || "").replace(/\D/g, "")) || 0;

const replaceOfficialSessions = (sessions) => {
  if (!Array.isArray(sessions) || !sessions.length) {
    return INITIAL_SESSIONS;
  }

  const officialSessions = INITIAL_SESSIONS.filter((session) =>
    OFFICIAL_REPLACEMENT_DATES.has(session.date),
  );
  const officialDates = new Set(officialSessions.map((session) => session.date));
  const keptSessions = sessions.filter((session) => !officialDates.has(session.date));

  return normalizeGameData([], [...keptSessions, ...officialSessions]).sessions.sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return getSessionNumber(left) - getSessionNumber(right);
  });
};

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
      const normalized = normalizeGameData(INITIAL_PLAYERS, INITIAL_SESSIONS);
      await store.set("gn-players", JSON.stringify(normalized.players));
      await store.set("gn-sessions", JSON.stringify(normalized.sessions));
      return getDefaultState();
    }

    const playersResult = await store.get("gn-players");
    const sessionsResult = await store.get("gn-sessions");
    const storedPlayers = playersResult ? JSON.parse(playersResult.value) : INITIAL_PLAYERS;
    const storedSessions = sessionsResult ? JSON.parse(sessionsResult.value) : null;
    const rawSessions = replaceOfficialSessions(
      storedSessions && storedSessions.length > 0 ? storedSessions : INITIAL_SESSIONS,
    );
    const normalized = normalizeGameData(storedPlayers, rawSessions);
    const { players, sessions } = normalized;
    await store.set("gn-players", JSON.stringify(players));
    await store.set("gn-sessions", JSON.stringify(sessions));

    const pollKey = `gn-poll-${todayStr()}`;
    const pollResult = await store.get(pollKey);
    return {
      players,
      sessions,
      pollVote: pollResult?.value ?? null,
      showCeremony: false,
    };
  } catch {
    return getDefaultState();
  }
};

export const persistGameData = async (store, players, sessions) => {
  try {
    const normalized = normalizeGameData(players, sessions);
    await store.set("gn-players", JSON.stringify(normalized.players));
    await store.set("gn-sessions", JSON.stringify(normalized.sessions));
  } catch {
    return null;
  }

  return normalizeGameData(players, sessions);
};

export const readRivalOpsState = async (store) => {
  try {
    const result = await store.get("gn-rival-ops");
    if (!result?.value) {
      return getDefaultRivalOpsState();
    }
    const parsed = JSON.parse(result.value);
    return {
      ops: Array.isArray(parsed?.ops) ? parsed.ops.filter(Boolean) : [],
      selectedOpId: parsed?.selectedOpId ?? null,
      lastResolvedOpId: parsed?.lastResolvedOpId ?? null,
    };
  } catch {
    return getDefaultRivalOpsState();
  }
};

export const writeRivalOpsState = async (store, nextState) => {
  const safeState = {
    ops: Array.isArray(nextState?.ops) ? nextState.ops.filter(Boolean) : [],
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
  const currentOps = Array.isArray(currentState?.ops) ? currentState.ops.filter(Boolean) : [];
  const nextOps = op
    ? [...currentOps.filter((entry) => entry.pairId !== op.pairId), op]
    : currentOps;
  const nextState = {
    ops: nextOps,
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
  const nextOps = persisted.ops.map((op) => {
    if (op.state !== "resolved" || !op.resolvedAtUtc) {
      return op;
    }
    if (String(nowUtc).split("T")[0] <= op.resolvedAtUtc) {
      return op;
    }
    return op;
  });
  return {
    ...persisted,
    ops: nextOps,
  };
};

export const pruneInvalidRivalOps = (persisted, state, nowUtc) => {
  const safeState = persisted || getDefaultRivalOpsState();
  if (!safeState.ops.length) {
    return safeState;
  }
  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const nextOps = safeState.ops.filter((op) => {
    const hasPlayers =
      players.some((player) => player.id === op.playerAId) &&
      players.some((player) => player.id === op.playerBId);
    return hasPlayers;
  });
  if (!nextOps.length || !sessions.length) {
    return getDefaultRivalOpsState();
  }
  return pruneExpiredResolvedEcho({ ...safeState, ops: nextOps }, nowUtc);
};
