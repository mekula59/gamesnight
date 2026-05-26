export const PLAYER_ALIAS_CANONICAL_ID = {
  p47: "p30",
  Kingabulletlengue: "p30",
  Kingabulletleague: "p30",
  Kinga: "p30",
};

const PLAYER_ALIAS_LOOKUP = Object.fromEntries(
  Object.entries(PLAYER_ALIAS_CANONICAL_ID).map(([alias, canonicalId]) => [
    alias.toLowerCase(),
    canonicalId,
  ]),
);

export const normalizePlayerId = (playerId) => {
  const key = String(playerId || "").trim();
  return PLAYER_ALIAS_LOOKUP[key.toLowerCase()] || key;
};

const dedupeIds = (playerIds = []) => {
  const seen = new Set();
  return playerIds
    .map(normalizePlayerId)
    .filter((playerId) => {
      if (!playerId || seen.has(playerId)) {
        return false;
      }
      seen.add(playerId);
      return true;
    });
};

const normalizeKills = (kills = {}) => {
  const nextKills = {};
  Object.entries(kills || {}).forEach(([playerId, value]) => {
    const canonicalId = normalizePlayerId(playerId);
    if (!canonicalId) {
      return;
    }
    nextKills[canonicalId] = (Number(nextKills[canonicalId]) || 0) + (Number(value) || 0);
  });
  return nextKills;
};

export const normalizePlayers = (players = []) => {
  const seen = new Set();
  const orderedPlayers = [
    ...players.filter((player) => normalizePlayerId(player?.id) === player?.id),
    ...players.filter((player) => normalizePlayerId(player?.id) !== player?.id),
  ];
  const nextPlayers = [];
  orderedPlayers.forEach((player) => {
    const canonicalId = normalizePlayerId(player?.id);
    const canonicalUsername = normalizePlayerId(player?.username);
    const nextPlayer = {
      ...player,
      id: canonicalId,
      username: canonicalId === "p30" || canonicalUsername === "p30" ? "EZEDINEYoutube" : player?.username,
    };
    if (!canonicalId || seen.has(canonicalId)) {
      return;
    }
    seen.add(canonicalId);
    nextPlayers.push(nextPlayer);
  });
  return nextPlayers;
};

export const normalizeSessions = (sessions = []) =>
  sessions.map((session) => ({
    ...session,
    winner: normalizePlayerId(session?.winner),
    attendees: dedupeIds(session?.attendees || []),
    placements: dedupeIds(session?.placements || []),
    kills: normalizeKills(session?.kills || {}),
  }));

export const normalizeGameData = (players = [], sessions = []) => ({
  players: normalizePlayers(players),
  sessions: normalizeSessions(sessions),
});
