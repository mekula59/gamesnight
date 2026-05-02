import { SEASONS } from "./config";
import {
  APRIL_FOOLS_DATE,
  EASTER_SATURDAY_DATE,
  GOOD_FRIDAY_DATE,
  filterSessionsBySeason,
  getSeasonForDate,
} from "./seasons";
import { getNextSession, isLiveNow, todayStr } from "./time";

const SHELL_ALERT_PRIORITY = {
  FLASHPOINT: 500,
  HOT: 400,
  AFTERMATH: 300,
  WATCH: 200,
  QUIET: 100,
};

const SHELL_ALERT_SOURCE_PRIORITY = {
  rival_ops: 60,
  missions: 50,
  latest_fallout: 40,
  daily_orders: 30,
  system: 10,
};

const SHELL_ZONE_META = {
  home: {
    id: "home",
    label: "HOME BASE",
    shortLabel: "HOME",
    pathLabel: "COMMAND > HOME BASE",
    statusLine: "Command feed live",
  },
  leaderboard: {
    id: "leaderboard",
    label: "THE ARENA",
    shortLabel: "ARENA",
    pathLabel: "COMMAND > THE ARENA",
    statusLine: "Pressure board open",
  },
  profile: {
    id: "profile",
    label: "COMBAT FILE",
    shortLabel: "FILE",
    pathLabel: "COMMAND > COMBAT FILE",
    statusLine: "Dossier terminal open",
  },
  lobbies: {
    id: "lobbies",
    label: "WAR ROOM",
    shortLabel: "WAR ROOM",
    pathLabel: "COMMAND > WAR ROOM",
    statusLine: "Archive file open",
  },
  rivals: {
    id: "rivals",
    label: "RIVALS",
    shortLabel: "RIVALS",
    pathLabel: "COMMAND > RIVALS",
    statusLine: "Conflict desk open",
  },
  season1: {
    id: "season1",
    label: "S1 ARCHIVE",
    shortLabel: "S1",
    pathLabel: "COMMAND > S1 ARCHIVE",
    statusLine: "Campaign archive sealed",
  },
  season2: {
    id: "season2",
    label: "SEASON 2",
    shortLabel: "S2",
    pathLabel: "COMMAND > SEASON 2",
    statusLine: "Live campaign file open",
  },
  hof: {
    id: "hof",
    label: "LEGENDS WING",
    shortLabel: "WING",
    pathLabel: "COMMAND > LEGENDS WING",
    statusLine: "Legacy chamber open",
  },
  records: {
    id: "records",
    label: "THE VAULT",
    shortLabel: "VAULT",
    pathLabel: "COMMAND > THE VAULT",
    statusLine: "Secured records open",
  },
  charts: {
    id: "charts",
    label: "INTEL",
    shortLabel: "INTEL",
    pathLabel: "COMMAND > INTEL",
    statusLine: "System intel open",
  },
  faq: {
    id: "faq",
    label: "BRIEFING ROOM",
    shortLabel: "BRIEFING",
    pathLabel: "COMMAND > BRIEFING ROOM",
    statusLine: "Rules and room brief open",
  },
  admin: {
    id: "admin",
    label: "COMMAND",
    shortLabel: "COMMAND",
    pathLabel: "COMMAND",
    statusLine: "Control layer open",
  },
  fallback: {
    id: "fallback",
    label: "COMMAND",
    shortLabel: "COMMAND",
    pathLabel: "COMMAND",
    statusLine: "Zone link stable",
  },
};

export const parseSessionIdNumber = (sessionId = "") => {
  const match = String(sessionId).match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

export const compareSessionsAsc = (left, right) =>
  left.date.localeCompare(right.date) ||
  parseSessionIdNumber(left.id) - parseSessionIdNumber(right.id);

export const compareSessionsDesc = (left, right) =>
  right.date.localeCompare(left.date) ||
  parseSessionIdNumber(right.id) - parseSessionIdNumber(left.id);

export const createNextSessionId = (sessions) => {
  const nextNumber =
    sessions.reduce(
      (highest, session) => Math.max(highest, parseSessionIdNumber(session.id)),
      0,
    ) + 1;

  return `s${String(nextNumber).padStart(2, "0")}`;
};

export const createNextPlayerId = (players) => {
  const nextNumber =
    players.reduce(
      (highest, player) => Math.max(highest, parseSessionIdNumber(player.id)),
      0,
    ) + 1;

  return `p${String(nextNumber).padStart(2, "0")}`;
};

export const buildPlayerIndex = (players) =>
  Object.fromEntries(players.map((player) => [player.id, player]));

export const getPlayerById = (playerIndex, playerId) =>
  playerId ? playerIndex[playerId] ?? null : null;

const sortKillKingEntries = (entries, players) => {
  const hostId = players.find((player) => player.host)?.id || "";
  return [...entries].sort((left, right) => {
    const leftId = left.id || left.pid || "";
    const rightId = right.id || right.pid || "";
    if (leftId === hostId && rightId !== hostId) {
      return -1;
    }
    if (rightId === hostId && leftId !== hostId) {
      return 1;
    }
    return 0;
  });
};

const sortWinLeaderEntries = (entries, players, getWins, getKills = () => 0) => {
  const hostId = players.find((player) => player.host)?.id || "";
  return [...entries].sort((left, right) => {
    const winDelta = getWins(right) - getWins(left);
    if (winDelta !== 0) {
      return winDelta;
    }
    const leftId = left.id || left.pid || "";
    const rightId = right.id || right.pid || "";
    if (leftId === hostId && rightId !== hostId) {
      return -1;
    }
    if (rightId === hostId && leftId !== hostId) {
      return 1;
    }
    const killDelta = getKills(right) - getKills(left);
    if (killDelta !== 0) {
      return killDelta;
    }
    return 0;
  });
};

export const getLatestSessionDate = (sessions) => {
  if (!sessions.length) {
    return todayStr();
  }

  return [...sessions].sort(compareSessionsDesc)[0].date;
};

export const getPeriodSessions = (sessions, period = "all") => {
  if (period === "today") {
    const latestDate = getLatestSessionDate(sessions);
    return sessions.filter((session) => session.date === latestDate);
  }

  if (period === "week") {
    const latestDate = getLatestSessionDate(sessions);
    if (!latestDate) {
      return [];
    }

    const latest = new Date(`${latestDate}T12:00:00Z`);
    const weekStart = new Date(latest);
    weekStart.setDate(latest.getDate() - ((latest.getDay() + 6) % 7));
    const weekStartString = weekStart.toISOString().split("T")[0];

    return sessions.filter(
      (session) => session.date >= weekStartString && session.date <= latestDate,
    );
  }

  return sessions;
};

export const getSeasonSessions = (sessions, seasonId) => {
  return filterSessionsBySeason(sessions, seasonId);
};

export const getStats = (playerId, sessions) => {
  const playerSessions = sessions.filter((session) =>
    session.attendees?.includes(playerId),
  );
  const kills = playerSessions.reduce(
    (total, session) => total + (session.kills?.[playerId] || 0),
    0,
  );
  const deaths = playerSessions.reduce(
    (total, session) => total + (session.deaths?.[playerId] || 0),
    0,
  );
  const wins = playerSessions.filter((session) => session.winner === playerId).length;
  const appearances = playerSessions.length;
  const biggestGame = playerSessions.length
    ? Math.max(...playerSessions.map((session) => session.kills?.[playerId] || 0))
    : 0;
  const kd =
    appearances > 0 ? Number.parseFloat((kills / appearances).toFixed(2)) : 0;
  const winRate = appearances > 0 ? Math.round((wins / appearances) * 100) : 0;

  return { kills, deaths, wins, appearances, biggestGame, kd, winRate };
};

export const allStats = (players, sessions) =>
  players.map((player) => ({ ...player, ...getStats(player.id, sessions) }));

export const getRank = (playerId, players, sessions) => {
  const stats = getStats(playerId, sessions);
  const standings = allStats(players, sessions);
  const byWins = [...standings].sort((left, right) => right.wins - left.wins);
  const byKills = [...standings].sort((left, right) => right.kills - left.kills);
  const champion = byWins.find((player) => player.wins > 0);
  const reaper = byKills.find(
    (player) => player.kills > 0 && player.id !== champion?.id,
  );
  const byKd = [...standings]
    .filter((player) => player.appearances >= 5)
    .sort((left, right) => right.kd - left.kd);
  const sharpshooter = byKd.find(
    (player) => player.id !== champion?.id && player.id !== reaper?.id,
  );
  const byAppearances = [...standings].sort(
    (left, right) =>
      right.appearances - left.appearances || right.wins - left.wins,
  );
  const rideOrDie = byAppearances.find(
    (player) =>
      player.id !== champion?.id &&
      player.id !== reaper?.id &&
      player.id !== sharpshooter?.id &&
      player.appearances > 0,
  );

  if (champion?.id === playerId) {
    return { title: "👑 The Champion", color: "#FFD700" };
  }
  if (reaper?.id === playerId) {
    return { title: "💀 The Reaper", color: "#FF4D8F" };
  }
  if (sharpshooter?.id === playerId) {
    return { title: "🎯 Sharpshooter", color: "#00E5FF" };
  }
  if (rideOrDie?.id === playerId) {
    return { title: "🎮 Ride or Die", color: "#FFAB40" };
  }
  if (stats.wins >= 10) {
    return { title: "⚡ Legend", color: "#C77DFF" };
  }
  if (stats.wins >= 6) {
    return { title: "🔥 Veteran", color: "#FFAB40" };
  }
  if (stats.wins >= 3) {
    return { title: "⭐ Gunslinger", color: "#40C4FF" };
  }
  if (stats.wins >= 1) {
    return { title: "🌟 Rising Star", color: "#00FF94" };
  }
  return { title: "🎮 Rookie", color: "#7a6eaa" };
};

export const getStreak = (playerId, sessions) => {
  const sortedSessions = [...sessions].sort(compareSessionsAsc);
  const playedSessions = sortedSessions.filter((session) =>
    session.attendees?.includes(playerId),
  );

  let best = 0;
  let current = 0;
  let lastDate = "";

  for (const session of playedSessions) {
    if (session.date !== lastDate) {
      current = 0;
      lastDate = session.date;
    }

    if (session.winner === playerId) {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else {
      current = 0;
    }
  }

  return best;
};

export const getLiveDayStreak = (
  playerId,
  sessions,
  date = getLatestSessionDate(sessions),
) => {
  if (!playerId || !date) {
    return 0;
  }

  const daySessions = [...sessions]
    .filter(
      (session) =>
        session.date === date &&
        session.attendees?.includes(playerId),
    )
    .sort(compareSessionsAsc);

  let current = 0;
  daySessions.forEach((session) => {
    if (session.winner === playerId) {
      current += 1;
    } else {
      current = 0;
    }
  });

  return current;
};

export const getCarryScore = (playerId, sessions) =>
  sessions
    .filter(
      (session) => session.attendees?.includes(playerId) && session.winner === playerId,
    )
    .filter((session) => {
      const topKills = Math.max(
        0,
        ...Object.values(session.kills || {}).map(Number),
      );
      return topKills > 0 && (session.kills?.[playerId] || 0) >= topKills;
    }).length;

export const getConsistency = (playerId, sessions) => {
  const playerSessions = sessions.filter((session) =>
    session.attendees?.includes(playerId),
  );

  if (!playerSessions.length) {
    return 0;
  }

  const topHalfFinishes = playerSessions.filter((session) => {
    const placements = session.placements || session.attendees || [];
    const position = placements.indexOf(playerId);
    if (position === -1) {
      return false;
    }
    return position < Math.ceil(placements.length / 2);
  }).length;

  return Math.round((topHalfFinishes / playerSessions.length) * 100);
};

export const getDrought = (playerId, sessions) => {
  const playerSessions = [...sessions]
    .filter((session) => session.attendees?.includes(playerId))
    .sort(compareSessionsDesc);

  if (!playerSessions.length) {
    return 0;
  }

  if (playerSessions[0].winner === playerId) {
    return 0;
  }

  const lastWinIndex = playerSessions.findIndex(
    (session) => session.winner === playerId,
  );

  return lastWinIndex === -1 ? playerSessions.length : lastWinIndex;
};

export const getFormGuide = (playerId, sessions, count = 5) =>
  [...sessions]
    .filter((session) => session.attendees?.includes(playerId))
    .sort(compareSessionsDesc)
    .slice(0, count)
    .reverse()
    .map((session) => ({
      win: session.winner === playerId,
      sid: session.id,
      date: session.date,
      kills: session.kills?.[playerId] || 0,
    }));

export const getBadges = (playerId, sessions) => {
  const stats = getStats(playerId, sessions);
  const badges = [];
  const streak = getStreak(playerId, sessions);

  if (streak >= 3) {
    badges.push({ icon: "🔥", label: `Best Run ${streak}`, hot: true });
  } else if (streak >= 2) {
    badges.push({ icon: "🔥", label: `Best Run ${streak}` });
  }

  if (stats.wins > 0) {
    badges.push({ icon: "🏆", label: "Winner" });
  }
  if (stats.appearances >= sessions.length && sessions.length >= 4) {
    badges.push({ icon: "📅", label: "Full House" });
  }
  if (stats.kills >= 1000) {
    badges.push({ icon: "👹", label: "1K Kills", hot: true });
  }
  if (stats.kills >= 500) {
    badges.push({ icon: "💀", label: "500 Kills" });
  }
  if (stats.kills >= 100) {
    badges.push({ icon: "🎖️", label: "100 Kills" });
  } else if (stats.kills >= 50) {
    badges.push({ icon: "💥", label: "50 Kills" });
  }
  if (stats.kd >= 2 && stats.appearances >= 2) {
    badges.push({ icon: "⚡", label: "2.0+ K/G" });
  }
  if (stats.biggestGame >= 10) {
    badges.push({ icon: "🌟", label: "Big Game" });
  } else if (stats.biggestGame >= 6) {
    badges.push({ icon: "🗡️", label: "Assassin" });
  }
  if (stats.winRate >= 50 && stats.appearances >= 3) {
    badges.push({ icon: "🎯", label: "50% WR" });
  }

  const topThreeFinishes = sessions.filter((session) =>
    session.attendees?.includes(playerId) &&
    (session.placements || session.attendees).slice(0, 3).includes(playerId),
  ).length;
  if (topThreeFinishes >= 10) {
    badges.push({ icon: "🧱", label: "Iron Wall" });
  }

  const appearancesByDay = {};
  sessions
    .filter((session) => session.attendees?.includes(playerId))
    .forEach((session) => {
      appearancesByDay[session.date] = (appearancesByDay[session.date] || 0) + 1;
    });
  if (Object.values(appearancesByDay).some((value) => value >= 15)) {
    badges.push({ icon: "📆", label: "Marathon" });
  }

  const winsByDay = {};
  sessions
    .filter(
      (session) =>
        session.attendees?.includes(playerId) && session.winner === playerId,
    )
    .forEach((session) => {
      winsByDay[session.date] = (winsByDay[session.date] || 0) + 1;
    });
  if (Object.values(winsByDay).some((value) => value >= 3)) {
    badges.push({ icon: "🌊", label: "Hot Hand", hot: true });
  }

  if (stats.appearances >= 20 && stats.wins === 0) {
    badges.push({ icon: "🤝", label: "Never 1st" });
  }

  const rampageGames = sessions.filter(
    (session) =>
      session.attendees?.includes(playerId) && (session.kills?.[playerId] || 0) >= 6,
  ).length;
  if (rampageGames >= 3) {
    badges.push({ icon: "☄️", label: "Rampage", hot: true });
  }

  if (
    sessions.some(
      (session) =>
        session.date === EASTER_SATURDAY_DATE &&
        session.attendees?.includes(playerId),
    )
  ) {
    badges.push({ icon: "🥚", label: "Easter Egg" });
  }

  if (stats.appearances >= 1) {
    badges.push({ icon: "🎂", label: "Day One" });
  }

  if (
    sessions.some(
      (session) =>
        session.date === GOOD_FRIDAY_DATE && session.attendees?.includes(playerId),
    )
  ) {
    badges.push({ icon: "💪", label: "No Days Off" });
  }

  const seasonTwoSessions = filterSessionsBySeason(sessions, "s2");
  if (seasonTwoSessions.length > 0) {
    const seasonTwoDays = [...new Set(seasonTwoSessions.map((session) => session.date))].sort();
    if (
      seasonTwoDays.length > 0 &&
      seasonTwoSessions.some(
        (session) =>
          session.date === seasonTwoDays[0] && session.attendees?.includes(playerId),
      )
    ) {
      badges.push({ icon: "🌅", label: "Opening Night" });
    }

    const seasonTwoWins = [...seasonTwoSessions]
      .sort(compareSessionsAsc)
      .filter((session) => session.winner);
    if (seasonTwoWins.length > 0 && seasonTwoWins[0].winner === playerId) {
      badges.push({ icon: "🚀", label: "First Blood S2", hot: true });
    }

    const seasonTwoWinMap = {};
    seasonTwoSessions.forEach((session) => {
      if (session.winner) {
        seasonTwoWinMap[session.winner] = (seasonTwoWinMap[session.winner] || 0) + 1;
      }
    });
    const topSeasonTwoWinner = Object.entries(seasonTwoWinMap).sort(
      (left, right) => right[1] - left[1],
    )[0];
    if (
      topSeasonTwoWinner &&
      topSeasonTwoWinner[0] === playerId &&
      topSeasonTwoWinner[1] > 0
    ) {
      badges.push({ icon: "👑", label: "S2 Champion", hot: true });
    }

    const seasonTwoConfig = SEASONS.find((season) => season.id === "s2");
    const finalDayFiled = seasonTwoConfig
      ? seasonTwoSessions.some((session) => session.date === seasonTwoConfig.end)
      : false;
    const seasonTwoResolved = seasonTwoConfig
      ? todayStr() > seasonTwoConfig.end || finalDayFiled
      : false;
    const wonEveryFiledDay =
      seasonTwoDays.length > 0 &&
      seasonTwoDays.every((date) =>
        seasonTwoSessions.some(
          (session) => session.date === date && session.winner === playerId,
        ),
      );
    if (seasonTwoResolved && wonEveryFiledDay) {
      badges.push({ icon: "🛡️", label: "Invincible", hot: true });
    }
  }

  if (
    sessions.some(
      (session) =>
        session.date === APRIL_FOOLS_DATE && session.winner === playerId,
    )
  ) {
    badges.push({ icon: "🃏", label: "Fool's Crown", hot: true });
  }

  const seasonOneSessions = filterSessionsBySeason(sessions, "s1");
  if (seasonOneSessions.length > 0) {
    const seasonOneWinMap = {};
    seasonOneSessions.forEach((session) => {
      if (session.winner) {
        seasonOneWinMap[session.winner] = (seasonOneWinMap[session.winner] || 0) + 1;
      }
    });
    const seasonOneChampion = Object.entries(seasonOneWinMap).sort(
      (left, right) => right[1] - left[1],
    )[0];
    if (seasonOneChampion && seasonOneChampion[0] === playerId) {
      badges.push({ icon: "🏆", label: "S1 Champion", hot: true });
    }

    const seasonOneKillMap = {};
    seasonOneSessions.forEach((session) => {
      Object.entries(session.kills || {}).forEach(([pid, kills]) => {
        seasonOneKillMap[pid] = (seasonOneKillMap[pid] || 0) + kills;
      });
    });
    const seasonOneReaper = Object.entries(seasonOneKillMap).sort(
      (left, right) => right[1] - left[1],
    )[0];
    if (seasonOneReaper && seasonOneReaper[0] === playerId) {
      badges.push({ icon: "💀", label: "S1 Reaper", hot: true });
    }

    const seasonOneStandings = Object.entries(seasonOneWinMap).sort(
      (left, right) => right[1] - left[1],
    );
    const podiumIds = seasonOneStandings.slice(1, 4).map(([pid]) => pid);
    if (podiumIds.includes(playerId)) {
      badges.push({ icon: "🥈", label: "S1 Podium" });
    }

    let seasonOneBestGame = { pid: "", kills: 0 };
    seasonOneSessions.forEach((session) => {
      Object.entries(session.kills || {}).forEach(([pid, kills]) => {
        if (kills > seasonOneBestGame.kills) {
          seasonOneBestGame = { pid, kills };
        }
      });
    });
    if (seasonOneBestGame.pid === playerId) {
      badges.push({ icon: "☄️", label: "S1 Record Breaker", hot: true });
    }

    const seasonOneAppearances = {};
    seasonOneSessions.forEach((session) => {
      (session.attendees || []).forEach((pid) => {
        seasonOneAppearances[pid] = (seasonOneAppearances[pid] || 0) + 1;
      });
    });
    const seasonOneIronMan = Object.entries(seasonOneAppearances).sort(
      (left, right) => right[1] - left[1],
    )[0];
    if (seasonOneIronMan && seasonOneIronMan[0] === playerId) {
      badges.push({ icon: "🛡️", label: "S1 Iron Man" });
    }
  }

  return badges;
};

export const getPlayerLevel = (playerId, sessions) => {
  const stats = getStats(playerId, sessions);
  const badges = getBadges(playerId, sessions);
  const seasonsPlayed = SEASONS.filter((season) =>
    sessions.some(
      (session) =>
        session.date >= season.start &&
        session.date <= season.end &&
        session.attendees?.includes(playerId),
    ),
  ).length;
  const xp = Math.floor(
    stats.appearances * 1 +
      stats.wins * 3 +
      stats.kills * 0.5 +
      badges.length * 10 +
      seasonsPlayed * 25,
  );
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 8)));
  const nextLevelXp = (level + 1) ** 2 * 8;
  const currentLevelXp = level ** 2 * 8;
  const progress = Math.min(
    100,
    Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  );

  return { xp, lvl: level, progress, xpForNext: nextLevelXp };
};

export const getDailyMVP = (sessions, players) => {
  const latestDate = getLatestSessionDate(sessions);
  const latestSessions = sessions.filter((session) => session.date === latestDate);
  if (!latestSessions.length) {
    return null;
  }

  const stats = allStats(players, latestSessions).filter(
    (player) => player.appearances > 0,
  );
  if (!stats.length) {
    return null;
  }

  let killKingValue = 0;
  latestSessions.forEach((session) => {
    Object.values(session.kills || {}).forEach((kills) => {
      if (kills > killKingValue) {
        killKingValue = kills;
      }
    });
  });

  const killKings = [];
  if (killKingValue > 0) {
    latestSessions.forEach((session) => {
      Object.entries(session.kills || {}).forEach(([pid, kills]) => {
        const existing = killKings.find((player) => player.id === pid);
        if (kills === killKingValue && !existing) {
          const statsPlayer = stats.find((player) => player.id === pid);
          if (statsPlayer) {
            killKings.push({
              ...statsPlayer,
              killKingK: killKingValue,
              killKingSid: session.id,
            });
          }
        }
      });
    });
  }
  const sortedKillKings = sortKillKingEntries(killKings, players);
  const sortedWinners = sortWinLeaderEntries(
    stats,
    players,
    (player) => player.wins,
    (player) => player.kills,
  );

  return {
    date: latestDate,
    topWinner: sortedWinners[0],
    topKiller: [...stats].sort(
      (left, right) => right.kills - left.kills || right.wins - left.wins,
    )[0],
    topAppear: [...stats].sort(
      (left, right) => right.appearances - left.appearances,
    )[0],
    killKing: sortedKillKings[0] || null,
    killKings: sortedKillKings,
  };
};

export const getRivals = (sessions) => {
  const duels = {};

  sessions.forEach((session) => {
    const placements = session.placements || session.attendees;
    if (!placements || placements.length < 2) {
      return;
    }

    const [first, second] = placements;
    const key = [first, second].sort().join(":");

    if (!duels[key]) {
      const [p1, p2] = key.split(":");
      duels[key] = { p1, p2, p1wins: 0, p2wins: 0, total: 0 };
    }

    if (duels[key].p1 === first) {
      duels[key].p1wins += 1;
    } else {
      duels[key].p2wins += 1;
    }
    duels[key].total += 1;
  });

  return Object.values(duels).sort((left, right) => right.total - left.total);
};

const getUtcDayDistance = (fromDate, toDate) => {
  if (!fromDate || !toDate) {
    return 999;
  }
  const from = new Date(`${fromDate}T12:00:00Z`);
  const to = new Date(`${toDate}T12:00:00Z`);
  return Math.max(0, Math.round((to - from) / 86400000));
};

const getRivalryHeatLine = (row) => {
  if (row.gap <= 1 && row.seasonMeetings >= 2) {
    return "One top-two finish can swing this.";
  }
  if (row.gap <= 2) {
    return "Close enough to turn fast.";
  }
  if (row.recentMeetings.length >= 3) {
    return "They keep landing in the same fight.";
  }
  if (row.seasonMeetings >= 3) {
    return "This season keeps pulling them together.";
  }
  return "History is still on the board.";
};

export const getRivalryBoard = (sessions, players, options = {}) => {
  const sortedSessions = [...sessions].sort(compareSessionsAsc);
  const latestDate = options.latestDate || sortedSessions.at(-1)?.date || todayStr();
  const activeSeason = options.seasonId
    ? SEASONS.find((season) => season.id === options.seasonId) || null
    : getSeasonForDate(latestDate);
  const latestSessionIds = new Set(sortedSessions.slice(-24).map((session) => session.id));
  const rowsByPair = {};

  sortedSessions.forEach((session) => {
    const placements = session.placements || session.attendees;
    if (!placements || placements.length < 2) {
      return;
    }

    const [first, second] = placements;
    if (!first || !second || first === second) {
      return;
    }

    const pairId = [first, second].sort().join(":");
    if (!rowsByPair[pairId]) {
      const [playerAId, playerBId] = pairId.split(":");
      rowsByPair[pairId] = {
        pairId,
        playerAId,
        playerBId,
        playerA: players.find((player) => player.id === playerAId) || null,
        playerB: players.find((player) => player.id === playerBId) || null,
        meetings: 0,
        playerAWins: 0,
        playerBWins: 0,
        lastMeetingDate: "",
        recentMeetings: [],
        seasonMeetings: 0,
        seasonPlayerAWins: 0,
        seasonPlayerBWins: 0,
        recentClashCount: 0,
      };
    }

    const row = rowsByPair[pairId];
    const playerAWon = row.playerAId === first;
    row.meetings += 1;
    row.playerAWins += playerAWon ? 1 : 0;
    row.playerBWins += playerAWon ? 0 : 1;
    row.lastMeetingDate = session.date;
    row.recentMeetings.push({
      sessionId: session.id,
      date: session.date,
      firstId: first,
      secondId: second,
      winnerId: first,
    });

    if (
      activeSeason &&
      session.date >= activeSeason.start &&
      session.date <= activeSeason.end
    ) {
      row.seasonMeetings += 1;
      row.seasonPlayerAWins += playerAWon ? 1 : 0;
      row.seasonPlayerBWins += playerAWon ? 0 : 1;
    }

    if (latestSessionIds.has(session.id)) {
      row.recentClashCount += 1;
    }
  });

  const rows = Object.values(rowsByPair)
    .filter((row) => row.meetings > 0 && row.playerA && row.playerB)
    .map((row) => {
      const leaderId =
        row.playerAWins === row.playerBWins
          ? null
          : row.playerAWins > row.playerBWins
            ? row.playerAId
            : row.playerBId;
      const gap = Math.abs(row.playerAWins - row.playerBWins);
      const daysSince = getUtcDayDistance(row.lastMeetingDate, latestDate);
      const recencyScore =
        daysSince <= 2 ? 36 :
        daysSince <= 7 ? 28 :
        daysSince <= 14 ? 18 :
        daysSince <= 30 ? 9 : 0;
      const meetingScore = Math.min(row.meetings * 2.4, 28);
      const gapScore = Math.max(0, 18 - gap * 3);
      const seasonScoreValue = Math.min(row.seasonMeetings * 4, 22);
      const repeatScore = Math.min(row.recentClashCount * 5, 18);
      const heatScore = Math.round(recencyScore + meetingScore + gapScore + seasonScoreValue + repeatScore);

      return {
        pairId: row.pairId,
        playerA: row.playerA,
        playerB: row.playerB,
        meetings: row.meetings,
        playerAWins: row.playerAWins,
        playerBWins: row.playerBWins,
        leaderId,
        scoreLine: `${row.playerAWins}-${row.playerBWins}`,
        gap,
        lastMeetingDate: row.lastMeetingDate,
        recentMeetings: row.recentMeetings.slice(-5).reverse(),
        seasonMeetings: row.seasonMeetings,
        seasonScore: {
          playerAWins: row.seasonPlayerAWins,
          playerBWins: row.seasonPlayerBWins,
          scoreLine: `${row.seasonPlayerAWins}-${row.seasonPlayerBWins}`,
        },
        allTimeScore: {
          playerAWins: row.playerAWins,
          playerBWins: row.playerBWins,
          scoreLine: `${row.playerAWins}-${row.playerBWins}`,
        },
        heatTier: "cold",
        heatScore,
        pressureLine: getRivalryHeatLine({
          gap,
          seasonMeetings: row.seasonMeetings,
          recentMeetings: row.recentMeetings.slice(-5),
        }),
      };
    })
    .sort(
      (left, right) =>
        right.heatScore - left.heatScore ||
        right.meetings - left.meetings ||
        left.gap - right.gap ||
        right.lastMeetingDate.localeCompare(left.lastMeetingDate),
    );

  rows.forEach((row, index) => {
    row.heatTier = index < 6 ? "hot" : index < 13 ? "watch" : "cold";
  });

  return {
    hot: rows.filter((row) => row.heatTier === "hot"),
    watch: rows.filter((row) => row.heatTier === "watch"),
    cold: rows.filter((row) => row.heatTier === "cold"),
    rows,
    seasonId: activeSeason?.id || "all",
    latestDate,
  };
};

export const getActivityFeed = (sessions, players) => {
  const events = [];
  const sortedSessions = [...sessions].sort(compareSessionsAsc);

  players.forEach((player) => {
    let currentStreak = 0;
    let lastDate = "";
    sortedSessions
      .filter((session) => session.attendees?.includes(player.id))
      .forEach((session) => {
        if (session.date !== lastDate) {
          currentStreak = 0;
          lastDate = session.date;
        }

        if (session.winner === player.id) {
          currentStreak += 1;
          if ([3, 5, 7].includes(currentStreak)) {
            events.push({
              type: "streak",
              pid: player.id,
              val: currentStreak,
              date: session.date,
              sid: session.id,
            });
          }
        } else {
          currentStreak = 0;
        }
      });
  });

  players.forEach((player) => {
    let totalKills = 0;
    sortedSessions
      .filter((session) => session.attendees?.includes(player.id))
      .forEach((session) => {
        const previousTotal = totalKills;
        totalKills += session.kills?.[player.id] || 0;
        [50, 100, 150, 200].forEach((milestone) => {
          if (previousTotal < milestone && totalKills >= milestone) {
            events.push({
              type: "kills",
              pid: player.id,
              val: milestone,
              date: session.date,
              sid: session.id,
            });
          }
        });
      });
  });

  players.forEach((player) => {
    let totalWins = 0;
    sortedSessions
      .filter(
        (session) =>
          session.attendees?.includes(player.id) && session.winner === player.id,
      )
      .forEach((session) => {
        totalWins += 1;
        if (totalWins === 1) {
          events.push({
            type: "firstwin",
            pid: player.id,
            val: 1,
            date: session.date,
            sid: session.id,
          });
        }
        [5, 10, 15, 20].forEach((milestone) => {
          if (totalWins === milestone) {
            events.push({
              type: "wins",
              pid: player.id,
              val: milestone,
              date: session.date,
              sid: session.id,
            });
          }
        });
      });
  });

  players.forEach((player) => {
    let maxKills = 0;
    sortedSessions
      .filter((session) => session.attendees?.includes(player.id))
      .forEach((session) => {
        const kills = session.kills?.[player.id] || 0;
        if (kills > maxKills) {
          if (kills >= 8) {
            events.push({
              type: "record",
              pid: player.id,
              val: kills,
              date: session.date,
              sid: session.id,
            });
          }
          maxKills = kills;
        }
      });
  });

  return events
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        parseSessionIdNumber(right.sid) - parseSessionIdNumber(left.sid),
    )
    .slice(0, 8);
};

export const getWeeklyAwards = (sessions, players) => {
  const latestDate = getLatestSessionDate(sessions);
  if (!latestDate) {
    return null;
  }

  const latest = new Date(`${latestDate}T12:00:00Z`);
  const weekStart = new Date(latest);
  weekStart.setDate(latest.getDate() - ((latest.getDay() + 6) % 7));
  const weekStartString = weekStart.toISOString().split("T")[0];

  const weeklySessions = sessions.filter(
    (session) => session.date >= weekStartString && session.date <= latestDate,
  );
  if (!weeklySessions.length) {
    return null;
  }

  const stats = allStats(players, weeklySessions).filter(
    (player) => player.appearances > 0,
  );
  const byWins = [...stats].sort(
    (left, right) => right.wins - left.wins || right.kills - left.kills,
  );
  const byKills = [...stats].sort(
    (left, right) => right.kills - left.kills || right.wins - left.wins,
  );
  const byKd = [...stats]
    .filter((player) => player.appearances >= 3)
    .sort((left, right) => right.kd - left.kd);
  const byAppearances = [...stats].sort(
    (left, right) => right.appearances - left.appearances,
  );
  const iceCold = [...stats]
    .filter((player) => player.wins === 0 && player.appearances >= 5)
    .sort((left, right) => right.appearances - left.appearances);

  return {
    week: weekStartString,
    end: latestDate,
    lobbies: weeklySessions.length,
    mvpWins: byWins[0],
    mvpKills: byKills[0],
    mvpKD: byKd[0],
    mvpActive: byAppearances[0],
    iceCold: iceCold[0] || null,
  };
};

export const getWeeklyMissions = (sessions) => {
  const weeklySessions = getPeriodSessions(sessions, "week");
  const weeklyKills = weeklySessions.reduce(
    (total, session) =>
      total + Object.values(session.kills || {}).reduce((sum, kills) => sum + kills, 0),
    0,
  );
  const uniqueWinners = [
    ...new Set(
      weeklySessions
        .filter((session) => session.winner)
        .map((session) => session.winner),
    ),
  ].length;

  const lobbyTarget = 15;
  const killTarget = 60;
  const winnerTarget = 4;

  return [
    {
      icon: "🎮",
      color: "#00E5FF",
      label: "ROOM LOCKDOWN",
      desc: "Get 15 lobbies onto the weekly file before reset",
      progress: Math.min(weeklySessions.length, lobbyTarget),
      target: lobbyTarget,
      unit: `${weeklySessions.length}/${lobbyTarget} lobbies on file`,
      measureSingular: "room",
      measurePlural: "rooms",
      clearedCopy: "Fifteen rooms on file means the week has real weight now.",
    },
    {
      icon: "💀",
      color: "#FF4D8F",
      label: "DAMAGE SURGE",
      desc: "Push 60 kills through the weekly board",
      progress: Math.min(weeklyKills, killTarget),
      target: killTarget,
      unit: `${weeklyKills}/${killTarget} kills confirmed`,
      measureSingular: "kill",
      measurePlural: "kills",
      clearedCopy: "Sixty kills on file means nobody got a quiet week.",
    },
    {
      icon: "👑",
      color: "#FFD700",
      label: "CROWN SHAKEUP",
      desc: "Force 4 different winners onto the weekly file",
      progress: Math.min(uniqueWinners, winnerTarget),
      target: winnerTarget,
      unit: `${uniqueWinners}/${winnerTarget} winners rotated`,
      measureSingular: "winner",
      measurePlural: "winners",
      clearedCopy: "Four winners on file means the week refused to sit under one crown.",
    },
  ];
};

const createAdaptiveMissionState = (progress, target, color) => {
  const gap = Math.max(target - progress, 0);
  const pct = target > 0 ? progress / target : 0;

  if (gap <= 1) {
    return { stateLabel: "ON THE EDGE", stateColor: "#FFD700" };
  }
  if (pct >= 0.72) {
    return { stateLabel: "CLOSING IN", stateColor: color };
  }
  if (pct >= 0.45) {
    return { stateLabel: "BUILDING", stateColor: color };
  }
  return { stateLabel: "LIVE WATCH", stateColor: "rgba(255,255,255,.56)" };
};

export const getRecords = (sessions, players) => {
  if (!sessions.length) {
    return null;
  }

  let topGame = { pid: "", k: 0, sid: "", date: "" };
  sessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      if (kills > topGame.k) {
        topGame = { pid, k: kills, sid: session.id, date: session.date };
      }
    });
  });

  const dayCounts = {};
  sessions.forEach((session) => {
    Object.keys(session.kills || {}).forEach((pid) => {
      const key = `${pid}|${session.date}`;
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
  });

  let topDay = { pid: "", count: 0, date: "" };
  Object.entries(dayCounts).forEach(([key, count]) => {
    const [pid, date] = key.split("|");
    if (count > topDay.count) {
      topDay = { pid, count, date };
    }
  });

  let bestStreak = { pid: "", streak: 0 };
  players.forEach((player) => {
    const streak = getStreak(player.id, sessions);
    if (streak > bestStreak.streak) {
      bestStreak = { pid: player.id, streak };
    }
  });

  const winMap = {};
  sessions.forEach((session) => {
    if (session.winner) {
      winMap[session.winner] = (winMap[session.winner] || 0) + 1;
    }
  });
  const topWinner = Object.entries(winMap).sort(
    (left, right) => right[1] - left[1],
  )[0] || ["", 0];

  const firstSession = [...sessions].sort(compareSessionsAsc)[0];

  const killMap = {};
  sessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      killMap[pid] = (killMap[pid] || 0) + kills;
    });
  });
  const topKiller = Object.entries(killMap).sort(
    (left, right) => right[1] - left[1],
  )[0] || ["", 0];

  const dayKillMap = {};
  sessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      const key = `${pid}|${session.date}`;
      dayKillMap[key] = (dayKillMap[key] || 0) + kills;
    });
  });

  let topDayKill = { pid: "", k: 0, date: "" };
  Object.entries(dayKillMap).forEach(([key, kills]) => {
    const [pid, date] = key.split("|");
    if (kills > topDayKill.k) {
      topDayKill = { pid, k: kills, date };
    }
  });

  return {
    topGame,
    topDay,
    bestStreak,
    topWinner,
    topKiller,
    topDayKill,
    first: firstSession,
    totalSessions: sessions.length,
    totalKills: Object.values(killMap).reduce((sum, kills) => sum + kills, 0),
  };
};

export const getChartData = (playerId, sessions) => {
  const sortedSessions = [...sessions].sort(compareSessionsAsc);
  const playedSessions = sortedSessions.filter((session) =>
    session.attendees?.includes(playerId),
  );

  if (!playedSessions.length) {
    return [];
  }

  const byDate = {};
  playedSessions.forEach((session) => {
    if (!byDate[session.date]) {
      byDate[session.date] = {
        date: session.date,
        wins: 0,
        kills: 0,
        games: 0,
      };
    }
    byDate[session.date].wins += session.winner === playerId ? 1 : 0;
    byDate[session.date].kills += session.kills?.[playerId] || 0;
    byDate[session.date].games += 1;
  });

  return Object.values(byDate).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
};

export const getPOTW = (sessions, players) => {
  const awards = getWeeklyAwards(sessions, players);
  if (!awards?.mvpWins) {
    return null;
  }

  const player = players.find((entry) => entry.id === awards.mvpWins.id);
  if (!player) {
    return null;
  }

  return {
    player,
    wins: awards.mvpWins.wins,
    kills: awards.mvpWins.kills,
    games: awards.mvpWins.appearances,
    kd: awards.mvpWins.kd,
    week: awards.week,
  };
};

export const getHeatmap = (sessions) => {
  const map = {};
  sessions.forEach((session) => {
    map[session.date] = (map[session.date] || 0) + 1;
  });
  return map;
};

export const getLiveStreaks = (sessions, players) => {
  const latestDate = getLatestSessionDate(sessions);
  if (!latestDate) {
    return [];
  }

  return players
    .map((player) => ({ ...player, streak: getLiveDayStreak(player.id, sessions, latestDate) }))
    .filter((player) => player.streak >= 2)
    .sort((left, right) => right.streak - left.streak);
};

export const getLatestDayHeatRun = (
  sessions,
  players,
  date = getLatestSessionDate(sessions),
) => {
  if (!date || !sessions.length || !players.length) {
    return null;
  }

  const daySessions = [...sessions]
    .filter((session) => session.date === date)
    .sort(compareSessionsAsc);

  if (!daySessions.length) {
    return null;
  }

  const playerIndex = buildPlayerIndex(players);
  const bestWinRun = getLongestWinRun(daySessions, playerIndex);

  if (!bestWinRun?.player || bestWinRun.length < 2) {
    return null;
  }

  return {
    id: bestWinRun.player.id,
    username: bestWinRun.player.username,
    player: bestWinRun.player,
    streak: bestWinRun.length,
    start: bestWinRun.start,
    end: bestWinRun.end,
    date,
  };
};

export const getDayRecap = (date, sessions, players) => {
  const daySessions = [...sessions]
    .filter((session) => session.date === date)
    .sort(compareSessionsAsc);
  if (!daySessions.length) {
    return null;
  }

  const totalKills = daySessions.reduce(
    (sum, session) =>
      sum + Object.values(session.kills || {}).reduce((killsSum, kills) => killsSum + kills, 0),
    0,
  );
  const uniquePlayers = [...new Set(daySessions.flatMap((session) => session.attendees || []))];
  const winMap = {};
  daySessions.forEach((session) => {
    if (session.winner) {
      winMap[session.winner] = (winMap[session.winner] || 0) + 1;
    }
  });

  const sortedWinnerEntries = sortWinLeaderEntries(
    Object.entries(winMap).map(([pid, wins]) => ({
      pid,
      wins,
      kills: daySessions.reduce((sum, session) => sum + (session.kills?.[pid] || 0), 0),
    })),
    players,
    (entry) => entry.wins,
    (entry) => entry.kills,
  );
  const topWinnerEntry = sortedWinnerEntries[0] || null;

  let killKingValue = 0;
  daySessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([, kills]) => {
      if (kills > killKingValue) {
        killKingValue = kills;
      }
    });
  });

  const killKingsList = [];
  daySessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      if (kills === killKingValue && killKingValue > 0 && !killKingsList.find((item) => item.pid === pid)) {
        killKingsList.push({
          pid,
          k: kills,
          sid: session.id,
          player: players.find((player) => player.id === pid),
        });
      }
    });
  });

  const sortedKillKingsList = sortKillKingEntries(killKingsList, players);
  const killKing = sortedKillKingsList[0] || { pid: "", k: 0, sid: "", player: null };
  const winnersList = sortedWinnerEntries.map(({ pid, wins }) => ({
    pid,
    wins,
    player: players.find((player) => player.id === pid),
  }));

  return {
    date,
    sessions: daySessions,
    totalKills,
    uniquePlayers: uniquePlayers.length,
    topWinner: topWinnerEntry
      ? {
          pid: topWinnerEntry.pid,
          wins: topWinnerEntry.wins,
          player: players.find((player) => player.id === topWinnerEntry.pid),
        }
      : null,
    killKing: { ...killKing, player: killKing.player || null },
    killKingsList: sortedKillKingsList,
    lobbies: daySessions.length,
    winnersList,
  };
};

export const getLatestDayConsequences = (
  sessions,
  players,
  date = getLatestSessionDate(sessions),
) => {
  if (!date || !sessions.length || !players.length) {
    return null;
  }

  const latestSessions = [...sessions]
    .filter((session) => session.date === date)
    .sort(compareSessionsAsc);
  if (!latestSessions.length) {
    return null;
  }

  const playerIndex = buildPlayerIndex(players);
  const getPlayer = (playerId) => getPlayerById(playerIndex, playerId);
  const zeroStats = { wins: 0, kills: 0, appearances: 0 };
  const byWins = (left, right) => right.wins - left.wins || right.kills - left.kills;
  const byKills = (left, right) => right.kills - left.kills || right.wins - left.wins;
  const findTotals = (rows, playerId) =>
    rows.find((row) => row.id === playerId) || zeroStats;
  const pushConsequence = (bucket, entry) => {
    if (!entry?.text || bucket.some((item) => item.text === entry.text)) {
      return;
    }
    bucket.push(entry);
  };

  const latestTotals = allStats(players, latestSessions).filter(
    (player) => player.appearances > 0,
  );
  const priorSessions = sessions.filter((session) => session.date < date);
  const beforeTotals = allStats(players, priorSessions).filter(
    (player) => player.appearances > 0,
  );
  const afterTotals = allStats(players, sessions).filter(
    (player) => player.appearances > 0,
  );

  const dayWinnerMap = {};
  latestSessions.forEach((session) => {
    if (session.winner) {
      dayWinnerMap[session.winner] = (dayWinnerMap[session.winner] || 0) + 1;
    }
  });

  const dayWinners = Object.entries(dayWinnerMap)
    .map(([pid, wins]) => ({
      pid,
      wins,
      player: getPlayer(pid),
      kills: findTotals(latestTotals, pid).kills,
    }))
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);

  const topWinCount = dayWinners[0]?.wins || 0;
  const topWinners = topWinCount > 0
    ? dayWinners.filter((entry) => entry.wins === topWinCount)
    : [];

  const topKillerRow = [...latestTotals].sort(byKills)[0] || null;
  const topKillerPlayer = topKillerRow ? getPlayer(topKillerRow.id) : null;
  const topKiller = topKillerRow && topKillerPlayer
    ? { ...topKillerRow, player: topKillerPlayer }
    : null;
  const topKillCount = topKiller?.kills || 0;
  const topKillers = topKillCount > 0
    ? [...latestTotals]
        .filter((row) => row.kills === topKillCount)
        .map((row) => ({
          ...row,
          player: getPlayer(row.id),
        }))
    : [];

  const zeroKillWinSession = latestSessions.find(
    (session) => session.winner && (session.kills?.[session.winner] || 0) === 0,
  ) || null;
  const zeroKillWin = zeroKillWinSession
    ? {
        session: zeroKillWinSession,
        player: getPlayer(zeroKillWinSession.winner),
      }
    : null;

  const reboundCandidates = latestSessions
    .map((session, index) => {
      if (!session.winner) {
        return null;
      }
      const winner = getPlayer(session.winner);
      if (!winner) {
        return null;
      }
      const earlierDaySessions = latestSessions
        .slice(0, index)
        .filter((entry) => entry.attendees?.includes(winner.id));
      const earlierDayWins = earlierDaySessions.filter(
        (entry) => entry.winner === winner.id,
      ).length;
      const kills = session.kills?.[winner.id] || 0;
      if (earlierDaySessions.length < 4 || earlierDayWins > 0 || kills < 3) {
        return null;
      }
      return {
        player: winner,
        session,
        kills,
        priorDayLobbies: earlierDaySessions.length,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.priorDayLobbies - left.priorDayLobbies || right.kills - left.kills,
    );
  const reboundWin = reboundCandidates[0] || null;

  const legendCrossers = [...afterTotals]
    .filter((player) => {
      const before = findTotals(beforeTotals, player.id);
      return before.wins < 10 && player.wins >= 10;
    })
    .sort(byWins)
    .map((player) => ({ player: getPlayer(player.id), wins: player.wins }));

  const killCrossers = [...afterTotals]
    .filter((player) => {
      const before = findTotals(beforeTotals, player.id);
      return before.kills < 100 && player.kills >= 100;
    })
    .sort(byKills)
    .map((player) => ({ player: getPlayer(player.id), kills: player.kills }));

  const beforeRanks = [...beforeTotals].sort(byWins);
  const afterRanks = [...afterTotals].sort(byWins);
  const getRankFor = (rows, playerId) => rows.findIndex((row) => row.id === playerId) + 1;
  const topFiveShift = afterRanks
    .map((player) => ({
      player: getPlayer(player.id),
      wins: player.wins,
      beforeRank: getRankFor(beforeRanks, player.id),
      afterRank: getRankFor(afterRanks, player.id),
    }))
    .find(
      (entry) =>
        entry.afterRank > 0 && entry.afterRank <= 5 && entry.beforeRank > entry.afterRank,
    ) || null;

  let biggestClimber = afterRanks
    .map((player) => ({
      player: getPlayer(player.id),
      beforeRank: getRankFor(beforeRanks, player.id),
      afterRank: getRankFor(afterRanks, player.id),
      dayWins: dayWinnerMap[player.id] || 0,
      dayKills: findTotals(latestTotals, player.id).kills,
    }))
    .filter(
      (entry) =>
        entry.player &&
        entry.afterRank > 0 &&
        entry.beforeRank > 0 &&
        entry.beforeRank > entry.afterRank,
    )
    .sort(
      (left, right) =>
        right.beforeRank -
          right.afterRank -
          (left.beforeRank - left.afterRank) ||
        right.dayWins - left.dayWins ||
        right.dayKills - left.dayKills,
    )[0] || null;

  if (biggestClimber?.player) {
    const beforeTotalsForClimber = findTotals(beforeTotals, biggestClimber.player.id);
    const afterTotalsForClimber = findTotals(afterTotals, biggestClimber.player.id);
    const climbCopy = buildAllTimeClimbCopy({
      player: biggestClimber.player,
      afterRank: biggestClimber.afterRank,
      beforeWins: beforeTotalsForClimber.wins,
      afterWins: afterTotalsForClimber.wins,
    });
    biggestClimber = {
      ...biggestClimber,
      beforeWins: beforeTotalsForClimber.wins,
      afterWins: afterTotalsForClimber.wins,
      line: climbCopy.line,
      shortLine: climbCopy.shortLine,
    };
  }

  const buildRivalPressure = (leftName, rightName) => {
    const leftPlayer = players.find((player) => player.username === leftName) || null;
    const rightPlayer = players.find((player) => player.username === rightName) || null;
    if (!leftPlayer || !rightPlayer) {
      return null;
    }

    const pair = (rows) =>
      rows.find(
        (entry) =>
          [entry.p1, entry.p2].includes(leftPlayer.id) &&
          [entry.p1, entry.p2].includes(rightPlayer.id),
      );

    const beforePair = pair(getRivals(priorSessions));
    const afterPair = pair(getRivals(sessions));
    if (!afterPair) {
      return null;
    }

    const leftWins = afterPair.p1 === leftPlayer.id ? afterPair.p1wins : afterPair.p2wins;
    const rightWins = afterPair.p1 === rightPlayer.id ? afterPair.p1wins : afterPair.p2wins;
    const leftBefore = beforePair
      ? beforePair.p1 === leftPlayer.id
        ? beforePair.p1wins
        : beforePair.p2wins
      : 0;
    const rightBefore = beforePair
      ? beforePair.p1 === rightPlayer.id
        ? beforePair.p1wins
        : beforePair.p2wins
      : 0;
    const leader = leftWins >= rightWins ? leftPlayer : rightPlayer;
    const trailer = leader.id === leftPlayer.id ? rightPlayer : leftPlayer;
    const beforeGap = Math.abs(leftBefore - rightBefore);
    const afterGap = Math.abs(leftWins - rightWins);

    return {
      leftPlayer,
      rightPlayer,
      leader,
      trailer,
      total: afterPair.total,
      totalDelta: afterPair.total - (beforePair?.total || 0),
      leaderWins: Math.max(leftWins, rightWins),
      trailerWins: Math.min(leftWins, rightWins),
      leaderDelta: leader.id === leftPlayer.id ? leftWins - leftBefore : rightWins - rightBefore,
      beforeGap,
      afterGap,
      tightened: afterPair.total > (beforePair?.total || 0) && afterGap < beforeGap,
    };
  };

  const latestDateRecap = getDayRecap(date, sessions, players);
  const bestRun = getLongestWinRun(latestSessions, playerIndex);
  const priorHotStreaks = getLiveStreaks(priorSessions, players);
  const brokenStreak = priorHotStreaks
    .map((entry) => {
      const playedToday = latestSessions.some((session) => session.attendees?.includes(entry.id));
      const winsToday = dayWinnerMap[entry.id] || 0;
      if (!playedToday || winsToday > 0) {
        return null;
      }
      return entry;
    })
    .filter(Boolean)
    .sort((left, right) => right.streak - left.streak)[0] || null;

  const activeSeason = SEASONS.find(
    (season) => date >= season.start && date <= season.end,
  ) || null;
  const seasonSessions = activeSeason
    ? filterSessionsBySeason(sessions, activeSeason.id).filter((session) => session.date <= date)
    : [];
  const seasonBeforeSessions = seasonSessions.filter((session) => session.date < date);
  const seasonAfterRanks = allStats(players, seasonSessions)
    .filter((player) => player.appearances > 0)
    .sort(byWins);
  const seasonBeforeTotals = allStats(players, seasonBeforeSessions)
    .filter((player) => player.appearances > 0);

  const consequences = [];
  const seasonLeader = seasonAfterRanks[0] || null;
  const seasonRunner = seasonAfterRanks[1] || null;
  if (activeSeason && seasonLeader && seasonRunner) {
    const leaderPlayer = getPlayer(seasonLeader.id);
    const runnerPlayer = getPlayer(seasonRunner.id);
    const beforeGap =
      findTotals(seasonBeforeTotals, seasonLeader.id).wins -
      findTotals(seasonBeforeTotals, seasonRunner.id).wins;
    const afterGap = seasonLeader.wins - seasonRunner.wins;
    const leaderDayWins = dayWinnerMap[seasonLeader.id] || 0;
    if (leaderPlayer && runnerPlayer && leaderDayWins > 0 && afterGap >= beforeGap) {
      pushConsequence(consequences, {
        type: "kept-lead",
        icon: "👑",
        color: "#FFD700",
        priority: 96,
        text:
          afterGap > beforeGap
            ? `${leaderPlayer.username} kept the ${activeSeason.name} lead and pushed the gap over ${runnerPlayer.username} to ${afterGap} wins.`
            : `${leaderPlayer.username} kept the ${activeSeason.name} lead with ${leaderDayWins} win${leaderDayWins===1?"":"s"} on the day.`,
        shortText:
          afterGap > beforeGap
            ? `${leaderPlayer.username} kept the lead at +${afterGap}.`
            : `${leaderPlayer.username} kept the lead.`,
      });
    }
  }

  if (biggestClimber?.player) {
    pushConsequence(consequences, {
      type: "climbed",
      icon: "📈",
      color: "#00E5FF",
      priority: 95,
      text: biggestClimber.line,
      shortText: biggestClimber.shortLine,
    });
  }

  if (legendCrossers.length || killCrossers.length) {
    const legendLine = legendCrossers.length
      ? `${joinHumanNames(
          legendCrossers.map((entry) => entry.player?.username || "Unknown"),
        )} ${legendCrossers.length === 1 ? "reached" : "reached"} Legend`
      : "";
    const killLine = killCrossers[0]
      ? `${killCrossers[0].player?.username || "Unknown"} crossed ${killCrossers[0].kills} kills`
      : "";
    pushConsequence(consequences, {
      type: "benchmark",
      icon: "🏁",
      color: "#FFAB40",
      priority: 94,
      text: [legendLine, killLine].filter(Boolean).join(". ")+".",
      shortText: [legendLine, killLine].filter(Boolean).join(". ")+".",
    });
  }

  const teriqHackqamPressure = buildRivalPressure("Teriqstp", "Hackqam");
  const mekulaTeriqPressure = buildRivalPressure("MekulaGG", "Teriqstp");
  if (teriqHackqamPressure?.tightened) {
    pushConsequence(consequences, {
      type: "tightened-rivalry",
      icon: "⚔️",
      color: "#FF4D8F",
      priority: 92,
      text: `${teriqHackqamPressure.leftPlayer.username} and ${teriqHackqamPressure.rightPlayer.username} tightened their rivalry to ${teriqHackqamPressure.leaderWins}-${teriqHackqamPressure.trailerWins} across ${teriqHackqamPressure.total} top-two clashes.`,
      shortText: `${teriqHackqamPressure.leftPlayer.username} and ${teriqHackqamPressure.rightPlayer.username} tightened the rivalry.`,
    });
  } else if (mekulaTeriqPressure?.totalDelta > 0) {
    pushConsequence(consequences, {
      type: "rivalry-pressure",
      icon: "⚔️",
      color: "#FF4D8F",
      priority: 88,
      text: `${mekulaTeriqPressure.leader.username} kept the edge over ${mekulaTeriqPressure.trailer.username} at ${mekulaTeriqPressure.leaderWins}-${mekulaTeriqPressure.trailerWins} across ${mekulaTeriqPressure.total} top-two clashes.`,
      shortText: `${mekulaTeriqPressure.leader.username} kept the duel edge.`,
    });
  }

  if (reboundWin) {
    pushConsequence(consequences, {
      type: "broke-drought",
      icon: "🔁",
      color: "#00E5FF",
      priority: 90,
      text: `${reboundWin.player.username} broke a ${reboundWin.priorDayLobbies}-lobby dry spell and closed ${getLobbyLabel(reboundWin.session.id)} with ${reboundWin.kills} kills.`,
      shortText: `${reboundWin.player.username} broke a ${reboundWin.priorDayLobbies}-lobby dry spell.`,
    });
  }

  if (bestRun?.player && bestRun.length >= 3) {
    pushConsequence(consequences, {
      type: "extended-streak",
      icon: "🔥",
      color: "#FF6B35",
      priority: 89,
      text: `${bestRun.player.username} extended a ${bestRun.length}-lobby streak from ${getLobbyLabel(bestRun.start.id)} through ${getLobbyLabel(bestRun.end.id)}.`,
      shortText: `${bestRun.player.username} extended a ${bestRun.length}-lobby streak.`,
    });
  }

  if (brokenStreak) {
    pushConsequence(consequences, {
      type: "broke-streak",
      icon: "🛑",
      color: "#FFD700",
      priority: 83,
      text: `${brokenStreak.username} lost a ${brokenStreak.streak}-win run as soon as the new day opened.`,
      shortText: `${brokenStreak.username} lost a ${brokenStreak.streak}-win run.`,
    });
  }

  if ((latestDateRecap?.winnersList?.length || 0) >= 4) {
    pushConsequence(consequences, {
      type: "opened-room-up",
      icon: "🪟",
      color: "#C77DFF",
      priority: 84,
      text: `${latestDateRecap.winnersList.length} different winners kept the room open across ${latestSessions.length} lobbies.`,
      shortText: `${latestDateRecap.winnersList.length} winners kept the room open.`,
    });
  }

  if (zeroKillWin?.player) {
    pushConsequence(consequences, {
      type: "zero-kill-win",
      icon: "🫥",
      color: "#C77DFF",
      priority: 82,
      text: `${zeroKillWin.player.username} stole ${getLobbyLabel(zeroKillWin.session.id)} without a kill.`,
      shortText: `${zeroKillWin.player.username} stole a zero-kill win.`,
    });
  }

  consequences.sort((left, right) => right.priority - left.priority);

  return {
    date,
    latestSessions,
    topWinCount,
    topWinners,
    topKiller,
    topKillers,
    zeroKillWin,
    reboundWin,
    legendCrossers,
    killCrossers,
    topFiveShift,
    biggestClimber,
    mekulaTeriqPressure,
    teriqHackqamPressure,
    bestRun,
    brokenStreak,
    activeSeason,
    consequences,
    summary: consequences.slice(0, 3).map((entry) => entry.shortText || entry.text),
  };
};

const joinHumanNames = (names) => {
  const cleaned = names.filter(Boolean);
  if (!cleaned.length) {
    return "";
  }
  if (cleaned.length === 1) {
    return cleaned[0];
  }
  if (cleaned.length === 2) {
    return `${cleaned[0]} and ${cleaned[1]}`;
  }
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
};

export const formatOrdinal = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }
  if (value % 10 === 1) {
    return `${value}st`;
  }
  if (value % 10 === 2) {
    return `${value}nd`;
  }
  if (value % 10 === 3) {
    return `${value}rd`;
  }
  return `${value}th`;
};

const getPlacementIndex = (session, playerId) =>
  (session.placements || session.attendees || []).indexOf(playerId);

const getLobbyLabel = (sessionId = "") => {
  const lobbyNumber = parseSessionIdNumber(sessionId);
  return `Lobby ${lobbyNumber || sessionId}`;
};

const buildDayPlayerStats = (daySessions, playerIndex) => {
  const stats = {};
  const ensure = (playerId) => {
    if (!stats[playerId]) {
      stats[playerId] = {
        id: playerId,
        player: playerIndex[playerId] || null,
        appearances: 0,
        wins: 0,
        kills: 0,
        podiums: 0,
        top2: 0,
        placements: [],
        bestFinish: Infinity,
      };
    }
    return stats[playerId];
  };

  daySessions.forEach((session) => {
    (session.attendees || []).forEach((playerId) => {
      ensure(playerId).appearances += 1;
    });

    (session.placements || session.attendees || []).forEach((playerId, index) => {
      const row = ensure(playerId);
      const finish = index + 1;
      row.placements.push(finish);
      row.bestFinish = Math.min(row.bestFinish, finish);
      if (index < 3) {
        row.podiums += 1;
      }
      if (index < 2) {
        row.top2 += 1;
      }
    });

    if (session.winner) {
      ensure(session.winner).wins += 1;
    }

    Object.entries(session.kills || {}).forEach(([playerId, kills]) => {
      ensure(playerId).kills += Number(kills) || 0;
    });
  });

  return Object.values(stats).filter((row) => row.appearances > 0);
};

const getLongestPlacementRun = (daySessions, playerId, limit = 3) => {
  let currentLength = 0;
  let currentStart = null;
  let best = null;

  daySessions.forEach((session) => {
    const placementIndex = getPlacementIndex(session, playerId);
    const onRun = placementIndex !== -1 && placementIndex < limit;

    if (onRun) {
      currentLength += 1;
      currentStart = currentStart || session;
      if (!best || currentLength > best.length) {
        best = {
          length: currentLength,
          start: currentStart,
          end: session,
        };
      }
      return;
    }

    currentLength = 0;
    currentStart = null;
  });

  return best;
};

const getLongestWinRun = (daySessions, playerIndex) => {
  let best = null;

  Object.values(playerIndex).forEach((player) => {
    const playedSessions = daySessions.filter((session) =>
      session.attendees?.includes(player.id),
    );
    let currentLength = 0;
    let currentStart = null;
    let currentKills = 0;

    playedSessions.forEach((session) => {
      if (session.winner === player.id) {
        currentLength += 1;
        currentStart = currentStart || session;
        currentKills += Number(session.kills?.[player.id] || 0);

        if (
          currentLength >= 2 &&
          (
            !best ||
            currentLength > best.length ||
            (currentLength === best.length && currentKills > best.totalKills) ||
            (
              currentLength === best.length &&
              currentKills === best.totalKills &&
              best.end &&
              compareSessionsAsc(best.end, session) < 0
            )
          )
        ) {
          best = {
            player,
            length: currentLength,
            start: currentStart,
            end: session,
            totalKills: currentKills,
          };
        }
      } else {
        currentLength = 0;
        currentStart = null;
        currentKills = 0;
      }
    });
  });

  return best;
};

const buildPlacementRankMap = (players, sessions, sort = "wins") => {
  const ranked = allStats(players, sessions)
    .filter((player) => player.appearances > 0)
    .sort((left, right) => {
      if (sort === "kills") {
        return right.kills - left.kills || right.wins - left.wins;
      }
      return right.wins - left.wins || right.kills - left.kills;
    });

  return Object.fromEntries(ranked.map((player, index) => [player.id, index + 1]));
};

const buildAllTimeClimbCopy = ({
  player,
  afterRank,
  beforeWins,
  afterWins,
}) => {
  if (!player) {
    return { line: "", shortLine: "" };
  }

  if (afterWins > beforeWins) {
    return {
      line:
        afterRank <= 5
          ? `${player.username} climbed into ${formatOrdinal(afterRank)} on the all-time wins table.`
          : `${player.username} climbed to ${formatOrdinal(afterRank)} on the all-time wins table.`,
      shortLine: `${player.username} climbed to ${formatOrdinal(afterRank)} on the wins table.`,
    };
  }

  return {
    line: `${player.username} moved up to ${formatOrdinal(afterRank)} on the all-time board on tiebreaks.`,
    shortLine: `${player.username} moved up on the all-time board.`,
  };
};

export const getDayStorylines = (date, sessions, players) => {
  const daySessions = [...sessions]
    .filter((session) => session.date === date)
    .sort(compareSessionsAsc);
  if (!daySessions.length) {
    return [];
  }

  const playerIndex = buildPlayerIndex(players);
  const hostPlayer = players.find((player) => player.host) || null;
  const dayStats = buildDayPlayerStats(daySessions, playerIndex);
  const dayStatsMap = Object.fromEntries(dayStats.map((row) => [row.id, row]));
  const byWins = [...dayStats].sort(
    (left, right) => right.wins - left.wins || right.kills - left.kills,
  );
  const byKills = [...dayStats].sort(
    (left, right) => right.kills - left.kills || right.wins - left.wins,
  );
  const storylines = [];
  const pushStoryline = (text) => {
    if (!text || storylines.includes(text)) {
      return;
    }
    storylines.push(text);
  };

  const topWinCount = byWins[0]?.wins || 0;
  const topKillCount = byKills[0]?.kills || 0;
  const topWinners = byWins.filter((row) => row.wins === topWinCount && topWinCount > 0);
  const topKillers = byKills.filter((row) => row.kills === topKillCount && topKillCount > 0);

  if (topWinCount > 0 && topKillCount > 0) {
    if (topWinners.length === 1 && topKillers.length === 1 && topWinners[0].id === topKillers[0].id) {
      pushStoryline(
        `${topWinners[0].player?.username || "Unknown"} owned both the win column with ${topWinCount} wins and the damage race with ${topKillCount} kills.`,
      );
    } else if (topWinners.length === 1 && topKillers.length === 1) {
      pushStoryline(
        `${topWinners[0].player?.username || "Unknown"} owned the win column with ${topWinCount} wins, but ${topKillers[0].player?.username || "Unknown"} owned the damage race with ${topKillCount} kills.`,
      );
    } else if (topWinners.length > 1 && topKillers.length === 1) {
      pushStoryline(
        `${joinHumanNames(topWinners.map((row) => row.player?.username || "Unknown"))} split the win column at ${topWinCount} each, but ${topKillers[0].player?.username || "Unknown"} owned the damage race with ${topKillCount} kills.`,
      );
    } else if (topWinners.length === 1 && topKillers.length > 1) {
      pushStoryline(
        `${topWinners[0].player?.username || "Unknown"} owned the win column with ${topWinCount} wins, while ${joinHumanNames(topKillers.map((row) => row.player?.username || "Unknown"))} tied on damage at ${topKillCount} kills each.`,
      );
    } else {
      pushStoryline(
        `${joinHumanNames(topWinners.map((row) => row.player?.username || "Unknown"))} split the win column at ${topWinCount} each, and ${joinHumanNames(topKillers.map((row) => row.player?.username || "Unknown"))} matched the damage line at ${topKillCount} kills each.`,
      );
    }
  }

  if (hostPlayer && dayStatsMap[hostPlayer.id]) {
    const hostStats = dayStatsMap[hostPlayer.id];
    const hostPodiumRun = getLongestPlacementRun(daySessions, hostPlayer.id, 3);
    if (hostPodiumRun?.length >= 4) {
      pushStoryline(
        `${hostPlayer.username} put together a ${hostPodiumRun.length}-lobby podium streak from ${getLobbyLabel(hostPodiumRun.start.id)} through ${getLobbyLabel(hostPodiumRun.end.id)}.`,
      );
    } else if (hostStats.top2 >= Math.ceil(daySessions.length / 2)) {
      pushStoryline(
        `${hostPlayer.username} stayed in the fight all day with ${hostStats.top2} top-two finishes in ${daySessions.length} lobbies.`,
      );
    } else if (hostStats.podiums >= Math.ceil(daySessions.length * 0.6)) {
      pushStoryline(
        `${hostPlayer.username} kept the room under pressure with ${hostStats.podiums} podiums in ${daySessions.length} lobbies.`,
      );
    }
  }

  const sharedHeatRun =
    getLatestDayHeatRun(sessions, players, date) ||
    (() => {
      const fallbackRun = getLongestWinRun(daySessions, playerIndex);
      if (!fallbackRun?.player) {
        return null;
      }
      return {
        player: fallbackRun.player,
        streak: fallbackRun.length,
        start: fallbackRun.start,
        end: fallbackRun.end,
      };
    })();

  if (sharedHeatRun?.player) {
    pushStoryline(
      `${sharedHeatRun.player.username} had the cleanest run of the day with ${sharedHeatRun.streak} straight wins from ${getLobbyLabel(sharedHeatRun.start.id)} through ${getLobbyLabel(sharedHeatRun.end.id)}.`,
    );
  }

  if (hostPlayer && dayStatsMap[hostPlayer.id] && byWins[0] && byWins[0].id !== hostPlayer.id) {
    let hostBetter = 0;
    let leaderBetter = 0;
    let sharedLobbies = 0;
    daySessions.forEach((session) => {
      if (!session.attendees?.includes(hostPlayer.id) || !session.attendees?.includes(byWins[0].id)) {
        return;
      }
      const hostPlacement = getPlacementIndex(session, hostPlayer.id);
      const leaderPlacement = getPlacementIndex(session, byWins[0].id);
      if (hostPlacement === -1 || leaderPlacement === -1) {
        return;
      }
      sharedLobbies += 1;
      if (hostPlacement < leaderPlacement) {
        hostBetter += 1;
      } else if (leaderPlacement < hostPlacement) {
        leaderBetter += 1;
      }
    });

    if (sharedLobbies >= 3 && (hostBetter || leaderBetter)) {
      const hostKills = dayStatsMap[hostPlayer.id].kills;
      const leaderKills = dayStatsMap[byWins[0].id]?.kills || 0;
      if (leaderBetter > hostBetter && hostKills > leaderKills) {
        pushStoryline(
          `${byWins[0].player?.username || "Unknown"} beat ${hostPlayer.username} ${leaderBetter}-${hostBetter} on placement in their shared lobbies, but ${hostPlayer.username} still won the damage race ${hostKills}-${leaderKills}.`,
        );
      } else if (hostBetter > leaderBetter && leaderKills > hostKills) {
        pushStoryline(
          `${hostPlayer.username} beat ${byWins[0].player?.username || "Unknown"} ${hostBetter}-${leaderBetter} on placement in their shared lobbies, but ${byWins[0].player?.username || "Unknown"} still kept the heavier damage line at ${leaderKills}-${hostKills}.`,
        );
      } else {
        const leaderName = leaderBetter >= hostBetter
          ? byWins[0].player?.username || "Unknown"
          : hostPlayer.username;
        const trailerName = leaderBetter >= hostBetter
          ? hostPlayer.username
          : byWins[0].player?.username || "Unknown";
        const leaderScore = Math.max(leaderBetter, hostBetter);
        const trailerScore = Math.min(leaderBetter, hostBetter);
        pushStoryline(
          `${leaderName} had the better placement line over ${trailerName} at ${leaderScore}-${trailerScore} across their shared lobbies.`,
        );
      }
    }
  }

  const zeroKillWins = daySessions
    .filter((session) => session.winner && !Number(session.kills?.[session.winner] || 0))
    .map((session) => ({
      player: playerIndex[session.winner] || null,
      sid: session.id,
    }));
  if (zeroKillWins.length === 1) {
    pushStoryline(
      `${zeroKillWins[0].player?.username || "Unknown"} stole ${getLobbyLabel(zeroKillWins[0].sid)} without landing a kill.`,
    );
  } else if (zeroKillWins.length > 1) {
    const zeroKillSummary =
      zeroKillWins.length === 2
        ? `${joinHumanNames(zeroKillWins.slice(0, 3).map((entry) => `${entry.player?.username || "Unknown"} in ${getLobbyLabel(entry.sid)}`))} both closed wins without landing a kill.`
        : `${joinHumanNames(zeroKillWins.slice(0, 3).map((entry) => `${entry.player?.username || "Unknown"} in ${getLobbyLabel(entry.sid)}`))} all closed wins without landing a kill.`;
    pushStoryline(
      zeroKillSummary,
    );
  }

  let topGameKills = 0;
  const topGames = [];
  daySessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([playerId, kills]) => {
      const killCount = Number(kills) || 0;
      if (killCount > topGameKills) {
        topGameKills = killCount;
        topGames.length = 0;
        topGames.push({ player: playerIndex[playerId] || null, sid: session.id, kills: killCount });
      } else if (
        killCount > 0 &&
        killCount === topGameKills &&
        !topGames.find((entry) => entry.player?.id === playerId)
      ) {
        topGames.push({ player: playerIndex[playerId] || null, sid: session.id, kills: killCount });
      }
    });
  });

  if (topGameKills > 0) {
    if (topGameKills <= 3) {
      pushStoryline(
        `No one broke the room open on raw damage. The top single-lobby count was ${topGameKills}, shared by ${joinHumanNames(topGames.map((entry) => entry.player?.username || "Unknown"))}.`,
      );
    } else if (topGames.length === 1) {
      pushStoryline(
        `${topGames[0].player?.username || "Unknown"} posted the top single-lobby line with ${topGameKills} kills in ${getLobbyLabel(topGames[0].sid)}.`,
      );
    } else {
      pushStoryline(
        `${joinHumanNames(topGames.map((entry) => entry.player?.username || "Unknown"))} matched the top single-lobby line at ${topGameKills} kills.`,
      );
    }
  }

  const priorSessions = sessions.filter((session) => session.date < date);
  const winRankBefore = buildPlacementRankMap(players, priorSessions, "wins");
  const winRankAfter = buildPlacementRankMap(players, sessions, "wins");
  const killRankBefore = buildPlacementRankMap(players, priorSessions, "kills");
  const killRankAfter = buildPlacementRankMap(players, sessions, "kills");
  const debutLines = [];
  const milestoneLines = [];

  dayStats.forEach((row) => {
    const beforeStats = getStats(row.id, priorSessions);
    const afterStats = getStats(row.id, sessions);
    if (beforeStats.appearances === 0 && afterStats.appearances > 0) {
      debutLines.push(
        `${row.player?.username || "Unknown"} opened a new file with ${afterStats.appearances} lobbies, ${afterStats.kills} kills, and a best finish of ${formatOrdinal(row.bestFinish)}.`,
      );
      return;
    }

    const triggered = [];
    [1, 3, 6, 10, 25, 50, 100].forEach((milestone) => {
      if (beforeStats.wins < milestone && afterStats.wins >= milestone) {
        triggered.push(`${milestone} all-time wins`);
      }
    });
    [50, 100, 150, 200, 500, 600].forEach((milestone) => {
      if (beforeStats.kills < milestone && afterStats.kills >= milestone) {
        triggered.push(`${milestone} all-time kills`);
      }
    });

    if (winRankAfter[row.id] <= 5 && (winRankBefore[row.id] || Infinity) > 5) {
      triggered.push(`the top 5 all-time wins`);
    }
    if (killRankAfter[row.id] <= 5 && (killRankBefore[row.id] || Infinity) > 5) {
      triggered.push(`the top 5 all-time kills`);
    }

    if (triggered.length) {
      const playerName = row.player?.username || "Unknown";
      const firstWinOnly =
        triggered.length === 1 && triggered[0] === "1 all-time wins";

      milestoneLines.push(
        firstWinOnly
          ? `${playerName} earned a first all-time win.`
          : `${playerName} crossed into ${joinHumanNames(triggered)}.`,
      );
    }
  });

  debutLines.forEach(pushStoryline);
  milestoneLines.slice(0, 2).forEach(pushStoryline);

  return storylines.slice(0, 7);
};

export const getMilestones = (playerId, sessions) => {
  const stats = getStats(playerId, sessions);
  const alerts = [];

  for (const [milestone, label] of [
    [50, "50 Kills"],
    [100, "100 Kills"],
    [150, "150 Kills"],
    [200, "200 Kills"],
  ]) {
    const gap = milestone - stats.kills;
    if (gap > 0 && gap <= 15) {
      alerts.push({
        icon: "💀",
        text: `${gap} kill${gap === 1 ? "" : "s"} from ${label}`,
        gap,
        color: "#FF4D8F",
      });
      break;
    }
  }

  for (const [milestone, rank, icon] of [
    [10, "Legend", "⚡"],
    [6, "Veteran", "🔥"],
    [3, "Gunslinger", "⭐"],
    [1, "Rising Star", "🌟"],
  ]) {
    const gap = milestone - stats.wins;
    if (gap > 0 && gap <= 3) {
      alerts.push({
        icon,
        text: `${gap} win${gap === 1 ? "" : "s"} away from ${rank}`,
        gap,
        color: "#C77DFF",
      });
      break;
    }
  }

  const consistency = getConsistency(playerId, sessions);
  if (consistency >= 45 && consistency < 50 && stats.appearances >= 5) {
    alerts.push({
      icon: "🧱",
      text: `${50 - consistency}% consistency away from top-half badge`,
      gap: 1,
      color: "#00FF94",
    });
  }

  const carryScore = getCarryScore(playerId, sessions);
  if (carryScore >= 1 && carryScore < 5) {
    const gap = 5 - carryScore;
    alerts.push({
      icon: "🎖️",
      text: `${gap} more carry win${gap === 1 ? "" : "s"}: proving it means doing the damage too`,
      gap,
      color: "#FF6B35",
    });
  }

  return alerts.slice(0, 2);
};

export const getBenchmark = (playerId, players, sessions) => {
  const sorted = allStats(players, sessions)
    .filter((player) => player.wins > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const currentIndex = sorted.findIndex((player) => player.id === playerId);
  if (currentIndex <= 0) {
    return null;
  }

  const currentPlayer = sorted[currentIndex];
  const target = sorted[currentIndex - 1];
  const targetPlayer = players.find((player) => player.id === target.id);
  if (!targetPlayer) {
    return null;
  }

  const winGap = target.wins - currentPlayer.wins;
  const killGap = target.kills - currentPlayer.kills;

  return {
    target: targetPlayer,
    rank: currentIndex + 1,
    winGap,
    killGap,
    sameWins: winGap === 0,
  };
};

export const getPlayerFileState = (
  playerId,
  players,
  sessions,
  {
    seasonId = SEASONS[SEASONS.length - 1]?.id || "all",
    formCount = 5,
  } = {},
) => {
  const playerIndex = buildPlayerIndex(players);
  const player = getPlayerById(playerIndex, playerId);
  if (!player) {
    return null;
  }

  const stats = getStats(playerId, sessions);
  const seasonSessions = seasonId === "all" ? sessions : getSeasonSessions(sessions, seasonId);
  const activeSeason = SEASONS.find((season) => season.id === seasonId) || null;
  const seasonName = activeSeason?.name || "current season";
  const seasonStats = getStats(playerId, seasonSessions);
  const rank = getRank(playerId, players, sessions);
  const level = getPlayerLevel(playerId, sessions);
  const form = getFormGuide(playerId, sessions, formCount);
  const recentWins = form.filter((entry) => entry.win).length;
  const drought = getDrought(playerId, sessions);
  const liveDayStreak = getLiveDayStreak(playerId, sessions);
  const carry = getCarryScore(playerId, sessions);
  const consistency = getConsistency(playerId, sessions);
  const lastSeen = getLastSeen(playerId, sessions);
  const benchmark = getBenchmark(playerId, players, sessions);
  const seasonBenchmark = (() => {
    const rows = allStats(players, seasonSessions)
      .filter((row) => row.appearances > 0)
      .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
    const currentIndex = rows.findIndex((row) => row.id === playerId);
    if (currentIndex <= 0) {
      return null;
    }
    const target = rows[currentIndex - 1];
    const targetPlayer = getPlayerById(playerIndex, target.id);
    return targetPlayer
      ? {
          target: targetPlayer,
          winGap: target.wins - seasonStats.wins,
          killGap: target.kills - seasonStats.kills,
          sameWins: target.wins === seasonStats.wins,
        }
      : null;
  })();

  const topRival = getRivals(sessions).find((entry) => entry.p1 === playerId || entry.p2 === playerId) || null;
  const rivalId = topRival ? (topRival.p1 === playerId ? topRival.p2 : topRival.p1) : null;
  const rival = rivalId ? getPlayerById(playerIndex, rivalId) : null;
  const playerRivalWins = topRival ? (topRival.p1 === playerId ? topRival.p1wins : topRival.p2wins) : 0;
  const rivalWins = topRival ? (topRival.p1 === playerId ? topRival.p2wins : topRival.p1wins) : 0;
  const duelGap = Math.abs(playerRivalWins - rivalWins);
  const rivalrySessions = topRival
    ? sessions.filter((session) => {
        const placements = session.placements || session.attendees || [];
        const [first, second] = placements;
        return first && second && [first, second].sort().join(":") === [topRival.p1, topRival.p2].sort().join(":");
      })
    : [];
  const playerSharedKills = rivalrySessions.reduce(
    (total, session) => total + (session.kills?.[playerId] || 0),
    0,
  );
  const rivalSharedKills = rivalId
    ? rivalrySessions.reduce((total, session) => total + (session.kills?.[rivalId] || 0), 0)
    : 0;
  const sharedKillGap = Math.abs(playerSharedKills - rivalSharedKills);
  const latestSharedNight = rivalrySessions.length
    ? [...rivalrySessions].sort(compareSessionsDesc)[0]
    : null;

  const currentState = (() => {
    if (stats.appearances === 0) {
      return {
        label: "UNOPENED FILE",
        line: "No official lobby has pinned this file down yet.",
        tone: "quiet",
        color: "#7B8CDE",
      };
    }
    if (liveDayStreak >= 3) {
      return {
        label: "RUNNING HOT",
        line: `${player.username} is carrying a ${liveDayStreak}-win latest-day run.`,
        tone: "hot",
        color: "#FF6B35",
      };
    }
    if (drought >= 6 && stats.wins > 0) {
      return {
        label: "UNDER QUIET PRESSURE",
        line: `${drought} lobbies without a win is leading the file right now.`,
        tone: "watch",
        color: "#FFD700",
      };
    }
    if (recentWins >= 3) {
      return {
        label: "FORM RISING",
        line: `${recentWins} wins in the last ${form.length} logged lobbies has the file moving.`,
        tone: "hot",
        color: "#00FF94",
      };
    }
    if (stats.wins === 0) {
      return {
        label: "FIRST CLOSE PENDING",
        line: "The first official win is still the whole case.",
        tone: "quiet",
        color: "#00E5FF",
      };
    }
    return {
      label: "LIVE FILE",
      line: "Enough history to matter, enough room left to change.",
      tone: "watch",
      color: "#00E5FF",
    };
  })();

  const liveRead = (() => {
    if (stats.appearances === 0) {
      return `${player.username} is still an unopened file waiting on a first official read.`;
    }
    if (liveDayStreak >= 3) {
      return `${player.username} is carrying the clearest hot run in the file right now.`;
    }
    if (drought >= 6 && stats.wins > 0) {
      return `${player.username} has history, but the next answer is the current file.`;
    }
    if (stats.wins >= 25) {
      return `${player.username} is established enough to be hunted.`;
    }
    if (stats.wins === 0) {
      return `${player.username} is still chasing the close that makes the file real.`;
    }
    if (recentWins >= 2) {
      return `${player.username} is giving the file fresh movement.`;
    }
    return `${player.username} is live enough to matter when the room opens.`;
  })();

  const pressureLine = (() => {
    if (seasonBenchmark) {
      if (seasonBenchmark.sameWins) {
        return {
          label: "NEXT BOARD MOVE",
          line: `${seasonBenchmark.target.username} is the next ${seasonName} file above on kills.`,
          detail: `${Math.max(seasonBenchmark.killGap, 0)} kill${Math.abs(seasonBenchmark.killGap) === 1 ? "" : "s"} changes that chase.`,
          tone: "season",
          color: "#00E5FF",
          targetId: seasonBenchmark.target.id,
          concrete: true,
        };
      }
      return {
        label: "NEXT BOARD MOVE",
        line: `${seasonBenchmark.target.username} is the next ${seasonName} file above on wins.`,
        detail: `${seasonBenchmark.winGap} win${seasonBenchmark.winGap === 1 ? "" : "s"} closes the gap.`,
        tone: "season",
        color: "#00E5FF",
        targetId: seasonBenchmark.target.id,
        concrete: true,
      };
    }
    if (benchmark) {
      if (benchmark.sameWins) {
        return {
          label: "NEXT ALL-TIME MOVE",
          line: `${benchmark.target.username} is the next all-time file above on kills.`,
          detail: `${Math.max(benchmark.killGap, 0)} kill${Math.abs(benchmark.killGap) === 1 ? "" : "s"} changes the order.`,
          tone: "board",
          color: "#FFD700",
          targetId: benchmark.target.id,
          concrete: true,
        };
      }
      return {
        label: "NEXT ALL-TIME MOVE",
        line: `${benchmark.target.username} is the next all-time file above on wins.`,
        detail: `${benchmark.winGap} win${benchmark.winGap === 1 ? "" : "s"} closes the gap.`,
        tone: "board",
        color: "#FFD700",
        targetId: benchmark.target.id,
        concrete: true,
      };
    }
    if (stats.wins === 0) {
      return {
        label: "FIRST BREAKTHROUGH",
        line: "One win changes the whole file from waiting to filed.",
        detail: "Until then, every late room carries extra weight.",
        tone: "quiet",
        color: "#00E5FF",
        targetId: null,
        concrete: true,
      };
    }
    return {
      label: "NEXT MARK",
      line: "The next clear change has to come from a filed room.",
      detail: "No official board move is close enough to call yet.",
      tone: "quiet",
      color: "#7B8CDE",
      targetId: null,
      concrete: false,
    };
  })();

  const conflict = rival
    ? {
        rivalId: rival.id,
        rivalName: rival.username,
        edgeLine:
          playerRivalWins === rivalWins
            ? `Dead level at ${playerRivalWins}-${rivalWins}.`
            : playerRivalWins > rivalWins
              ? `${player.username} owns the edge at ${playerRivalWins}-${rivalWins}.`
              : `${rival.username} owns the edge at ${rivalWins}-${playerRivalWins}.`,
        nextSharedNight:
          duelGap === 0
            ? "The next shared night breaks the tie."
            : duelGap === 1
              ? "The next shared night can flip the tone fast."
              : "The next shared night decides whether this stays a rivalry or becomes distance.",
        support:
          topRival.total >= 10
            ? `${topRival.total} meetings is enough history for the room to remember it.`
            : `${topRival.total} meetings on file, still forming but already useful.`,
        playerWins: playerRivalWins,
        rivalWins,
        meetings: topRival.total,
        playerSharedKills,
        rivalSharedKills,
        sharedKillLeader:
          playerSharedKills === rivalSharedKills
            ? "LEVEL"
            : playerSharedKills > rivalSharedKills
              ? player.username
              : rival.username,
        sharedWinLeader:
          playerRivalWins === rivalWins
            ? "LEVEL"
            : playerRivalWins > rivalWins
              ? player.username
              : rival.username,
        gapLine:
          duelGap <= 1
            ? "Duel edge is close enough to flip."
            : sharedKillGap <= 10
              ? "Damage gap is still close enough to matter."
              : "The gap needs a real answer.",
        latestSharedNight: latestSharedNight?.date || "",
        color: "#FF4D8F",
      }
    : {
        rivalId: null,
        rivalName: "No primary rival yet",
        edgeLine: "No duel has enough repeated shape to lead the file.",
        nextSharedNight: "The next repeated matchup can start writing that case.",
        support: "Conflict stays quiet until the official rooms make it real.",
        playerWins: 0,
        rivalWins: 0,
        meetings: 0,
        playerSharedKills: 0,
        rivalSharedKills: 0,
        sharedKillLeader: "NONE",
        sharedWinLeader: "NONE",
        gapLine: "No rivalry gap is live yet.",
        latestSharedNight: "",
        color: "#7B8CDE",
      };

  const recentFormRead = (() => {
    if (!form.length) return "No recent form line yet.";
    if (recentWins >= 4) return `${recentWins}/${form.length} recent wins. The file is hot enough to draw attention.`;
    if (recentWins >= 2) return `${recentWins}/${form.length} recent wins. The file is holding in the fight.`;
    if (recentWins === 0) return `0/${form.length} recent wins. The room is waiting for a response.`;
    return `${recentWins}/${form.length} recent wins. One result can change the read.`;
  })();

  const threat = (() => {
    if (stats.appearances === 0) return "No threat profile yet.";
    if (carry >= 3) return `${carry} carry wins means the crown and damage can land together.`;
    if (stats.biggestGame >= 6) return `${stats.biggestGame} kills is the ceiling. One loose lobby can get loud quickly.`;
    if (stats.kd >= 1.8 && stats.kills >= 20) return `${stats.kd} kills per lobby keeps pressure in the file even without a win.`;
    if (stats.winRate >= 30 && stats.appearances >= 8) return `${stats.winRate}% win rate says late-room conversion is the danger.`;
    return "The threat is timing. If the room opens, this file can still change the night.";
  })();

  const weakness = (() => {
    if (stats.appearances === 0) return "The file is too thin to call a weakness.";
    if (stats.wins === 0) return "The missing first close is still the pressure point.";
    if (drought >= 5) return `${drought} lobbies without a win is the part opponents can lean on.`;
    if (consistency < 45 && stats.appearances >= 8) return "The floor still drops often enough to keep the file vulnerable.";
    if (seasonStats.appearances >= 4 && seasonStats.wins === 0) return `${seasonName} has not paid out yet.`;
    return "The danger is drift. Long quiet stretches let the room move on.";
  })();

  const nextMark = (() => {
    const nextWin = getNextMilestone(stats.wins, WIN_MILESTONE_TARGETS);
    const nextKill = getNextMilestone(stats.kills, KILL_MILESTONE_TARGETS);
    const winGap = nextWin ? nextWin - stats.wins : null;
    const killGap = nextKill ? nextKill - stats.kills : null;
    if (winGap != null && winGap <= 3) {
      return {
        label: `${nextWin} wins`,
        line: `${winGap} win${winGap === 1 ? "" : "s"} away.`,
        color: "#FFD700",
      };
    }
    if (killGap != null && killGap <= 10) {
      return {
        label: `${nextKill} kills`,
        line: `${killGap} kill${killGap === 1 ? "" : "s"} away.`,
        color: "#FF4D8F",
      };
    }
    return {
      label: "No close mark",
      line: "Nothing is close enough to force the room yet.",
      color: "#7B8CDE",
    };
  })();

  return {
    currentState,
    liveRead,
    pressureLine,
    conflict,
    recentFormRead,
    threat,
    weakness,
    nextMark,
    coreStats: [
      { label: "WINS", value: stats.wins, color: "#FFD700" },
      { label: "KILLS", value: stats.kills, color: "#FF4D8F" },
      { label: "WIN RATE", value: `${stats.winRate}%`, color: "#00FF94" },
      { label: "LOBBIES", value: stats.appearances, color: "#00E5FF" },
    ],
    rank,
    level,
    lastSeen,
    form,
  };
};

const getLobbyTotalKills = (session) =>
  Object.values(session?.kills || {}).reduce((sum, value) => sum + value, 0);

export const getLeaderboardShiftData = (
  players,
  sessions,
  {
    seasonId = "all",
    period = "all",
    sortBy = "wins",
  } = {},
) => {
  const seasonSessions =
    seasonId === "all" ? sessions : getSeasonSessions(sessions, seasonId);
  const scopedSessions = getPeriodSessions(seasonSessions, period);
  const latestScopeDate = scopedSessions.length
    ? getLatestSessionDate(scopedSessions)
    : "";

  if (!latestScopeDate) {
    return { map: {}, biggestRise: null, biggestSlide: null, latestScopeDate: "" };
  }

  let previousSessions = [];
  if (period === "today") {
    previousSessions = getPeriodSessions(
      seasonSessions.filter((session) => session.date < latestScopeDate),
      "today",
    );
  } else if (period === "week") {
    previousSessions = getPeriodSessions(
      seasonSessions.filter((session) => session.date < latestScopeDate),
      "week",
    );
    if (!previousSessions.length) {
      previousSessions = getPeriodSessions(
        seasonSessions.filter((session) => session.date < latestScopeDate),
        "today",
      );
    }
  } else {
    previousSessions = seasonSessions.filter(
      (session) => session.date < latestScopeDate,
    );
  }

  if (!previousSessions.length) {
    return { map: {}, biggestRise: null, biggestSlide: null, latestScopeDate };
  }

  const playerIndex = buildPlayerIndex(players);
  const buildRows = (source) =>
    getSortedLeaderboard({
      players,
      sessions: source,
      seasonId: "all",
      period: "all",
      sortBy,
    }).filter((row) => row.appearances > 0);

  const currentRows = buildRows(scopedSessions);
  const previousRows = buildRows(previousSessions);
  const previousIndex = Object.fromEntries(
    previousRows.map((row, index) => [row.id, index]),
  );
  const map = {};
  let biggestRise = null;
  let biggestSlide = null;

  currentRows.forEach((row, index) => {
    const priorIndex = previousIndex[row.id];
    if (priorIndex === undefined) {
      map[row.id] = { delta: null, label: "NEW", tone: "new" };
      if (!biggestRise) {
        biggestRise = {
          player: getPlayerById(playerIndex, row.id),
          delta: null,
          label: "NEW",
        };
      }
      return;
    }

    const delta = priorIndex - index;
    const tone = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const label = delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "HOLD";
    map[row.id] = { delta, label, tone };

    if (delta > 0 && (!biggestRise || delta > (biggestRise.delta ?? -1))) {
      biggestRise = {
        player: getPlayerById(playerIndex, row.id),
        delta,
        label,
      };
    }
    if (delta < 0 && (!biggestSlide || delta < biggestSlide.delta)) {
      biggestSlide = {
        player: getPlayerById(playerIndex, row.id),
        delta,
        label,
      };
    }
  });

  return { map, biggestRise, biggestSlide, latestScopeDate };
};

export const getSeasonCampaignFile = (seasonSessions, players) => {
  const ordered = [...seasonSessions].sort(compareSessionsAsc);
  if (!ordered.length) {
    return null;
  }

  const playerIndex = buildPlayerIndex(players);
  const getPlayer = (playerId) => getPlayerById(playerIndex, playerId);
  const seasonRows = allStats(players, ordered).filter((row) => row.appearances > 0);
  const byWins = [...seasonRows].sort(
    (left, right) => right.wins - left.wins || right.kills - left.kills,
  );
  const byKills = [...seasonRows].sort(
    (left, right) => right.kills - left.kills || right.wins - left.wins,
  );
  const byAppearances = [...seasonRows].sort(
    (left, right) => right.appearances - left.appearances || right.wins - left.wins,
  );
  const dayMap = {};
  let topGame = { pid: "", k: 0, sid: "", date: "" };

  ordered.forEach((session) => {
    const dayRow = dayMap[session.date] || {
      date: session.date,
      lobbies: 0,
      totalKills: 0,
      wins: {},
      kills: {},
      attendees: {},
    };

    dayRow.lobbies += 1;
    dayRow.totalKills += getLobbyTotalKills(session);
    (session.attendees || []).forEach((playerId) => {
      dayRow.attendees[playerId] = true;
    });
    if (session.winner) {
      dayRow.wins[session.winner] = (dayRow.wins[session.winner] || 0) + 1;
    }
    Object.entries(session.kills || {}).forEach(([playerId, kills]) => {
      dayRow.kills[playerId] = (dayRow.kills[playerId] || 0) + kills;
      if (kills > topGame.k) {
        topGame = { pid: playerId, k: kills, sid: session.id, date: session.date };
      }
    });
    dayMap[session.date] = dayRow;
  });

  const seasonChampionId = byWins[0]?.id || "";
  const seasonRunnerUpId = byWins[1]?.id || "";
  const leaderTimeline = [];
  const dayRows = Object.values(dayMap).map((dayRow) => {
    const topWinnerCount = Math.max(...Object.values(dayRow.wins), 0);
    const topWinners =
      topWinnerCount > 0
        ? Object.entries(dayRow.wins)
            .filter(([, wins]) => wins === topWinnerCount)
            .map(([playerId, wins]) => ({
              pid: playerId,
              wins,
              player: getPlayer(playerId),
            }))
        : [];
    const topKillerPid =
      Object.entries(dayRow.kills).sort((left, right) => right[1] - left[1])[0]?.[0] ||
      "";
    return {
      ...dayRow,
      uniquePlayers: Object.keys(dayRow.attendees || {}).length,
      winnerSpread: Object.keys(dayRow.wins || {}).length,
      topWinnerCount,
      topWinners,
      topKiller: topKillerPid
        ? {
            pid: topKillerPid,
            player: getPlayer(topKillerPid),
            kills: dayRow.kills[topKillerPid] || 0,
          }
        : null,
    };
  });
  const loudestDay =
    [...dayRows].sort(
      (left, right) =>
        right.totalKills - left.totalKills ||
        right.lobbies - left.lobbies ||
        right.date.localeCompare(left.date),
    )[0] || null;
  const biggestCrowd =
    [...dayRows].sort(
      (left, right) =>
        right.uniquePlayers - left.uniquePlayers ||
        right.lobbies - left.lobbies ||
        right.date.localeCompare(left.date),
    )[0] || null;
  const widestWinnerDay =
    [...dayRows].sort(
      (left, right) =>
        right.winnerSpread - left.winnerSpread ||
        right.lobbies - left.lobbies ||
        right.totalKills - left.totalKills ||
        right.date.localeCompare(left.date),
    )[0] || null;
  let championWinsSoFar = 0;
  let runnerUpWinsSoFar = 0;
  let turningNight = null;
  const orderedDays = [...dayRows].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const cumulativeWins = {};
  orderedDays.forEach((dayRow) => {
    Object.entries(dayRow.wins).forEach(([playerId, wins]) => {
      cumulativeWins[playerId] = (cumulativeWins[playerId] || 0) + wins;
    });
    const rankedLeaders = Object.entries(cumulativeWins).sort(
      (left, right) => right[1] - left[1],
    );
    const leadWins = rankedLeaders[0]?.[1] || 0;
    const leaders = rankedLeaders
      .filter(([, wins]) => wins === leadWins)
      .map(([playerId]) => playerId);
    leaderTimeline.push({ date: dayRow.date, leaders, leadWins });
    if (!seasonChampionId || !seasonRunnerUpId) {
      return;
    }
    const championDayWins = dayRow.wins[seasonChampionId] || 0;
    const runnerUpDayWins = dayRow.wins[seasonRunnerUpId] || 0;
    championWinsSoFar += championDayWins;
    runnerUpWinsSoFar += runnerUpDayWins;
    const gap = championWinsSoFar - runnerUpWinsSoFar;
    const gapShift = championDayWins - runnerUpDayWins;
    const candidate = {
      ...dayRow,
      championDayWins,
      runnerUpDayWins,
      gap,
      gapShift,
    };
    if (gapShift <= 0) {
      return;
    }
    if (
      !turningNight ||
      gapShift > turningNight.gapShift ||
      (gapShift === turningNight.gapShift &&
        championDayWins > turningNight.championDayWins) ||
      (gapShift === turningNight.gapShift &&
        championDayWins === turningNight.championDayWins &&
        dayRow.totalKills > turningNight.totalKills) ||
      (gapShift === turningNight.gapShift &&
        championDayWins === turningNight.championDayWins &&
        dayRow.totalKills === turningNight.totalKills &&
        dayRow.date.localeCompare(turningNight.date) < 0)
    ) {
      turningNight = candidate;
    }
  });

  let bestRun = { id: "", streak: 0, start: null, end: null, totalKills: 0 };
  seasonRows.forEach((row) => {
    const played = ordered.filter((session) => session.attendees?.includes(row.id));
    let current = { streak: 0, start: null, end: null, totalKills: 0, lastDate: "" };
    played.forEach((session) => {
      if (session.date !== current.lastDate) {
        current = { streak: 0, start: null, end: null, totalKills: 0, lastDate: session.date };
      }
      if (session.winner === row.id) {
        current.streak += 1;
        current.start = current.start || session;
        current.end = session;
        current.totalKills += session.kills?.[row.id] || 0;
        if (
          current.streak > bestRun.streak ||
          (current.streak === bestRun.streak &&
            current.totalKills > bestRun.totalKills)
        ) {
          bestRun = {
            id: row.id,
            streak: current.streak,
            start: current.start,
            end: current.end,
            totalKills: current.totalKills,
          };
        }
      } else {
        current = { streak: 0, start: null, end: null, totalKills: 0, lastDate: session.date };
      }
    });
    const streak = getStreak(row.id, ordered);
    if (streak > bestRun.streak) {
      bestRun = { id: row.id, streak, start: null, end: null, totalKills: 0 };
    }
  });
  const lockNight = seasonChampionId
    ? leaderTimeline.find(
        (entry, index) =>
          entry.leaders.length === 1 &&
          entry.leaders[0] === seasonChampionId &&
          leaderTimeline
            .slice(index)
            .every(
              (future) =>
                future.leaders.length === 1 &&
                future.leaders[0] === seasonChampionId,
            ),
      ) || null
    : null;
  const leaderChanges = leaderTimeline.reduce((count, entry, index) => {
    if (index === 0) {
      return count;
    }
    const prev = leaderTimeline[index - 1];
    const same =
      prev.leaders.length === entry.leaders.length &&
      prev.leaders.every((playerId, leaderIndex) => playerId === entry.leaders[leaderIndex]);
    return same ? count : count + 1;
  }, 0);

  return {
    ordered,
    opener: ordered[0],
    openerWinner: getPlayer(ordered[0]?.winner),
    closer: ordered[ordered.length - 1],
    closerWinner: getPlayer(ordered[ordered.length - 1]?.winner),
    leaderRow: byWins[0] || null,
    leader: getPlayer(byWins[0]?.id),
    chaserRow: byWins[1] || null,
    chaser: getPlayer(byWins[1]?.id),
    killLeaderRow: byKills[0] || null,
    killLeader: getPlayer(byKills[0]?.id),
    attendanceLeaderRow: byAppearances[0] || null,
    attendanceLeader: getPlayer(byAppearances[0]?.id),
    loudestDay,
    biggestCrowd,
    widestWinnerDay,
    turningNight,
    lockNight,
    leaderChanges,
    leaderTimeline,
    topGame,
    topGamePlayer: getPlayer(topGame.pid),
    bestRun: bestRun.streak > 0 ? { ...bestRun, player: getPlayer(bestRun.id) } : null,
  };
};

export const getLastSeen = (playerId, sessions) => {
  const playerSessions = sessions.filter((session) =>
    session.attendees?.includes(playerId),
  );
  if (!playerSessions.length) {
    return null;
  }

  return playerSessions.reduce(
    (latestDate, session) => (session.date > latestDate ? session.date : latestDate),
    "",
  );
};

export const getOnDeckPressure = (
  sessions,
  players,
  {
    seasonId = "all",
    period = "all",
    limit = 4,
  } = {},
) => {
  if (!sessions.length || !players.length) {
    return {
      items: [],
      summary: [],
      topItem: null,
      scopeLabel: "board",
    };
  }

  const seasonSessions = filterSessionsBySeason(sessions, seasonId);
  const scopedSessions = getPeriodSessions(seasonSessions, period);
  if (!scopedSessions.length) {
    return {
      items: [],
      summary: [],
      topItem: null,
      scopeLabel:
        period === "today"
          ? "latest day board"
          : period === "week"
            ? "week board"
            : seasonId !== "all"
              ? "season board"
              : "all-time board",
    };
  }

  const latestDate = getLatestSessionDate(sessions);
  const recentFloor = new Date(`${latestDate}T12:00:00Z`);
  recentFloor.setUTCDate(recentFloor.getUTCDate() - 7);
  const recentFloorString = recentFloor.toISOString().split("T")[0];
  const recentIds = new Set(
    sessions
      .filter((session) => session.date >= recentFloorString)
      .flatMap((session) => session.attendees || []),
  );
  const scopedIds = new Set(
    scopedSessions.flatMap((session) => session.attendees || []),
  );
  const playerIndex = buildPlayerIndex(players);
  const getPlayer = (playerId) => getPlayerById(playerIndex, playerId);
  const byWins = (left, right) => right.wins - left.wins || right.kills - left.kills;
  const allRows = allStats(players, sessions)
    .filter((player) => player.appearances > 0)
    .sort(byWins);
  const scopeRows = allStats(players, scopedSessions)
    .filter((player) => player.appearances > 0)
    .sort(byWins);
  const scopeLabel =
    period === "today"
      ? "latest day board"
      : period === "week"
        ? "week board"
        : seasonId !== "all"
          ? "season board"
          : "all-time board";
  const isRelevant = (playerId) => scopedIds.has(playerId) || recentIds.has(playerId);
  const items = [];
  const pushItem = (entry) => {
    if (!entry?.text || items.some((item) => item.text === entry.text)) {
      return;
    }
    items.push(entry);
  };

  const scopeLeader = scopeRows[0] || null;
  const scopeRunner = scopeRows[1] || null;
  if (scopeLeader && scopeRunner) {
    const leaderPlayer = getPlayer(scopeLeader.id);
    const runnerPlayer = getPlayer(scopeRunner.id);
    const winGap = scopeLeader.wins - scopeRunner.wins;
    if (leaderPlayer && runnerPlayer) {
      if (winGap === 0) {
        pushItem({
          type: "scope-flip",
          players: [leaderPlayer.id, runnerPlayer.id],
          color: leaderPlayer.color,
          priority: 96,
          text: `Next clean win breaks the ${scopeLabel} tie between ${leaderPlayer.username} and ${runnerPlayer.username}.`,
          shortText: `Next win breaks the ${leaderPlayer.username} and ${runnerPlayer.username} tie.`,
        });
      } else if (winGap === 1) {
        pushItem({
          type: "scope-flip",
          players: [leaderPlayer.id, runnerPlayer.id],
          color: runnerPlayer.color,
          priority: 95,
          text: `${runnerPlayer.username} is 1 win from leveling ${leaderPlayer.username} on the ${scopeLabel}.`,
          shortText: `${runnerPlayer.username} is 1 win from leveling ${leaderPlayer.username}.`,
        });
      } else if (winGap === 2 && period !== "all") {
        pushItem({
          type: "scope-flip",
          players: [leaderPlayer.id, runnerPlayer.id],
          color: runnerPlayer.color,
          priority: 90,
          text: `One good night from ${runnerPlayer.username} drags the ${scopeLabel} back within a win of ${leaderPlayer.username}.`,
          shortText: `One good night from ${runnerPlayer.username} tightens the ${scopeLabel}.`,
        });
      }
    }
  }

  const rivalryRows = getRivals(seasonId === "all" ? sessions : seasonSessions)
    .filter((entry) => isRelevant(entry.p1) || isRelevant(entry.p2))
    .map((entry) => {
      const leftPlayer = getPlayer(entry.p1);
      const rightPlayer = getPlayer(entry.p2);
      if (!leftPlayer || !rightPlayer) {
        return null;
      }
      const gap = Math.abs(entry.p1wins - entry.p2wins);
      const leader = entry.p1wins >= entry.p2wins ? leftPlayer : rightPlayer;
      const trailer = leader.id === leftPlayer.id ? rightPlayer : leftPlayer;
      const leaderWins = Math.max(entry.p1wins, entry.p2wins);
      const trailerWins = Math.min(entry.p1wins, entry.p2wins);
      if (gap === 0 && entry.total >= 8) {
        return {
          type: "rivalry",
          players: [leftPlayer.id, rightPlayer.id],
          color: trailer.color,
          priority: 94,
          total: entry.total,
          text: `${leftPlayer.username} and ${rightPlayer.username} are dead level at ${leaderWins}-${trailerWins}. Next clean finish breaks it.`,
          shortText: `${leftPlayer.username} and ${rightPlayer.username} are dead level at ${leaderWins}-${trailerWins}.`,
        };
      }
      if (gap === 1 && entry.total >= 10) {
        return {
          type: "rivalry",
          players: [leader.id, trailer.id],
          color: trailer.color,
          priority: 95,
          total: entry.total,
          text: `${trailer.username} is 1 result from leveling ${leader.username} in a ${leaderWins}-${trailerWins} rivalry.`,
          shortText: `${trailer.username} is 1 result from leveling ${leader.username}.`,
        };
      }
      if (gap === 2 && entry.total >= 10) {
        return {
          type: "rivalry",
          players: [leader.id, trailer.id],
          color: trailer.color,
          priority: 89,
          total: entry.total,
          text: `One clean finish from ${trailer.username} cuts ${leader.username}'s rivalry edge to one.`,
          shortText: `${trailer.username} is one result from cutting ${leader.username}'s edge to one.`,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((left, right) => right.priority - left.priority || right.total - left.total);
  if (rivalryRows[0]) {
    pushItem(rivalryRows[0]);
  }

  const winTargets = [
    { milestone: 3, label: "Gunslinger", icon: "⭐", color: "#40C4FF", priority: 84 },
    { milestone: 6, label: "Veteran", icon: "🔥", color: "#FFAB40", priority: 91 },
    { milestone: 10, label: "Legend", icon: "⚡", color: "#C77DFF", priority: 97 },
  ];
  const winCandidates = allRows
    .map((row) => {
      if (!isRelevant(row.id)) {
        return null;
      }
      const target = winTargets.find((entry) => row.wins < entry.milestone);
      if (!target) {
        return null;
      }
      const gap = target.milestone - row.wins;
      if (gap < 1 || gap > 2) {
        return null;
      }
      return {
        type: "wins-benchmark",
        players: [row.id],
        color: target.color,
        benchmarkLabel: target.label,
        benchmarkValue: target.milestone,
        priority: target.priority - (gap - 1),
        gap,
        wins: row.wins,
        lastSeen: getLastSeen(row.id, sessions) || "",
        text: `${getPlayer(row.id)?.username || "Unknown"} is ${gap} win${gap === 1 ? "" : "s"} from ${target.label}.`,
        shortText: `${getPlayer(row.id)?.username || "Unknown"} is ${gap} win${gap === 1 ? "" : "s"} from ${target.label}.`,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.gap - right.gap ||
        right.priority - left.priority ||
        right.wins - left.wins ||
        right.lastSeen.localeCompare(left.lastSeen),
    );

  const killTargets = [
    { milestone: 50, color: "#FF4D8F", priority: 87, maxGap: 10 },
    { milestone: 100, color: "#FF4D8F", priority: 90, maxGap: 10 },
    { milestone: 500, color: "#FF4D8F", priority: 93, maxGap: 15 },
  ];
  const killCandidates = allRows
    .map((row) => {
      if (!isRelevant(row.id)) {
        return null;
      }
      const target = killTargets.find((entry) => row.kills < entry.milestone);
      if (!target) {
        return null;
      }
      const gap = target.milestone - row.kills;
      if (gap < 1 || gap > target.maxGap) {
        return null;
      }
      return {
        type: "kills-benchmark",
        players: [row.id],
        color: target.color,
        benchmarkValue: target.milestone,
        priority: 90 - gap,
        gap,
        kills: row.kills,
        lastSeen: getLastSeen(row.id, sessions) || "",
        text: `${getPlayer(row.id)?.username || "Unknown"} is ${gap} kill${gap === 1 ? "" : "s"} from ${target.milestone}.`,
        shortText: `${getPlayer(row.id)?.username || "Unknown"} is ${gap} kill${gap === 1 ? "" : "s"} from ${target.milestone}.`,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.gap - right.gap ||
        right.priority - left.priority ||
        right.kills - left.kills ||
        right.lastSeen.localeCompare(left.lastSeen),
    );

  const candidates = [...items, ...winCandidates, ...killCandidates].sort(
    (left, right) => right.priority - left.priority,
  );
  const selected = [];
  const playerUse = new Map();
  const typeUse = new Map();
  const typeCaps = {
    "scope-flip": 1,
    rivalry: 1,
    "wins-benchmark": 1,
    "kills-benchmark": 1,
  };
  candidates.forEach((candidate) => {
    if (selected.length >= limit) {
      return;
    }
    const playerIds = candidate.players || [];
    const typeCount = typeUse.get(candidate.type) || 0;
    if (typeCaps[candidate.type] && typeCount >= typeCaps[candidate.type]) {
      return;
    }
    const repeatedPlayer =
      candidate.type !== "rivalry" &&
      playerIds.some((playerId) => (playerUse.get(playerId) || 0) > 0);
    if (repeatedPlayer) {
      return;
    }
    selected.push(candidate);
    playerIds.forEach((playerId) => {
      playerUse.set(playerId, (playerUse.get(playerId) || 0) + 1);
    });
    typeUse.set(candidate.type, typeCount + 1);
  });

  return {
    items: selected,
    summary: selected.map((entry) => entry.shortText || entry.text),
    topItem: selected[0] || null,
    scopeLabel,
  };
};

const PRESSURE_QUEUE_EMPTY_LINE = "No live pressure is close enough to call right now.";

const getPressureQueueTypeFamily = (type = "") => {
  if (type === "rivalry-pressure") {
    return "rivalry";
  }
  if (type === "milestone-pressure") {
    return "milestone";
  }
  if (type === "crown-pressure") {
    return "crown";
  }
  if (type === "rank-jump-pressure") {
    return "rank-jump";
  }
  if (type === "streak-pressure") {
    return "streak";
  }
  if (type === "drought-pressure") {
    return "drought";
  }
  if (type === "season-window-pressure") {
    return "season-window";
  }
  if (type === "record-threat") {
    return "record-threat";
  }
  return type || "other";
};

const getPressureQueueColor = (type = "", tone = "watch") => {
  if (type === "crown-pressure") {
    return "#FF4D8F";
  }
  if (type === "rank-jump-pressure") {
    return "#00E5FF";
  }
  if (type === "milestone-pressure") {
    return tone === "hot" ? "#FFD700" : "#FFAB40";
  }
  if (type === "streak-pressure") {
    return "#FF6B35";
  }
  if (type === "rivalry-pressure") {
    return "#FF4D8F";
  }
  if (type === "drought-pressure") {
    return "#FFAB40";
  }
  if (type === "season-window-pressure") {
    return "#FFD700";
  }
  if (type === "record-threat") {
    return "#C77DFF";
  }
  return tone === "hot" ? "#FF6B35" : "#00E5FF";
};

const mapOnDeckPressureToQueueItem = (item, playersById) => {
  if (!item?.type || !item?.text) {
    return null;
  }
  const playerIds = item.players || [];
  const firstPlayer = getPlayerById(playersById, playerIds[0]);
  const secondPlayer = getPlayerById(playersById, playerIds[1]);
  const tone = item.gap === 1 ? "hot" : "watch";

  if (item.type === "wins-benchmark" || item.type === "kills-benchmark") {
    return {
      id: `pressure-queue-ondeck-${item.type}-${playerIds.join("-")}-${item.benchmarkValue || "mark"}`,
      type: "milestone-pressure",
      priority: item.priority || 80,
      label: "MILESTONE PRESSURE",
      headline: item.text,
      detail:
        item.type === "wins-benchmark"
          ? item.gap === 1
            ? "One win moves that mark immediately."
            : "Two wins is still close enough to matter next session."
          : item.gap <= 4
            ? "One busy room can close that gap."
            : "That number is still close enough to stay on the board.",
      playerIds,
      source: "on_deck_pressure",
      tone,
    };
  }

  if (item.type === "rivalry" && firstPlayer && secondPlayer) {
    return {
      id: `pressure-queue-ondeck-rivalry-${playerIds.join("-")}`,
      type: "rivalry-pressure",
      priority: item.priority || 86,
      label: "RIVALRY PRESSURE",
      headline: `${firstPlayer.username} vs ${secondPlayer.username} is still within one swing.`,
      detail: item.shortText || item.text,
      playerIds,
      source: "on_deck_pressure",
      tone,
    };
  }

  if (item.type === "scope-flip") {
    return {
      id: `pressure-queue-ondeck-scope-${playerIds.join("-")}`,
      type: "rank-jump-pressure",
      priority: item.priority || 85,
      label: "RANK JUMP",
      headline: item.shortText || item.text,
      detail: "That line is still close enough to move in the next room.",
      playerIds,
      source: "on_deck_pressure",
      tone,
    };
  }

  return null;
};

export const getPressureQueue = (
  state,
  {
    limit = 3,
    seasonId = "",
    nowUtc = todayStr(),
  } = {},
) => {
  const players = state?.players || [];
  const sessions = state?.sessions || [];

  if (!players.length || !sessions.length) {
    return {
      items: [],
      emptyLine: PRESSURE_QUEUE_EMPTY_LINE,
    };
  }

  const latestDate = getLatestSessionDate(sessions);
  const activeSeason =
    (seasonId ? SEASONS.find((season) => season.id === seasonId) : null) ||
    getSeasonForDate(latestDate) ||
    SEASONS[SEASONS.length - 1];
  const activeSeasonId = activeSeason?.id || "all";
  const seasonSessions =
    activeSeasonId === "all" ? sessions : getSeasonSessions(sessions, activeSeasonId);
  const playersById = buildPlayerIndex(players);
  const allRows = allStats(players, sessions)
    .filter((row) => row.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const seasonRows = allStats(players, seasonSessions)
    .filter((row) => row.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const onDeck = getOnDeckPressure(sessions, players, {
    seasonId: activeSeasonId,
    period: "all",
    limit: 4,
  });
  const rivalOps = getRivalOpsViewModel(state, nowUtc);
  const latestHeatRun = getLatestDayHeatRun(sessions, players, latestDate);
  const seasonAnchor = new Date(`${nowUtc}T12:00:00Z`);
  const seasonEndDate = activeSeason?.end ? new Date(`${activeSeason.end}T12:00:00Z`) : null;
  const seasonDaysLeft = seasonEndDate
    ? Math.max(0, Math.ceil((seasonEndDate - seasonAnchor) / (1000 * 60 * 60 * 24)))
    : null;

  const candidates = [];
  const pushCandidate = (candidate) => {
    if (!candidate?.id || !candidate?.headline || !candidate?.detail) {
      return;
    }
    candidates.push({
      ...candidate,
      color: getPressureQueueColor(candidate.type, candidate.tone),
    });
  };

  const seasonLeader = seasonRows[0] || null;
  const seasonRunner = seasonRows[1] || null;
  const seasonLeaderPlayer = seasonLeader ? getPlayerById(playersById, seasonLeader.id) : null;
  const seasonRunnerPlayer = seasonRunner ? getPlayerById(playersById, seasonRunner.id) : null;
  if (seasonLeader && seasonRunner && seasonLeaderPlayer && seasonRunnerPlayer) {
    const winGap = seasonLeader.wins - seasonRunner.wins;
    if (winGap <= 3) {
      pushCandidate({
        id: `pressure-queue-crown-${seasonLeader.id}-${seasonRunner.id}`,
        type: "crown-pressure",
        priority: winGap === 0 ? 110 : winGap === 1 ? 108 : winGap === 2 ? 103 : 99,
        label: "CROWN PRESSURE",
        headline:
          winGap === 0
            ? `${seasonLeaderPlayer.username} and ${seasonRunnerPlayer.username} are level on wins.`
            : `${seasonRunnerPlayer.username} is ${winGap} win${winGap === 1 ? "" : "s"} from ${seasonLeaderPlayer.username}.`,
        detail:
          seasonDaysLeft != null && seasonDaysLeft <= 6
            ? `${seasonDaysLeft} day${seasonDaysLeft === 1 ? "" : "s"} left. The top line is still moving.`
            : winGap === 0
              ? "The next clean finish changes the top line."
              : winGap === 1
                ? "One strong room pulls the lead level."
                : "One sharp night cuts the gap to one.",
        playerIds: [seasonLeader.id, seasonRunner.id],
        source: "season_leaderboard",
        tone: winGap <= 1 ? "hot" : "watch",
      });
    }
  }

  const rankJumpCandidates = seasonRows
    .map((row, index) => {
      if (index <= 0 || index >= 8) {
        return null;
      }
      const target = seasonRows[index - 1];
      const player = getPlayerById(playersById, row.id);
      const targetPlayer = getPlayerById(playersById, target.id);
      if (!player || !targetPlayer) {
        return null;
      }
      const winGap = target.wins - row.wins;
      const killGap = target.kills - row.kills;
      if (index === 1 && seasonLeader?.id === target.id) {
        return null;
      }
      if (winGap === 0 && killGap > 0 && killGap <= 8) {
        return {
          id: `pressure-queue-rank-tie-${row.id}-${target.id}`,
          type: "rank-jump-pressure",
          priority: 97 - index,
          label: "RANK JUMP",
          headline: `${player.username} is level on wins with ${targetPlayer.username}.`,
          detail: `${killGap} kill${killGap === 1 ? "" : "s"} separate the tiebreak right now.`,
          playerIds: [row.id, target.id],
          source: "season_leaderboard",
          tone: "hot",
        };
      }
      if (winGap === 1) {
        return {
          id: `pressure-queue-rank-gap-${row.id}-${target.id}`,
          type: "rank-jump-pressure",
          priority: 94 - index,
          label: "RANK JUMP",
          headline: `${player.username} is 1 win from ${targetPlayer.username}'s spot.`,
          detail: "One sharp room flips that line immediately.",
          playerIds: [row.id, target.id],
          source: "season_leaderboard",
          tone: "watch",
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((left, right) => right.priority - left.priority);
  if (rankJumpCandidates[0]) {
    pushCandidate(rankJumpCandidates[0]);
  }

  if (latestHeatRun?.player && latestHeatRun.streak >= 2) {
    pushCandidate({
      id: `pressure-queue-streak-${latestHeatRun.player.id}-${latestDate}`,
      type: "streak-pressure",
      priority: latestHeatRun.streak >= 3 ? 92 : 86,
      label: "STREAK PRESSURE",
      headline: `${latestHeatRun.player.username} closed the last session day on ${latestHeatRun.streak} straight wins.`,
      detail: "That is the cleanest unresolved streak still hanging over the next room.",
      playerIds: [latestHeatRun.player.id],
      source: "latest_day_heat_run",
      tone: latestHeatRun.streak >= 3 ? "hot" : "watch",
    });
  }

  const rivalCard = rivalOps.activeCards[0] || rivalOps.watchCards[0] || null;
  if (rivalCard) {
    pushCandidate({
      id: `pressure-queue-rivalops-${rivalCard.id}`,
      type: "rivalry-pressure",
      priority: rivalCard.state === "active" ? 95 : 89,
      label: rivalCard.state === "active" ? "RIVALRY PRESSURE" : "RIVALRY WATCH",
      headline: `${rivalCard.playerALabel} vs ${rivalCard.playerBLabel} is still carrying board pressure.`,
      detail: rivalCard.pressureLine || rivalCard.stateLine,
      playerIds: [rivalCard.playerAId, rivalCard.playerBId],
      source: "rival_ops",
      tone: rivalCard.state === "active" ? "hot" : "watch",
    });
  }

  const droughtCandidate = allRows
    .filter((row) => row.wins > 0)
    .map((row) => ({
      row,
      drought: getDrought(row.id, sessions),
      player: getPlayerById(playersById, row.id),
    }))
    .filter((entry) => entry.player && entry.drought >= 6)
    .sort(
      (left, right) =>
        right.drought - left.drought ||
        right.row.wins - left.row.wins ||
        right.row.appearances - left.row.appearances,
    )[0] || null;
  if (droughtCandidate) {
    pushCandidate({
      id: `pressure-queue-drought-${droughtCandidate.player.id}`,
      type: "drought-pressure",
      priority: Math.min(88, 80 + droughtCandidate.drought),
      label: "DROUGHT PRESSURE",
      headline: `${droughtCandidate.player.username} is ${droughtCandidate.drought} lobbies without a win.`,
      detail: "One clean room ends it immediately and changes how that file is being read.",
      playerIds: [droughtCandidate.player.id],
      source: "standings_drought",
      tone: droughtCandidate.drought >= 10 ? "hot" : "watch",
    });
  }

  onDeck.items
    .map((item) => mapOnDeckPressureToQueueItem(item, playersById))
    .filter(Boolean)
    .forEach(pushCandidate);

  const selected = [];
  const usedFamilies = new Map();
  const usedPlayerKeys = new Set();
  const usedSourceKeys = new Set();
  const familyCaps = {
    rivalry: 1,
    milestone: 1,
  };

  candidates
    .sort((left, right) => right.priority - left.priority || left.headline.localeCompare(right.headline))
    .forEach((candidate) => {
      if (selected.length >= limit) {
        return;
      }

      const family = getPressureQueueTypeFamily(candidate.type);
      const familyCount = usedFamilies.get(family) || 0;
      if (familyCaps[family] && familyCount >= familyCaps[family]) {
        return;
      }

      const playerKey = [...(candidate.playerIds || [])].sort().join(":");
      const sourceKey = `${family}:${playerKey}:${candidate.headline}`;
      if ((playerKey && usedPlayerKeys.has(`${family}:${playerKey}`)) || usedSourceKeys.has(sourceKey)) {
        return;
      }

      const conflictsWithSelected = selected.some((entry) => {
        const sameFamily = getPressureQueueTypeFamily(entry.type) === family;
        const overlap = (candidate.playerIds || []).some((playerId) => entry.playerIds.includes(playerId));
        if (family === "crown" && getPressureQueueTypeFamily(entry.type) === "rank-jump" && overlap) {
          return true;
        }
        if (family === "rank-jump" && getPressureQueueTypeFamily(entry.type) === "crown" && overlap) {
          return true;
        }
        return sameFamily && overlap;
      });
      if (conflictsWithSelected) {
        return;
      }

      selected.push(candidate);
      usedFamilies.set(family, familyCount + 1);
      if (playerKey) {
        usedPlayerKeys.add(`${family}:${playerKey}`);
      }
      usedSourceKeys.add(sourceKey);
    });

  return {
    items: selected.slice(0, limit),
    emptyLine: PRESSURE_QUEUE_EMPTY_LINE,
  };
};

const WIN_MILESTONE_TARGETS = [1, 3, 6, 10, 25, 50, 100, 150, 200];
const KILL_MILESTONE_TARGETS = [25, 50, 100, 150, 200, 300, 500, 700];

const hashSeed = (value = "") =>
  [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

const pickDailyVariant = (variants, seed) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }
  return variants[hashSeed(seed) % variants.length];
};

const getNextMilestone = (value, milestones) =>
  milestones.find((milestone) => value < milestone) || null;

const getRankTier = (rank, seasonRank) => {
  if ((rank && rank <= 5) || (seasonRank && seasonRank <= 3)) {
    return "top";
  }
  if ((rank && rank <= 15) || (seasonRank && seasonRank <= 8)) {
    return "mid";
  }
  return "support";
};

const getRowRank = (rows, playerId) => rows.findIndex((row) => row.id === playerId) + 1;

const formatUtcDateKey = (date) => date.toISOString().slice(0, 10);

export const getDailyOrdersScheduleState = (now = new Date()) => {
  const current = now instanceof Date ? now : new Date(now);
  const day = current.getUTCDay();
  const hour = current.getUTCHours();
  const isSaturdayAfterClose = day === 6 && hour >= 19;
  const isSunday = day === 0;
  const isMondayBeforeOpen = day === 1 && hour < 8;
  const isOffWindow = isSaturdayAfterClose || isSunday || isMondayBeforeOpen;

  if (!isOffWindow) {
    return {
      isActive: true,
      dayKey: formatUtcDateKey(current),
      reopensAt: null,
      reopensLabel: "",
      dormantTitle: "",
      dormantLead: "",
      dormantNote: "",
    };
  }

  const nextOpen = new Date(current);
  const daysUntilMonday = day === 0 ? 1 : day === 6 ? 2 : 0;
  nextOpen.setUTCDate(current.getUTCDate() + daysUntilMonday);
  nextOpen.setUTCHours(8, 0, 0, 0);

  return {
    isActive: false,
    dayKey: formatUtcDateKey(nextOpen),
    reopensAt: nextOpen.toISOString(),
    reopensLabel: "Monday at 8:00 UTC",
    dormantTitle: "NEXT ROOM WINDOW CLOSED",
    dormantLead: "New orders open Monday at 8:00 UTC.",
    dormantNote:
      "The room is between cycles right now, so this file stays quiet until the next mission window opens.",
  };
};

export const getDailyOrdersForPlayer = (
  playerId,
  players,
  sessions,
  {
    minOrders = 2,
    maxOrders = 2,
    dayKey = todayStr(),
    isActiveWindow = true,
  } = {},
) => {
  if (!isActiveWindow || !playerId || !players.length || !sessions.length) {
    return [];
  }

  const playerIndex = buildPlayerIndex(players);
  const player = getPlayerById(playerIndex, playerId);
  if (!player) {
    return [];
  }

  const latestDate = getLatestSessionDate(sessions);
  const latestDaySessions = sessions.filter((session) => session.date === latestDate);
  const weekSessions = getPeriodSessions(sessions, "week");
  const currentSeason =
    SEASONS.find((season) => latestDate >= season.start && latestDate <= season.end) || null;
  const currentSeasonName = currentSeason?.name || "current season";
  const seasonSessions = currentSeason
    ? getSeasonSessions(sessions, currentSeason.id)
    : sessions;
  const allRows = allStats(players, sessions)
    .filter((row) => row.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const seasonRows = allStats(players, seasonSessions)
    .filter((row) => row.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const weekRows = allStats(players, weekSessions)
    .filter((row) => row.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const currentRow = allRows.find((row) => row.id === playerId) || getStats(playerId, sessions);
  const seasonRow = seasonRows.find((row) => row.id === playerId) || getStats(playerId, seasonSessions);
  const weekRow = weekRows.find((row) => row.id === playerId) || getStats(playerId, weekSessions);
  const allTimeRank = getRowRank(allRows, playerId);
  const seasonRank = getRowRank(seasonRows, playerId);
  const rankTier = getRankTier(allTimeRank, seasonRank);
  const lastSeen = getLastSeen(playerId, sessions);
  const daysSinceSeen = lastSeen
    ? Math.floor((new Date() - new Date(`${lastSeen}T12:00:00Z`)) / (1000 * 60 * 60 * 24))
    : null;
  const liveStreak = getLiveStreaks(sessions, players).find((entry) => entry.id === playerId) || null;
  const form = getFormGuide(playerId, sessions, 5);
  const recentWins = form.filter((entry) => entry.win).length;
  const drought = getDrought(playerId, sessions);
  const topRival = getRivals(sessions).find((entry) => entry.p1 === playerId || entry.p2 === playerId) || null;
  const latestFallout = getLatestDayConsequences(sessions, players, latestDate);
  const latestDayWins = latestDaySessions.filter((session) => session.winner === playerId).length;
  const latestDayKills = latestDaySessions.reduce(
    (total, session) => total + (session.kills?.[playerId] || 0),
    0,
  );
  const nextWinMilestone = getNextMilestone(currentRow.wins, WIN_MILESTONE_TARGETS);
  const nextKillMilestone = getNextMilestone(currentRow.kills, KILL_MILESTONE_TARGETS);
  const winMilestoneGap = nextWinMilestone ? nextWinMilestone - currentRow.wins : null;
  const killMilestoneGap = nextKillMilestone ? nextKillMilestone - currentRow.kills : null;
  const variantKey = `${dayKey}:${playerId}`;
  const allTimeBenchmark = getBenchmark(playerId, players, sessions);
  const seasonBenchmark = (() => {
    const currentIndex = seasonRows.findIndex((row) => row.id === playerId);
    if (currentIndex <= 0) {
      return null;
    }
    const target = seasonRows[currentIndex - 1];
    const targetPlayer = getPlayerById(playerIndex, target.id);
    return targetPlayer
      ? {
          target: targetPlayer,
          rank: currentIndex + 1,
          winGap: target.wins - seasonRow.wins,
          killGap: target.kills - seasonRow.kills,
          sameWins: target.wins === seasonRow.wins,
        }
      : null;
  })();
  const seasonChaser = (() => {
    const currentIndex = seasonRows.findIndex((row) => row.id === playerId);
    if (currentIndex < 0 || currentIndex >= seasonRows.length - 1) {
      return null;
    }
    const chaser = seasonRows[currentIndex + 1];
    const chaserPlayer = getPlayerById(playerIndex, chaser.id);
    return chaserPlayer
      ? {
          target: chaserPlayer,
          rank: currentIndex + 2,
          winGap: seasonRow.wins - chaser.wins,
          killGap: seasonRow.kills - chaser.kills,
          sameWins: chaser.wins === seasonRow.wins,
        }
      : null;
  })();
  const allTimeChaser = (() => {
    const currentIndex = allRows.findIndex((row) => row.id === playerId);
    if (currentIndex < 0 || currentIndex >= allRows.length - 1) {
      return null;
    }
    const chaser = allRows[currentIndex + 1];
    const chaserPlayer = getPlayerById(playerIndex, chaser.id);
    return chaserPlayer
      ? {
          target: chaserPlayer,
          rank: currentIndex + 2,
          winGap: currentRow.wins - chaser.wins,
          killGap: currentRow.kills - chaser.kills,
          sameWins: chaser.wins === currentRow.wins,
        }
      : null;
  })();

  const candidates = [];
  const getVariant = (category, variants) =>
    pickDailyVariant(variants, `${variantKey}:${category}`);
  const pushOrder = (order) => {
    if (!order?.label || !order?.text) {
      return;
    }
    if (candidates.some((entry) => entry.category === order.category)) {
      return;
    }
    candidates.push(order);
  };

  if (liveStreak?.streak >= 2) {
    pushOrder({
      category: "streak-hold",
      priority: rankTier === "top" ? 98 : 95,
      icon: "🔥",
      color: "#FF6B35",
      label: "KEEP IT GOING",
      text:
        liveStreak.streak >= 3
          ? `Win again today and keep the ${liveStreak.streak}-room streak alive.`
          : "Win again today and turn this hot finish into a real run.",
      note:
        liveStreak.streak >= 3
          ? "Another clean close turns this from noise into control."
          : "One more win makes the room treat this as a trend.",
    });
  }

  if (topRival && topRival.total >= 6) {
    const rivalId = topRival.p1 === playerId ? topRival.p2 : topRival.p1;
    const rival = getPlayerById(playerIndex, rivalId);
    const playerWins = topRival.p1 === playerId ? topRival.p1wins : topRival.p2wins;
    const rivalWins = topRival.p1 === playerId ? topRival.p2wins : topRival.p1wins;
    const gap = Math.abs(playerWins - rivalWins);
    if (rival) {
      if (gap === 0) {
        const rivalryVariant = getVariant("rivalry-answer", [
          {
            label: "TAKE THE RIVAL EDGE",
            text: `Finish ahead of ${rival.username} today and move this dead level duel your way.`,
            note: "The next clean result decides who walks in ahead.",
          },
          {
            label: "BREAK THE DEADLOCK",
            text: `Beat ${rival.username} today and turn this level duel into your lead.`,
            note: "Right now the rivalry is waiting on one room to tilt it.",
          },
          {
            label: "LAND THE NEXT SHOT",
            text: `Take the next room over ${rival.username} today and own the first edge in this tied file.`,
            note: "When a duel sits level this long, the next swing carries extra weight.",
          },
        ]);
        pushOrder({
          category: "rivalry-answer",
          priority: 97,
          icon: "⚔️",
          color: "#FF4D8F",
          label: rivalryVariant.label,
          text: rivalryVariant.text,
          note: rivalryVariant.note,
        });
      } else if (playerWins < rivalWins && gap <= 2) {
        const rivalryVariant = getVariant("rivalry-answer", [
          {
            label: "HIT BACK TODAY",
            text: `Finish ahead of ${rival.username} today and cut the duel from ${rivalWins}-${playerWins}.`,
            note:
              gap === 1
                ? "One room is enough to pull this rivalry level."
                : "One good night cuts the edge and changes the tone fast.",
          },
          {
            label: "CLOSE THE GAP",
            text: `Beat ${rival.username} today and pull this rivalry tighter.`,
            note:
              gap === 1
                ? "A single clean result wipes out the gap."
                : `${rival.username} only has ${gap} result${gap === 1 ? "" : "s"} in hand, so this file is still live.`,
          },
          {
            label: "ANSWER THE RIVALRY",
            text: `Take a room over ${rival.username} today and stop this duel from drifting further away.`,
            note:
              gap === 1
                ? "The edge is thin enough to flip tonight."
                : "Another quiet night gives them too much room.",
          },
        ]);
        pushOrder({
          category: "rivalry-answer",
          priority: 96 - gap,
          icon: "⚔️",
          color: "#FF4D8F",
          label: rivalryVariant.label,
          text: rivalryVariant.text,
          note: rivalryVariant.note,
        });
      }
    }
  }

  if (winMilestoneGap && winMilestoneGap <= 2) {
    const milestoneLabel =
      nextWinMilestone === 10
        ? "Legend"
        : nextWinMilestone === 6
          ? "Veteran"
          : `${nextWinMilestone} wins`;
    const milestoneTargetText =
      nextWinMilestone === 10
        ? "Legend"
        : nextWinMilestone === 6
          ? "Veteran"
          : nextWinMilestone === 3
            ? "a third win"
            : `${nextWinMilestone} wins`;
    const benchmarkLabel =
      nextWinMilestone === 10
        ? "REACH LEGEND"
        : nextWinMilestone === 6
          ? "REACH VETERAN"
          : nextWinMilestone === 3
            ? "WIN YOUR THIRD"
            : "REACH THE NEXT MARK";
    pushOrder({
      category: "benchmark-watch",
      priority: 95 - (winMilestoneGap - 1),
      icon: nextWinMilestone === 10 ? "⚡" : "🏁",
      color: nextWinMilestone === 10 ? "#C77DFF" : "#FFD700",
      label: benchmarkLabel,
      text:
        winMilestoneGap === 1
          ? `Take 1 win today and reach ${milestoneLabel}.`
          : `Take ${winMilestoneGap} wins today and reach ${milestoneTargetText}.`,
      note:
        nextWinMilestone === 3
          ? "That is the first number that makes this file feel settled."
          : nextWinMilestone === 10
            ? "That next crown changes how the whole room reads this file."
            : "That number is close enough to change the read right now.",
    });
  }

  if (!candidates.some((entry) => entry.category === "benchmark-watch") && killMilestoneGap && killMilestoneGap <= 8) {
    pushOrder({
      category: "kill-benchmark",
      priority: 91 - Math.min(killMilestoneGap, 6),
      icon: "🎯",
      color: "#FF4D8F",
      label: "HIT THE DAMAGE MARK",
      text: `Put up ${killMilestoneGap} more kill${killMilestoneGap === 1 ? "" : "s"} today and reach ${nextKillMilestone}.`,
      note:
        killMilestoneGap <= 4
          ? "One loud room can settle that number tonight."
          : "A strong damage night brings that mark into play.",
    });
  }

  if (weekRow.appearances >= 4 && weekRow.wins === 0) {
    const weeklyStartVariant = getVariant("first-weekly-win", [
      {
        text: "Take your first weekly win today.",
        note: "One breakthrough close changes the whole weekly mood around this file.",
      },
      {
        text: "Get on the weekly board with a win today.",
        note: "The longer that first close waits, the more the room notices.",
      },
    ]);
    pushOrder({
      category: "first-weekly-win",
      priority: rankTier === "support" ? 95 : 90,
      icon: "🎮",
      color: "#00E5FF",
      label: "GET ON THE BOARD",
      text: weeklyStartVariant.text,
      note: weeklyStartVariant.note,
    });
  }

  if (drought >= 5 && currentRow.wins > 0) {
    const droughtVariant = getVariant("drought-break", [
      {
        label: "END THE DRY SPELL",
        text: `Win today and end the ${drought}-lobby dry spell.`,
        note: "A drought this loud follows a name into every room.",
      },
      {
        label: "END THE QUIET",
        text: `Take one room today so this ${drought}-lobby quiet run stops leading the file.`,
        note: "Right now the silence is doing more talking than the highs.",
      },
      {
        label: "STOP THE SLIDE",
        text: `Close a room today and stop the ${drought}-lobby slide.`,
        note: "The longer it sits there, the louder it gets.",
      },
      {
        label: "BREAK THE HOLD",
        text: `Take a win today and stop this ${drought}-lobby run from owning the file.`,
        note: "When the dry run becomes the headline, one clean room matters twice as much.",
      },
      {
        label: "TURN THE FILE",
        text: `Win today and make the room talk about the response instead of the ${drought}-lobby wait.`,
        note: "A file under this much quiet pressure changes fast when it finally answers back.",
      },
    ]);
    pushOrder({
      category: "drought-break",
      priority: 92,
      icon: "🔁",
      color: "#FFAB40",
      label: droughtVariant.label,
      text: droughtVariant.text,
      note: droughtVariant.note,
    });
  }

  if (seasonBenchmark && seasonBenchmark.winGap > 0 && seasonBenchmark.winGap <= 2) {
    pushOrder({
      category: "rank-climb-pressure",
      priority: rankTier === "mid" ? 94 : 89,
      icon: "📈",
      color: player.color,
      label: "TAKE THE NEXT SPOT",
      text: `Finish ${seasonBenchmark.winGap === 1 ? "1 win" : `${seasonBenchmark.winGap} wins`} better than ${seasonBenchmark.target.username} today and pull level in ${currentSeasonName}.`,
      note:
        seasonBenchmark.winGap === 1
          ? "One good night puts those files side by side."
          : "Two wins is enough to drag that chase into plain view.",
    });
  } else if (allTimeBenchmark && ((allTimeBenchmark.winGap > 0 && allTimeBenchmark.winGap <= 2) || (allTimeBenchmark.sameWins && Math.abs(allTimeBenchmark.killGap) <= 12))) {
    pushOrder({
      category: "rank-climb-pressure",
      priority: 88,
      icon: "📈",
      color: player.color,
      label: "MOVE UP THE FILE",
      text: allTimeBenchmark.sameWins
        ? `Outkill ${allTimeBenchmark.target.username} by ${Math.max(allTimeBenchmark.killGap, 0)} today and take the all-time tiebreak.`
        : `Finish ${allTimeBenchmark.winGap === 1 ? "1 win" : `${allTimeBenchmark.winGap} wins`} better than ${allTimeBenchmark.target.username} today and pull level all time.`,
      note: "One good night is enough to make that file blink.",
    });
  }

  if (
    !candidates.some((entry) => entry.category === "rank-climb-pressure") &&
    ((seasonChaser &&
      ((seasonChaser.winGap >= 0 && seasonChaser.winGap <= 2) ||
        (seasonChaser.sameWins && Math.abs(seasonChaser.killGap) <= 12))) ||
      (allTimeChaser &&
        ((allTimeChaser.winGap >= 0 && allTimeChaser.winGap <= 2) ||
          (allTimeChaser.sameWins && Math.abs(allTimeChaser.killGap) <= 12))))
  ) {
    const chase = seasonChaser &&
      ((seasonChaser.winGap >= 0 && seasonChaser.winGap <= 2) ||
        (seasonChaser.sameWins && Math.abs(seasonChaser.killGap) <= 12))
      ? seasonChaser
      : allTimeChaser;
    const scopeLabel = chase === seasonChaser ? currentSeasonName : "all-time";
    if (chase) {
      pushOrder({
        category: "lead-defense",
        priority: rankTier === "top" ? 94 : 88,
        icon: "🛡️",
        color: "#FFAB40",
        label: "PROTECT THE LEAD",
        text: chase.sameWins
          ? `Finish ahead of ${chase.target.username} today and keep the ${scopeLabel} lead in your hands.`
          : `Finish ahead of ${chase.target.username} today to keep the ${scopeLabel} lead intact.`,
        note: chase.sameWins
          ? "The lead is live right now. One rough room gives it away."
          : chase.winGap === 0
            ? "This line is already level. The next close decides who owns it."
            : `They are only ${chase.winGap} win${chase.winGap === 1 ? "" : "s"} back, so one rough room puts pressure on it.`,
      });
    }
  }

  if (!candidates.some((entry) => entry.category === "streak-hold") && recentWins >= 3) {
    pushOrder({
      category: "form-convert",
      priority: 87,
      icon: "📍",
      color: "#00E5FF",
      label: "MAKE IT REAL",
      text: `Win again today and turn this ${recentWins}-in-5 run into something the room has to respect.`,
      note: "The next good room decides whether this is form or just a flash.",
    });
  } else if (!candidates.some((entry) => entry.category === "drought-break") && form.length >= 4 && recentWins === 0) {
    const resetVariant = getVariant("form-reset", [
      {
        text: `Win today and break the quiet run from the last ${form.length} logged lobbies.`,
        note: "Right now the silence is louder than the highs.",
      },
      {
        text: `Take one room today and stop the last ${form.length} rooms from defining this file.`,
        note: "A flat run never stays invisible for long.",
      },
    ]);
    pushOrder({
      category: "form-reset",
      priority: 86,
      icon: "🧭",
      color: "#FFD700",
      label: "CHANGE THE READ",
      text: resetVariant.text,
      note: resetVariant.note,
    });
  }

  if (daysSinceSeen != null && daysSinceSeen >= 3 && currentRow.appearances >= 5) {
    const returnVariant = getVariant("return-to-file", [
      {
        text: "Show up today and put this file back in the room.",
        note: "Long gaps let the board move on without you.",
      },
      {
        text: `Get back on file today after ${daysSinceSeen} day${daysSinceSeen === 1 ? "" : "s"} away.`,
        note: "Time away never stays neutral for long.",
      },
    ]);
    pushOrder({
      category: "return-to-file",
      priority: 82,
      icon: "📅",
      color: "#00E5FF",
      label: "RETURN TO FILE",
      text: returnVariant.text,
      note: returnVariant.note,
    });
  }

  if (
    !candidates.some((entry) => entry.category === "benchmark-watch") &&
    latestFallout &&
    (latestDayWins >= 2 || latestDayKills >= 6)
  ) {
    const latestDayVariant = getVariant("latest-day-pressure", [
      {
        text:
          latestDayWins >= 2
            ? "Back up the last session day with another strong finish today."
            : `Put up another loud damage line today after ${latestDayKills} kills on the last session day.`,
        note:
          latestDayWins >= 2
            ? "Back to back strong days turn heat into control."
            : "Do it twice and the room stops calling it a spike.",
      },
      {
        text:
          latestDayWins >= 2
            ? `Win again today so that ${latestDayWins}-win day starts to look like the new read.`
            : `Follow that ${latestDayKills}-kill day with another heavy room today.`,
        note:
          latestDayWins >= 2
            ? "The freshest pressure always gets the most attention."
            : "A second loud room makes the damage line feel real.",
      },
    ]);
    pushOrder({
      category: "latest-day-pressure",
      priority: 90,
      icon: "☄️",
      color: player.color,
      label: latestDayWins >= 2 ? "DO IT AGAIN" : "STAY LOUD",
      text: latestDayVariant.text,
      note: latestDayVariant.note,
    });
  }

  candidates.sort((left, right) => right.priority - left.priority);
  const selected = [];
  const usedCategories = new Set();
  candidates.forEach((candidate) => {
    if (selected.length >= maxOrders) {
      return;
    }
    if (usedCategories.has(candidate.category)) {
      return;
    }
    if (selected.length >= minOrders && candidate.priority < 90) {
      return;
    }
    selected.push(candidate);
    usedCategories.add(candidate.category);
  });

  if (selected.length < minOrders) {
    candidates.forEach((candidate) => {
      if (selected.length >= minOrders) {
        return;
      }
      if (usedCategories.has(candidate.category)) {
        return;
      }
      selected.push(candidate);
      usedCategories.add(candidate.category);
    });
  }

  return selected.slice(0, maxOrders);
};

export const getMissionBoardState = (sessions, players) => {
  const missions = getWeeklyMissions(sessions);
  const clearedCount = missions.filter((mission) => mission.progress >= mission.target).length;
  const openCount = missions.length - clearedCount;
  const hottestMission = [...missions]
    .filter((mission) => mission.progress < mission.target)
    .sort(
      (left, right) =>
        (right.progress / right.target) - (left.progress / left.target) ||
        right.progress - left.progress,
    )[0] || null;
  const nextMission = missions.find((mission) => mission.progress < mission.target) || null;
  const latestDate = getLatestSessionDate(sessions);
  const weekSessions = getPeriodSessions(sessions, "week");
  const nextMissionRemaining = nextMission
    ? Math.max((nextMission.target || 0) - (nextMission.progress || 0), 0)
    : 0;
  const nextMissionMeasure =
    nextMissionRemaining === 1
      ? nextMission?.measureSingular
      : nextMission?.measurePlural || "results";
  const uniqueWeeklyWinners = [
    ...new Set(
      weekSessions
        .filter((session) => session.winner)
        .map((session) => session.winner),
    ),
  ].length;

  if (openCount > 0 || !players.length || !weekSessions.length) {
    return {
      mode: "core",
      missions,
      clearedCount,
      openCount,
      hottestMission,
      nextMission,
      title:
        openCount === 1 && nextMission
          ? `${nextMission.label} is the last open objective still changing the week`
          : hottestMission
            ? `${hottestMission.label} is pulling hardest on the room right now`
            : `${openCount} live objectives are still shaping the week`,
      subline: hottestMission
        ? `${clearedCount} CLEARED · ${openCount} LIVE · ${nextMissionRemaining} ${nextMissionMeasure.toUpperCase()} LEFT`
        : `${clearedCount} CLEARED · ${openCount} LIVE`,
      supportLines: [],
    };
  }

  const currentSeason =
    SEASONS.find((season) => latestDate >= season.start && latestDate <= season.end) || null;
  const currentSeasonId = currentSeason?.id || "all";
  const weekRows = allStats(players, weekSessions)
    .filter((player) => player.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);
  const weekKills = [...weekRows].sort(
    (left, right) => right.kills - left.kills || right.wins - left.wins,
  );
  const seasonPressure = getOnDeckPressure(sessions, players, {
    seasonId: currentSeasonId,
    period: "week",
    limit: 4,
  });
  const adaptiveMissions = [];
  const supportLines = [];
  const usedPlayers = new Set();
  const addMission = (mission) => {
    if (!mission || adaptiveMissions.length >= 3) {
      return false;
    }
    const playerIds = mission.players || [];
    if (playerIds.some((playerId) => usedPlayers.has(playerId))) {
      return false;
    }
    adaptiveMissions.push(mission);
    playerIds.forEach((playerId) => usedPlayers.add(playerId));
    return true;
  };

  const winBenchmark = seasonPressure.items.find((item) => item.type === "wins-benchmark");
  if (winBenchmark) {
    const gap = winBenchmark.gap || 0;
    const target = winBenchmark.benchmarkValue || ((winBenchmark.wins || 0) + gap);
    const progress = Math.max(target - gap, 0);
    const player = getPlayerById(buildPlayerIndex(players), winBenchmark.players?.[0]);
    if (player) {
      const missionState = createAdaptiveMissionState(progress, target, winBenchmark.color);
      addMission({
        icon: "⚡",
        color: winBenchmark.color,
        label: `${(winBenchmark.benchmarkLabel || "LIVE").toUpperCase()} WATCH`,
        desc: `${player.username} is ${gap} win${gap === 1 ? "" : "s"} from ${winBenchmark.benchmarkLabel || "the next rank"}`,
        progress,
        target,
        unit: `${progress}/${target} wins on file`,
        measureSingular: "win",
        measurePlural: "wins",
        clearedCopy: `${player.username} locked the benchmark and changed the room read.`,
        mood: gap === 1
          ? "One clean room flips the badge and changes how the week reads."
          : `${gap} more wins puts this file on a new line and changes who the room is talking about.`,
        footer: "BADGE IN SIGHT",
        players: [player.id],
        ...missionState,
      });
    }
  }

  const killLeader = weekKills[0] || null;
  const killChaser = weekKills[1] || null;
  if (
    killLeader &&
    killChaser &&
    killLeader.id !== killChaser.id &&
    killLeader.kills - killChaser.kills > 0 &&
    killLeader.kills - killChaser.kills <= 12
  ) {
    const gap = killLeader.kills - killChaser.kills;
    const leaderPlayer = players.find((player) => player.id === killLeader.id) || null;
    const chaserPlayer = players.find((player) => player.id === killChaser.id) || null;
    if (leaderPlayer && chaserPlayer) {
      const missionState = createAdaptiveMissionState(killChaser.kills, killLeader.kills, "#FF4D8F");
      addMission({
        icon: "💀",
        color: "#FF4D8F",
        label: "DAMAGE LINE",
        desc: `${chaserPlayer.username} is chasing ${leaderPlayer.username} on the weekly damage line`,
        progress: killChaser.kills,
        target: killLeader.kills,
        unit: `${killChaser.kills}/${killLeader.kills} kills on the week board`,
        measureSingular: "kill",
        measurePlural: "kills",
        clearedCopy: `${chaserPlayer.username} flipped the weekly damage line.`,
        mood:
          gap === 1
            ? "One more kill draws the weekly damage line level."
            : `${gap} kills turns the weekly damage lane over and puts a new name on top.`,
        footer: "TOP DAMAGE OPEN",
        players: [leaderPlayer.id, chaserPlayer.id],
        ...missionState,
      });
    }
  }

  for (let index = 1; index < Math.min(weekRows.length, 6); index += 1) {
    const upper = weekRows[index - 1];
    const chaser = weekRows[index];
    const gap = upper.wins - chaser.wins;
    if (
      gap <= 0 ||
      gap > 2 ||
      usedPlayers.has(upper.id) ||
      usedPlayers.has(chaser.id)
    ) {
      continue;
    }
    const upperPlayer = players.find((player) => player.id === upper.id) || null;
    const chaserPlayer = players.find((player) => player.id === chaser.id) || null;
    if (!upperPlayer || !chaserPlayer) {
      continue;
    }
    const rankLabel = formatOrdinal(index);
    const missionState = createAdaptiveMissionState(chaser.wins, upper.wins, chaserPlayer.color);
    if (
      addMission({
        icon: index <= 3 ? "👑" : "📈",
        color: chaserPlayer.color,
        label: index <= 3 ? "PODIUM WATCH" : "TABLE WATCH",
        desc: `${chaserPlayer.username} is chasing ${upperPlayer.username} for ${rankLabel} on the week board`,
        progress: chaser.wins,
        target: upper.wins,
        unit: `${chaser.wins}/${upper.wins} wins on the week board`,
        measureSingular: "win",
        measurePlural: "wins",
        clearedCopy: `${chaserPlayer.username} pulled the table level.`,
        mood:
          gap === 1
            ? `One clean win draws ${rankLabel} level and shakes the chase pack.`
            : `${gap} wins puts ${rankLabel} within reach and changes who the room is tracking next.`,
        footer: index <= 3 ? "PODIUM UNDER PRESSURE" : "TABLE UNDER PRESSURE",
        players: [upperPlayer.id, chaserPlayer.id],
        ...missionState,
      })
    ) {
      break;
    }
  }

  const killBenchmark = seasonPressure.items.find((item) => item.type === "kills-benchmark");
  if (adaptiveMissions.length < 3 && killBenchmark) {
    const gap = killBenchmark.gap || 0;
    const target = killBenchmark.benchmarkValue || ((killBenchmark.kills || 0) + gap);
    const progress = Math.max(target - gap, 0);
    const player = getPlayerById(buildPlayerIndex(players), killBenchmark.players?.[0]);
    if (player) {
      const missionState = createAdaptiveMissionState(progress, target, killBenchmark.color);
      addMission({
        icon: "🎯",
        color: killBenchmark.color,
        label: "KILL WATCH",
        desc: `${player.username} is ${gap} kill${gap === 1 ? "" : "s"} from ${target}`,
        progress,
        target,
        unit: `${progress}/${target} kills on file`,
        measureSingular: "kill",
        measurePlural: "kills",
        clearedCopy: `${player.username} broke the benchmark line.`,
        mood:
          gap === 1
            ? "One clean lobby locks the number and changes the read."
            : `${gap} more kills puts the benchmark on the board and changes the room read.`,
        footer: "BENCHMARK IN PLAY",
        players: [player.id],
        ...missionState,
      });
    }
  }

  const firstWinChasers = weekRows
    .filter((player) => player.wins === 0 && player.appearances >= 5)
    .sort(
      (left, right) =>
        right.appearances - left.appearances ||
        right.kills - left.kills,
    );
  if (adaptiveMissions.length < 3 && firstWinChasers.length) {
    const leader = firstWinChasers[0];
    const player = players.find((entry) => entry.id === leader.id) || null;
    if (player) {
      addMission({
        icon: "🎮",
        color: "#00E5FF",
        label: "FIRST BREAKTHROUGH",
        desc: `${player.username} is still chasing a first weekly win`,
        progress: 0,
        target: 1,
        unit: `${leader.appearances} lobbies played without a weekly win`,
        measureSingular: "win",
        measurePlural: "wins",
        clearedCopy: `${player.username} broke through and changed the board mood.`,
        mood: "One breakthrough win changes how the whole support pack feels.",
        footer: "FIRST WIN WATCH",
        players: [player.id],
        stateLabel: "LIVE WATCH",
        stateColor: "#00E5FF",
      });
    }
  }

  if (killBenchmark && !adaptiveMissions.some((mission) => mission.label === "KILL WATCH")) {
    supportLines.push(killBenchmark.shortText || killBenchmark.text);
  }

  if (firstWinChasers.length) {
    supportLines.push(
      firstWinChasers.length === 1
        ? `${firstWinChasers[0].username} is still chasing a first weekly win after ${firstWinChasers[0].appearances} lobbies.`
        : `${joinHumanNames(firstWinChasers.slice(0, 3).map((player) => player.username))} are still chasing a first weekly win this week.`,
    );
  }

  return {
    mode: "adaptive",
    missions: adaptiveMissions.slice(0, 3),
    clearedCount,
    openCount: adaptiveMissions.length,
    hottestMission: adaptiveMissions[0] || null,
    nextMission: adaptiveMissions[0] || null,
    title: "Core weekly board is cleared. Live watches stay open.",
    subline: `${weekSessions.length} LOBBIES THIS WEEK · ${uniqueWeeklyWinners} WINNERS ON FILE`,
    supportLines: supportLines.slice(0, 2),
  };
};

const formatShellUtcTime = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "17:00 UTC";
  }
  const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getUTCDay()];
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${weekday} ${hours}:${minutes} UTC`;
};

const getShellAlertCandidates = (state, options = {}) => {
  const nowUtc = options.nowUtc || todayStr();
  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const now = nowUtc instanceof Date ? nowUtc : new Date(nowUtc);
  const dailyOrdersState = getDailyOrdersScheduleState(now);
  const latestFallout = getLatestDayConsequences(sessions, players);
  const missionBoard = getMissionBoardState(sessions, players);
  const candidates = [];
  const pushCandidate = ({ level, title, line, source }) => {
    if (!title || !line || !source) {
      return;
    }
    candidates.push({
      level,
      title,
      line,
      source,
      priority:
        (SHELL_ALERT_PRIORITY[level] || 0) +
        (SHELL_ALERT_SOURCE_PRIORITY[source] || 0),
      dismissible: false,
    });
  };

  const falloutLine = latestFallout?.summary?.[0] || latestFallout?.consequences?.[0]?.shortText || "";
  if (falloutLine) {
    pushCandidate({
      level: "AFTERMATH",
      title: "AFTERMATH",
      line: falloutLine,
      source: "latest_fallout",
    });
  }

  const nextMission = missionBoard?.nextMission || null;
  const nextMissionRemaining = nextMission
    ? Math.max((nextMission.target || 0) - (nextMission.progress || 0), 0)
    : null;
  if (nextMission && nextMissionRemaining === 1) {
    pushCandidate({
      level: "FLASHPOINT",
      title: "FLASHPOINT",
      line: "One mission is one push from flipping the room.",
      source: "missions",
    });
  } else if (
    missionBoard &&
    ((missionBoard.mode === "adaptive" && missionBoard.missions?.length) || missionBoard.openCount > 0)
  ) {
    pushCandidate({
      level: "HOT",
      title: "HOT",
      line: "Mission Board is still carrying live room pressure.",
      source: "missions",
    });
  }

  if (dailyOrdersState.isActive) {
    pushCandidate({
      level: "WATCH",
      title: "WATCH",
      line: "Daily Orders are live in Combat File.",
      source: "daily_orders",
    });
  }

  pushCandidate({
    level: "QUIET",
    title: "QUIET",
    line: dailyOrdersState.isActive
      ? "No major flashpoint is open, but the room is still moving."
      : "Room is between cycles right now.",
    source: "system",
  });

  return candidates;
};

const rankShellAlertCandidates = (candidates) =>
  [...candidates]
    .sort((left, right) => right.priority - left.priority)
    .shift() || null;

export const getCurrentZoneMeta = (view) =>
  SHELL_ZONE_META[view] || SHELL_ZONE_META.fallback;

export const getGlobalShellAlert = (state, options = {}) =>
  rankShellAlertCandidates(getShellAlertCandidates(state, options)) || {
    level: "QUIET",
    title: "QUIET",
    line: "The room is between cycles right now.",
    source: "system",
    priority:
      SHELL_ALERT_PRIORITY.QUIET + SHELL_ALERT_SOURCE_PRIORITY.system,
    dismissible: false,
  };

export const getShellCycleChip = (state, options = {}) => {
  const nowUtc = options.nowUtc || todayStr();
  const now = nowUtc instanceof Date ? nowUtc : new Date(nowUtc);
  const dailyOrdersState = getDailyOrdersScheduleState(now);
  if (isLiveNow()) {
    return {
      kind: "cycle",
      label: "CYCLE",
      value: "ROOM LIVE NOW",
      tone: "hot",
      source: "schedule",
    };
  }
  if (!dailyOrdersState.isActive) {
    return {
      kind: "cycle",
      label: "CYCLE",
      value: "OFF WINDOW",
      tone: "quiet",
      source: "schedule",
    };
  }
  return {
    kind: "cycle",
    label: "CYCLE",
    value: `NEXT ROOM ${formatShellUtcTime(getNextSession())}`,
    tone: "watch",
    source: "schedule",
  };
};

export const getShellPressureChip = (state, options = {}) => {
  const nowUtc = options.nowUtc || todayStr();
  const now = nowUtc instanceof Date ? nowUtc : new Date(nowUtc);
  const activeAlert = options.activeAlert || null;
  const dailyOrdersState = getDailyOrdersScheduleState(now);
  const missionBoard = getMissionBoardState(state?.sessions || [], state?.players || []);

  if (
    activeAlert?.source !== "missions" &&
    missionBoard &&
    ((missionBoard.mode === "adaptive" && missionBoard.missions?.length) || missionBoard.openCount > 0)
  ) {
    return {
      kind: "pressure",
      label: "PRESSURE",
      value: "MISSION BOARD",
      tone: "watch",
      source: "missions",
    };
  }

  if (activeAlert?.source !== "daily_orders" && dailyOrdersState.isActive) {
    return {
      kind: "pressure",
      label: "PRESSURE",
      value: "DAILY ORDERS",
      tone: "watch",
      source: "daily_orders",
    };
  }

  return null;
};

export const getDaysActive = (playerId, sessions) =>
  [...new Set(sessions.filter((session) => session.attendees?.includes(playerId)).map((session) => session.date))].length;

export const getHeadToHead = (playerA, playerB, sessions) => {
  if (!playerA || !playerB || playerA === playerB) {
    return null;
  }

  const sharedSessions = sessions.filter(
    (session) =>
      session.attendees?.includes(playerA) && session.attendees?.includes(playerB),
  );
  const playerAWins = sharedSessions.filter(
    (session) => session.winner === playerA,
  ).length;
  const playerBWins = sharedSessions.filter(
    (session) => session.winner === playerB,
  ).length;
  const playerAKills = sharedSessions.reduce(
    (sum, session) => sum + (session.kills?.[playerA] || 0),
    0,
  );
  const playerBKills = sharedSessions.reduce(
    (sum, session) => sum + (session.kills?.[playerB] || 0),
    0,
  );
  const duels = sharedSessions.filter((session) => {
    const placements = session.placements || session.attendees;
    return (
      (placements[0] === playerA && placements[1] === playerB) ||
      (placements[0] === playerB && placements[1] === playerA)
    );
  });
  const playerADuels = duels.filter(
    (session) => (session.placements || session.attendees)[0] === playerA,
  ).length;

  return {
    shared: sharedSessions.length,
    aWins: playerAWins,
    bWins: playerBWins,
    aKills: playerAKills,
    bKills: playerBKills,
    duels: duels.length,
    aDuels: playerADuels,
    bDuels: duels.length - playerADuels,
  };
};

const RIVAL_OPS_MAX_SEASON_WINS_GAP = 3;
const RIVAL_OPS_MAX_SEASON_KILLS_GAP = 12;
const RIVAL_OPS_MIN_SHARED_SEASON_DAYS = 2;
const RIVAL_OPS_MAX_SEASON_RANK = 16;
const RIVAL_OPS_COOLDOWN_DAYS = 7;
const RIVAL_OPS_RESOLVED_HOLD_DAYS = 1;
const RIVAL_OPS_MAX_COLD_FILES = 8;

const emptyRivalOpsState = () => ({
  ops: [],
  selectedOpId: null,
  lastResolvedOpId: null,
});

const addDaysUtc = (dateString, amount) => {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().split("T")[0];
};

const getUtcDateString = (value) => String(value || todayStr()).split("T")[0];

const sameRivalOpsState = (left, right) =>
  JSON.stringify(left || emptyRivalOpsState()) ===
  JSON.stringify(right || emptyRivalOpsState());

export const getRivalPairId = (playerAId, playerBId) =>
  [playerAId, playerBId].sort().join(":");

const getCurrentRivalOpsSeasonId = (nowUtc = todayStr()) =>
  getSeasonForDate(getUtcDateString(nowUtc))?.id || null;

const buildSeasonRankMap = (players, seasonSessions) => {
  const sorted = allStats(players, seasonSessions)
    .filter((player) => player.appearances > 0)
    .sort((left, right) => right.wins - left.wins || right.kills - left.kills);

  return new Map(sorted.map((player, index) => [player.id, index + 1]));
};

const buildSharedSeasonDays = (seasonSessions, playerAId, playerBId) =>
  [...new Set(
    seasonSessions
      .filter(
        (session) =>
          session.attendees?.includes(playerAId) &&
          session.attendees?.includes(playerBId),
      )
      .map((session) => session.date),
  )].sort();

const isActiveThresholdPair = (pairPressure) =>
  Boolean(pairPressure) &&
  (
    pairPressure.seasonWinsGap <= 1 ||
    pairPressure.seasonKillsGap <= 6 ||
    pairPressure.rivalryScore >= 14
  );

export const getRivalOpsPairPressure = (
  state,
  playerAId,
  playerBId,
  nowUtc = todayStr(),
) => {
  if (!playerAId || !playerBId || playerAId === playerBId) {
    return null;
  }

  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const playerIndex = buildPlayerIndex(players);
  const playerA = getPlayerById(playerIndex, playerAId);
  const playerB = getPlayerById(playerIndex, playerBId);
  const currentSeasonId = getCurrentRivalOpsSeasonId(nowUtc);
  if (!playerA || !playerB || !currentSeasonId) {
    return null;
  }

  const seasonSessions = getSeasonSessions(sessions, currentSeasonId);
  if (!seasonSessions.length) {
    return null;
  }

  const seasonStats = allStats(players, seasonSessions);
  const playerAStats = seasonStats.find((player) => player.id === playerAId);
  const playerBStats = seasonStats.find((player) => player.id === playerBId);
  if (!playerAStats?.appearances || !playerBStats?.appearances) {
    return null;
  }

  const seasonRivals = getRivals(seasonSessions);
  const rivalryRow = seasonRivals.find(
    (entry) => getRivalPairId(entry.p1, entry.p2) === getRivalPairId(playerAId, playerBId),
  );
  if (!rivalryRow) {
    return null;
  }

  const rankMap = buildSeasonRankMap(players, seasonSessions);
  const headToHead = getHeadToHead(playerAId, playerBId, seasonSessions);
  const sharedSeasonDays = buildSharedSeasonDays(seasonSessions, playerAId, playerBId);
  const seasonWinsGap = Math.abs(playerAStats.wins - playerBStats.wins);
  const seasonKillsGap = Math.abs(playerAStats.kills - playerBStats.kills);
  const seasonRankGap =
    rankMap.has(playerAId) && rankMap.has(playerBId)
      ? Math.abs(rankMap.get(playerAId) - rankMap.get(playerBId))
      : null;
  const inTopBand =
    (rankMap.get(playerAId) || 999) <= RIVAL_OPS_MAX_SEASON_RANK &&
    (rankMap.get(playerBId) || 999) <= RIVAL_OPS_MAX_SEASON_RANK;

  const eligibilityReasons = [];
  if (seasonWinsGap <= RIVAL_OPS_MAX_SEASON_WINS_GAP) {
    eligibilityReasons.push("wins-tight");
  }
  if (seasonKillsGap <= RIVAL_OPS_MAX_SEASON_KILLS_GAP) {
    eligibilityReasons.push("kills-tight");
  }
  if (sharedSeasonDays.length >= RIVAL_OPS_MIN_SHARED_SEASON_DAYS) {
    eligibilityReasons.push("shared-days");
  }
  if (inTopBand) {
    eligibilityReasons.push("top-band");
  }

  const rivalryScore =
    (rivalryRow.total * 3) +
    Math.max(0, 6 - seasonWinsGap) +
    Math.max(0, 4 - Math.min(seasonKillsGap, 4)) +
    Math.min(sharedSeasonDays.length, 4);

  const eligible =
    inTopBand &&
    sharedSeasonDays.length >= RIVAL_OPS_MIN_SHARED_SEASON_DAYS &&
    (
      seasonWinsGap <= RIVAL_OPS_MAX_SEASON_WINS_GAP ||
      seasonKillsGap <= RIVAL_OPS_MAX_SEASON_KILLS_GAP
    );

  return {
    pairId: getRivalPairId(playerAId, playerBId),
    seasonId: currentSeasonId,
    playerAId,
    playerBId,
    playerAName: playerA.username,
    playerBName: playerB.username,
    seasonWinsGap,
    seasonKillsGap,
    seasonRankGap,
    sharedSeasonDays,
    sharedSeasonDayCount: sharedSeasonDays.length,
    recentSharedDay: sharedSeasonDays[sharedSeasonDays.length - 1] || null,
    rivalryScore,
    eligible,
    eligibilityReasons,
    rivalryTotal: rivalryRow.total,
    duelWinsA: headToHead?.aDuels || 0,
    duelWinsB: headToHead?.bDuels || 0,
  };
};

export const isRivalOpCoolingDown = (op, nowUtc = todayStr()) =>
  Boolean(op?.cooldownUntilUtc) && getUtcDateString(nowUtc) <= op.cooldownUntilUtc;

export const getRivalOpCooldownLabel = (op, nowUtc = todayStr()) => {
  if (!op?.cooldownUntilUtc) {
    return "";
  }
  if (!isRivalOpCoolingDown(op, nowUtc)) {
    return "Cooldown cleared.";
  }
  return `Cooldown clears ${op.cooldownUntilUtc}.`;
};

export const getRivalOpsCandidatePairs = (state, nowUtc = todayStr()) => {
  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const currentSeasonId = getCurrentRivalOpsSeasonId(nowUtc);
  if (!players.length || !sessions.length || !currentSeasonId) {
    return [];
  }

  const seasonSessions = getSeasonSessions(sessions, currentSeasonId);
  const rivalryRows = getRivals(seasonSessions);
  const storedByPair = new Map(
    normalizeRivalOpsState(state?.rivalOpsState).ops.map((op) => [op.pairId, op]),
  );

  const candidates = rivalryRows
    .map((row) => getRivalOpsPairPressure(state, row.p1, row.p2, nowUtc))
    .filter((row) => row?.eligible);

  return candidates
    .filter((row) => {
      const stored = storedByPair.get(row.pairId);
      if (!stored) {
        return true;
      }
      if (stored.state !== "cooldown") {
        return true;
      }
      if (!isRivalOpCoolingDown(stored, nowUtc)) {
        return !stored.resolutionDay || (row.recentSharedDay || "") > stored.resolutionDay;
      }
      return false;
    })
    .sort((left, right) =>
      right.rivalryScore - left.rivalryScore ||
      left.seasonWinsGap - right.seasonWinsGap ||
      left.seasonKillsGap - right.seasonKillsGap ||
      right.sharedSeasonDayCount - left.sharedSeasonDayCount,
    );
};

export const getRivalOpsAllPairPressure = (state, nowUtc = todayStr()) => {
  const players = state?.players || [];
  const sessions = state?.sessions || [];
  const currentSeasonId = getCurrentRivalOpsSeasonId(nowUtc);
  if (!players.length || !sessions.length || !currentSeasonId) {
    return [];
  }

  const seasonSessions = getSeasonSessions(sessions, currentSeasonId);
  return getRivals(seasonSessions)
    .map((row) => getRivalOpsPairPressure(state, row.p1, row.p2, nowUtc))
    .filter(Boolean)
    .sort((left, right) =>
      Number(right.eligible) - Number(left.eligible) ||
      Number(isActiveThresholdPair(right)) - Number(isActiveThresholdPair(left)) ||
      right.rivalryScore - left.rivalryScore ||
      left.seasonWinsGap - right.seasonWinsGap ||
      left.seasonKillsGap - right.seasonKillsGap ||
      right.sharedSeasonDayCount - left.sharedSeasonDayCount,
    );
};

export const armWatchRivalOp = (pair, nowUtc = todayStr()) => ({
  id: `rival-op-${pair.pairId}`,
  pairId: pair.pairId,
  seasonId: pair.seasonId,
  playerAId: pair.playerAId,
  playerBId: pair.playerBId,
  state: "watch",
  armedAtUtc: getUtcDateString(nowUtc),
});

export const activateRivalOp = (op, nowUtc = todayStr()) => ({
  ...op,
  state: "active",
  activatedAtUtc: op.activatedAtUtc || getUtcDateString(nowUtc),
});

export const enterRivalOpCooldown = (
  op,
  nowUtc = todayStr(),
  cooldownDays = RIVAL_OPS_COOLDOWN_DAYS,
) => ({
  ...op,
  state: "cooldown",
  cooldownUntilUtc: addDaysUtc(getUtcDateString(nowUtc), cooldownDays),
});

export const getRivalOpsResolutionWindow = (state, op) => {
  if (!op?.activatedAtUtc) {
    return null;
  }
  const sessions = state?.sessions || [];
  const seasonSessions = getSeasonSessions(sessions, op.seasonId);
  const nextSharedDay = [...new Set(
    seasonSessions
      .filter(
        (session) =>
          session.date > op.activatedAtUtc &&
          session.attendees?.includes(op.playerAId) &&
          session.attendees?.includes(op.playerBId),
      )
      .map((session) => session.date),
  )].sort()[0];

  if (!nextSharedDay) {
    return null;
  }

  const daySessions = seasonSessions.filter((session) => session.date === nextSharedDay);
  const playerADay = getStats(op.playerAId, daySessions);
  const playerBDay = getStats(op.playerBId, daySessions);
  const placementTotals = daySessions.reduce(
    (totals, session) => {
      const placements = session.placements || session.attendees || [];
      const aIndex = placements.indexOf(op.playerAId);
      const bIndex = placements.indexOf(op.playerBId);
      if (aIndex !== -1) {
        totals.aSum += aIndex + 1;
        totals.aCount += 1;
      }
      if (bIndex !== -1) {
        totals.bSum += bIndex + 1;
        totals.bCount += 1;
      }
      return totals;
    },
    { aSum: 0, aCount: 0, bSum: 0, bCount: 0 },
  );

  return {
    nextSharedDay,
    playerAStats: {
      wins: playerADay.wins,
      kills: playerADay.kills,
      averagePlacement: placementTotals.aCount
        ? Number((placementTotals.aSum / placementTotals.aCount).toFixed(2))
        : null,
    },
    playerBStats: {
      wins: playerBDay.wins,
      kills: playerBDay.kills,
      averagePlacement: placementTotals.bCount
        ? Number((placementTotals.bSum / placementTotals.bCount).toFixed(2))
        : null,
    },
  };
};

export const resolveRivalOpFromSessions = (state, op) => {
  const window = getRivalOpsResolutionWindow(state, op);
  if (!window) {
    return null;
  }

  const { playerAStats, playerBStats, nextSharedDay } = window;
  if (playerAStats.wins !== playerBStats.wins) {
    return {
      result: "won",
      winnerId: playerAStats.wins > playerBStats.wins ? op.playerAId : op.playerBId,
      resolutionReason: "wins",
      resolutionDay: nextSharedDay,
      playerAStats,
      playerBStats,
    };
  }
  if (playerAStats.kills !== playerBStats.kills) {
    return {
      result: "won",
      winnerId: playerAStats.kills > playerBStats.kills ? op.playerAId : op.playerBId,
      resolutionReason: "kills",
      resolutionDay: nextSharedDay,
      playerAStats,
      playerBStats,
    };
  }
  if (
    playerAStats.averagePlacement !== null &&
    playerBStats.averagePlacement !== null &&
    playerAStats.averagePlacement !== playerBStats.averagePlacement
  ) {
    return {
      result: "won",
      winnerId:
        playerAStats.averagePlacement < playerBStats.averagePlacement
          ? op.playerAId
          : op.playerBId,
      resolutionReason: "placement",
      resolutionDay: nextSharedDay,
      playerAStats,
      playerBStats,
    };
  }

  return {
    result: "standoff",
    winnerId: null,
    resolutionReason: "standoff",
    resolutionDay: nextSharedDay,
    playerAStats,
    playerBStats,
  };
};

export const resolveRivalOp = (op, outcome, nowUtc = todayStr()) => ({
  ...op,
  state: "resolved",
  winnerId: outcome.winnerId,
  result: outcome.result,
  resolutionReason: outcome.resolutionReason,
  resolutionDay: outcome.resolutionDay,
  resolvedAtUtc: getUtcDateString(nowUtc),
  cooldownUntilUtc: addDaysUtc(getUtcDateString(nowUtc), RIVAL_OPS_COOLDOWN_DAYS),
});

const normalizeRivalOpsState = (persisted) => {
  const next = persisted || emptyRivalOpsState();
  return {
    ops: Array.isArray(next.ops) ? next.ops.filter(Boolean) : [],
    selectedOpId: next.selectedOpId || next.ops?.[0]?.id || null,
    lastResolvedOpId: next.lastResolvedOpId || null,
  };
};

export const reconcileRivalOpsState = (state, nowUtc = todayStr()) => {
  const currentSeasonId = getCurrentRivalOpsSeasonId(nowUtc);
  const baseState = normalizeRivalOpsState(state?.rivalOpsState);
  if (!currentSeasonId) {
    return emptyRivalOpsState();
  }

  const nextOps = [];
  const touchedPairIds = new Set();
  let lastResolvedOpId = baseState.lastResolvedOpId;

  const createNextOp = (candidate) =>
    isActiveThresholdPair(candidate)
      ? activateRivalOp(armWatchRivalOp(candidate, nowUtc), nowUtc)
      : armWatchRivalOp(candidate, nowUtc);

  baseState.ops.forEach((stored) => {
    if (!stored || stored.seasonId !== currentSeasonId) {
      return;
    }

    const storedPressure = getRivalOpsPairPressure(
      state,
      stored.playerAId,
      stored.playerBId,
      nowUtc,
    );

    touchedPairIds.add(stored.pairId);

    if (stored.state === "watch" || stored.state === "active") {
      if (!storedPressure?.eligible) {
        return;
      }
      if (stored.state === "watch" && isActiveThresholdPair(storedPressure)) {
        nextOps.push(activateRivalOp(stored, nowUtc));
        return;
      }
      if (stored.state === "active") {
        const outcome = resolveRivalOpFromSessions(state, stored);
        if (outcome) {
          const resolved = resolveRivalOp(stored, outcome, nowUtc);
          nextOps.push(resolved);
          lastResolvedOpId = resolved.id;
          return;
        }
      }
      nextOps.push(stored);
      return;
    }

    if (stored.state === "resolved") {
      const resolvedAt =
        stored.resolvedAtUtc || stored.resolutionDay || getUtcDateString(nowUtc);
      if (getUtcDateString(nowUtc) > addDaysUtc(resolvedAt, RIVAL_OPS_RESOLVED_HOLD_DAYS - 1)) {
        nextOps.push(enterRivalOpCooldown(stored, resolvedAt));
      } else {
        nextOps.push(stored);
      }
      lastResolvedOpId = stored.id;
      return;
    }

    if (stored.state === "cooldown") {
      if (isRivalOpCoolingDown(stored, nowUtc)) {
        nextOps.push(stored);
        return;
      }
      if (
        storedPressure?.eligible &&
        (!stored.resolutionDay || (storedPressure.recentSharedDay || "") > stored.resolutionDay)
      ) {
        nextOps.push(createNextOp(storedPressure));
      }
    }
  });

  getRivalOpsCandidatePairs({ ...state, rivalOpsState: baseState }, nowUtc).forEach((candidate) => {
    if (touchedPairIds.has(candidate.pairId)) {
      return;
    }
    nextOps.push(createNextOp(candidate));
  });

  return {
    ops: nextOps.sort((left, right) => {
      const leftPressure = getRivalOpsPairPressure(state, left.playerAId, left.playerBId, nowUtc);
      const rightPressure = getRivalOpsPairPressure(state, right.playerAId, right.playerBId, nowUtc);
      const leftRank = left.state === "active" ? 0 : left.state === "watch" ? 1 : left.state === "resolved" ? 2 : 3;
      const rightRank = right.state === "active" ? 0 : right.state === "watch" ? 1 : right.state === "resolved" ? 2 : 3;
      return (
        leftRank - rightRank ||
        (rightPressure?.rivalryScore || 0) - (leftPressure?.rivalryScore || 0) ||
        (leftPressure?.seasonWinsGap || 99) - (rightPressure?.seasonWinsGap || 99) ||
        (leftPressure?.seasonKillsGap || 99) - (rightPressure?.seasonKillsGap || 99)
      );
    }),
    selectedOpId: baseState.selectedOpId || nextOps[0]?.id || null,
    lastResolvedOpId,
  };
};

export const getStoredRivalOps = (state) =>
  normalizeRivalOpsState(state?.rivalOpsState).ops;

export const getActiveRivalOp = (state, nowUtc = todayStr()) =>
  reconcileRivalOpsState(state, nowUtc).ops.find((op) => op.state === "active") || null;

export const getWatchRivalOps = (state, nowUtc = todayStr()) =>
  reconcileRivalOpsState(state, nowUtc).ops.filter((op) => op.state === "watch");

export const getResolvedRivalOpsEcho = (state, nowUtc = todayStr()) => {
  const reconciled = reconcileRivalOpsState(state, nowUtc);
  const op =
    reconciled.ops.find((entry) => entry.id === reconciled.lastResolvedOpId) ||
    reconciled.ops.find((entry) => entry.state === "resolved") ||
    null;
  if (!op) {
    return null;
  }
  const players = buildPlayerIndex(state?.players || []);
  const playerA = getPlayerById(players, op.playerAId);
  const playerB = getPlayerById(players, op.playerBId);
  const winner = getPlayerById(players, op.winnerId);
  if (!playerA || !playerB) {
    return null;
  }
  if (op.result === "standoff") {
    return {
      id: op.id,
      line: `Last file closed: ${playerA.username} and ${playerB.username} stayed level on the next shared night.`,
    };
  }
  if (!winner) {
    return null;
  }
  const loser = winner.id === playerA.id ? playerB : playerA;
  return {
    id: op.id,
    line: `Last file closed: ${winner.username} took the edge over ${loser.username} on the next shared night.`,
  };
};

export const getRivalOpsLifecycleState = (state, nowUtc = todayStr()) => {
  const reconciled = reconcileRivalOpsState(state, nowUtc);
  return {
    activeOp: reconciled.ops.find((op) => op.state === "active") || null,
    watchOps: reconciled.ops.filter((op) => op.state === "watch"),
    cooldownOps: reconciled.ops.filter((op) => op.state === "cooldown"),
    resolvedEcho: getResolvedRivalOpsEcho({ ...state, rivalOpsState: reconciled }, nowUtc),
  };
};

const getRivalOpsPairEdgeLine = (pairPressure) => {
  if (!pairPressure) {
    return "";
  }
  if (pairPressure.duelWinsA === pairPressure.duelWinsB) {
    return `Final-room edge is level at ${pairPressure.duelWinsA}-${pairPressure.duelWinsB}.`;
  }
  const leaderName =
    pairPressure.duelWinsA > pairPressure.duelWinsB
      ? pairPressure.playerAName
      : pairPressure.playerBName;
  return `${leaderName} leads the final-room edge ${Math.max(pairPressure.duelWinsA, pairPressure.duelWinsB)}-${Math.min(pairPressure.duelWinsA, pairPressure.duelWinsB)}.`;
};

const getRivalOpsMarker = (op, pairPressure) => {
  if (op?.state === "resolved" || op?.state === "cooldown") {
    return op.resolutionDay ? `CLOSED ${op.resolutionDay}` : "FILE CLOSED";
  }
  if ((pairPressure?.seasonWinsGap || 99) <= 1) {
    return pairPressure.seasonWinsGap === 0 ? "LEVEL WINS" : "1 WIN GAP";
  }
  if ((pairPressure?.seasonKillsGap || 99) <= 6) {
    return `${pairPressure.seasonKillsGap} KILL GAP`;
  }
  if (pairPressure?.sharedSeasonDayCount) {
    return `${pairPressure.sharedSeasonDayCount} SHARED NIGHTS`;
  }
  return `${pairPressure?.rivalryTotal || 0} FINAL ROOMS`;
};

const getRivalOpsStateLine = (op, pairPressure) => {
  if (op?.state === "active") {
    return "Live file on the next shared room.";
  }
  if (op?.state === "watch") {
    return "Close enough to turn live.";
  }
  if (op?.state === "resolved") {
    return "This file just closed.";
  }
  if (op?.state === "cooldown") {
    return "Cooling before it can reopen.";
  }
  if (pairPressure?.eligible) {
    return "Still sitting just outside watch.";
  }
  return "Lower heat, but still on the board.";
};

const getRivalOpsPressureLine = (op, pairPressure, players) => {
  if (!pairPressure) {
    return "";
  }
  const winner = getPlayerById(players, op?.winnerId);
  if (op?.state === "resolved") {
    if (op.result === "standoff") {
      return "The next shared room could not split them.";
    }
    if (winner && op.resolutionReason === "wins") {
      return `${winner.username} took the file on wins.`;
    }
    if (winner && op.resolutionReason === "kills") {
      return `${winner.username} took it on kills after the wins held level.`;
    }
    if (winner && op.resolutionReason === "placement") {
      return `${winner.username} took it on placement after the tie held deep.`;
    }
  }
  if (op?.state === "cooldown") {
    return op.cooldownUntilUtc
      ? `Reopens after ${op.cooldownUntilUtc} if fresh pressure lands.`
      : "Needs fresh pressure before it reopens.";
  }
  if (op?.state === "active") {
    if (pairPressure.seasonWinsGap <= 1) {
      return "One room can flip the season edge.";
    }
    if (pairPressure.seasonKillsGap <= 6) {
      return "Kills are still close enough to split this fast.";
    }
    return "The next shared room decides who owns the read.";
  }
  if (op?.state === "watch") {
    if (pairPressure.seasonWinsGap <= 1) {
      return "A one-room swing pushes this live.";
    }
    if (pairPressure.seasonKillsGap <= 6) {
      return "The damage line is still close enough to heat up.";
    }
    return "One sharper shared room would wake this up.";
  }
  if (pairPressure.eligible) {
    return "Still close enough to climb back into watch.";
  }
  return "The room remembers it, but the gap has cooled.";
};

const getRivalOpsWhyNowLine = (op, pairPressure) => {
  if (!pairPressure) {
    return "";
  }
  if (op?.state === "active") {
    return "The pair is still close enough that the next shared room can settle it cleanly.";
  }
  if (op?.state === "watch") {
    return "The season edge is still narrow enough for one room to turn this live.";
  }
  if (op?.state === "resolved") {
    return "The file closed, but the room still needs to prove that split will hold.";
  }
  if (op?.state === "cooldown") {
    return "The file is shut for now and will not reopen until a fresh shared room lands after cooldown.";
  }
  if (pairPressure.eligible) {
    return "This pair is still close enough to rise fast if they hit the same room again.";
  }
  return "The rivalry still has history, but the season gap has pushed it below the live tiers.";
};

const getRivalOpsSupportingLine = (pairPressure) => {
  if (!pairPressure) {
    return "";
  }
  const winLine =
    pairPressure.seasonWinsGap === 0
      ? "Season wins are level."
      : `Season wins are ${pairPressure.seasonWinsGap} apart.`;
  const sharedLine =
    pairPressure.sharedSeasonDayCount === 1
      ? "They have shared one season night."
      : `They have shared ${pairPressure.sharedSeasonDayCount} season nights.`;
  return `${winLine} ${sharedLine}`;
};

export const getRivalOpsCardModel = (state, source, nowUtc = todayStr()) => {
  const op = source?.op || null;
  const pairPressure =
    source?.pairPressure ||
    (op ? getRivalOpsPairPressure(state, op.playerAId, op.playerBId, nowUtc) : null);
  if (!pairPressure) {
    return null;
  }
  const players = buildPlayerIndex(state?.players || []);
  const playerA = getPlayerById(players, pairPressure.playerAId);
  const playerB = getPlayerById(players, pairPressure.playerBId);
  if (!playerA || !playerB) {
    return null;
  }

  const stateKey =
    op?.state ||
    (pairPressure.eligible
      ? isActiveThresholdPair(pairPressure)
        ? "active"
        : "watch"
      : "cold");

  return {
    id: op?.id || `rival-pair-${pairPressure.pairId}`,
    pairId: pairPressure.pairId,
    playerAId: playerA.id,
    playerBId: playerB.id,
    playerALabel: playerA.username,
    playerBLabel: playerB.username,
    state: stateKey,
    scoreLine: `${pairPressure.duelWinsA}-${pairPressure.duelWinsB}`,
    stateLine: getRivalOpsStateLine(op, pairPressure),
    pressureLine: getRivalOpsPressureLine(op, pairPressure, players),
    marker: getRivalOpsMarker(op, pairPressure),
    rivalryScore: pairPressure.rivalryScore,
  };
};

export const getRivalOpsDetailModel = (state, source, nowUtc = todayStr()) => {
  const op = source?.op || null;
  const pairPressure =
    source?.pairPressure ||
    (op ? getRivalOpsPairPressure(state, op.playerAId, op.playerBId, nowUtc) : null);
  const card = getRivalOpsCardModel(state, { op, pairPressure }, nowUtc);
  if (!card) {
    return null;
  }

  return {
    id: card.id,
    pairId: card.pairId,
    state: card.state,
    edgeLine: getRivalOpsPairEdgeLine(pairPressure),
    whyNowLine: getRivalOpsWhyNowLine(op, pairPressure),
    supportLine: getRivalOpsSupportingLine(pairPressure),
  };
};

export const getRivalOpsViewModel = (state, nowUtc = todayStr()) => {
  const reconciled = reconcileRivalOpsState(state, nowUtc);
  const pairPressureRows = getRivalOpsAllPairPressure(state, nowUtc);
  const opsByPair = new Map(reconciled.ops.map((op) => [op.pairId, op]));

  const activeCards = reconciled.ops
    .filter((op) => op.state === "active")
    .map((op) => getRivalOpsCardModel(state, { op }, nowUtc))
    .filter(Boolean);

  const watchCards = reconciled.ops
    .filter((op) => op.state === "watch")
    .map((op) => getRivalOpsCardModel(state, { op }, nowUtc))
    .filter(Boolean);

  const colderCards = [
    ...reconciled.ops
      .filter((op) => op.state === "resolved" || op.state === "cooldown")
      .map((op) => getRivalOpsCardModel(state, { op }, nowUtc))
      .filter(Boolean),
    ...pairPressureRows
      .filter((pairPressure) => !opsByPair.has(pairPressure.pairId))
      .map((pairPressure) => getRivalOpsCardModel(state, { pairPressure }, nowUtc))
      .filter(Boolean),
  ].slice(0, RIVAL_OPS_MAX_COLD_FILES);

  const allCards = [...activeCards, ...watchCards, ...colderCards];
  const selectedOpId =
    reconciled.selectedOpId && allCards.some((card) => card.id === reconciled.selectedOpId)
      ? reconciled.selectedOpId
      : allCards[0]?.id || null;
  const selectedCard = allCards.find((card) => card.id === selectedOpId) || null;
  const selectedSource = selectedCard
    ? {
        op: reconciled.ops.find((op) => op.id === selectedCard.id) || opsByPair.get(selectedCard.pairId) || null,
        pairPressure: pairPressureRows.find((pairPressure) => pairPressure.pairId === selectedCard.pairId) || null,
      }
    : null;

  if (!allCards.length) {
    return {
      activeCards: [],
      watchCards: [],
      colderCards: [],
      selectedOpId: null,
      detail: null,
      emptyState: {
        title: "NO LIVE FILE",
        line: "No rivalry is carrying enough heat to rise above the board right now.",
      },
    };
  }

  return {
    activeCards,
    watchCards,
    colderCards,
    selectedOpId,
    detail: selectedSource ? getRivalOpsDetailModel(state, selectedSource, nowUtc) : null,
    emptyState: null,
  };
};

export { sameRivalOpsState, emptyRivalOpsState };

export const getSeasonOneWrap = (sessions, players) => {
  const seasonOneSessions = getSeasonSessions(sessions, "s1");
  if (!seasonOneSessions.length) {
    return null;
  }

  const seasonOneStats = allStats(players, seasonOneSessions).filter(
    (player) => player.appearances > 0,
  );
  const byWins = [...seasonOneStats].sort(
    (left, right) => right.wins - left.wins || right.kills - left.kills,
  );
  const byKills = [...seasonOneStats].sort(
    (left, right) => right.kills - left.kills,
  );
  const byKd = [...seasonOneStats]
    .filter((player) => player.appearances >= 5)
    .sort((left, right) => right.kd - left.kd);
  const byAppearances = [...seasonOneStats].sort(
    (left, right) => right.appearances - left.appearances,
  );

  const midpoint = "2026-03-14";
  const earlyStats = allStats(
    players,
    seasonOneSessions.filter((session) => session.date < midpoint),
  ).filter((player) => player.appearances >= 3);
  const lateStats = allStats(
    players,
    seasonOneSessions.filter((session) => session.date >= midpoint),
  ).filter((player) => player.appearances >= 3);

  let mostImproved = null;
  let bestGain = -99;
  earlyStats.forEach((earlyPlayer) => {
    const latePlayer = lateStats.find((player) => player.id === earlyPlayer.id);
    if (!latePlayer) {
      return;
    }

    const gain = latePlayer.winRate - earlyPlayer.winRate;
    if (gain > bestGain) {
      bestGain = gain;
      mostImproved = {
        player: players.find((player) => player.id === earlyPlayer.id),
        earlyWR: earlyPlayer.winRate,
        lateWR: latePlayer.winRate,
        gain,
      };
    }
  });

  let topGame = { pid: "", k: 0, sid: "", date: "" };
  seasonOneSessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      if (kills > topGame.k) {
        topGame = { pid, k: kills, sid: session.id, date: session.date };
      }
    });
  });

  const dayKillMap = {};
  seasonOneSessions.forEach((session) => {
    Object.entries(session.kills || {}).forEach(([pid, kills]) => {
      const key = `${pid}|${session.date}`;
      dayKillMap[key] = (dayKillMap[key] || 0) + kills;
    });
  });

  const topDayKillsRaw = Object.entries(dayKillMap)
    .map(([key, kills]) => {
      const [pid, date] = key.split("|");
      return { pid, date, k: kills };
    })
    .sort((left, right) => right.k - left.k);

  const topDayKill = topDayKillsRaw[0] || null;
  const topDayKillsTopFive = topDayKillsRaw.slice(0, 5).map((entry) => ({
    ...entry,
    player: players.find((player) => player.id === entry.pid),
  }));

  const totalKills = seasonOneSessions.reduce(
    (sum, session) =>
      sum + Object.values(session.kills || {}).reduce((killsSum, kills) => killsSum + kills, 0),
    0,
  );
  const uniqueWins = [
    ...new Set(
      seasonOneSessions
        .filter((session) => session.winner)
        .map((session) => session.winner),
    ),
  ].length;
  const days = [...new Set(seasonOneSessions.map((session) => session.date))].length;

  return {
    sessions: seasonOneSessions.length,
    totalKills,
    uniqueWins,
    days,
    champion: byWins[0],
    topKiller: byKills[0],
    sharpshooter: byKd[0],
    loyalist: byAppearances[0],
    mostImproved,
    topGame,
    topGamePlayer: players.find((player) => player.id === topGame.pid),
    topDayKill,
    topDayKillPlayer: topDayKill
      ? players.find((player) => player.id === topDayKill.pid)
      : null,
    topDayKillsTop5: topDayKillsTopFive,
    podium: byWins.slice(0, 3),
  };
};

export const getSortedLeaderboard = ({
  players,
  sessions,
  seasonId = "all",
  period = "all",
  sortBy = "wins",
}) => {
  const sourceSessions = filterSessionsBySeason(sessions, seasonId);
  const scopedSessions = getPeriodSessions(sourceSessions, period);
  const base = allStats(players, scopedSessions);
  const ranked =
    seasonId === "all" && period === "all"
      ? base
      : base.filter((player) => player.appearances > 0);
  const scopedMetricById = {};

  if (sortBy === "carry" || sortBy === "consistency" || sortBy === "drought") {
    ranked.forEach((player) => {
      if (sortBy === "carry") {
        scopedMetricById[player.id] = getCarryScore(player.id, scopedSessions);
        return;
      }

      if (sortBy === "consistency") {
        scopedMetricById[player.id] = getConsistency(player.id, scopedSessions);
        return;
      }

      scopedMetricById[player.id] = getDrought(player.id, scopedSessions);
    });
  }

  return ranked.sort((left, right) => {
    if (sortBy === "wins") {
      return (
        right.wins - left.wins ||
        right.kills - left.kills ||
        right.appearances - left.appearances
      );
    }
    if (sortBy === "kills") {
      return right.kills - left.kills || right.wins - left.wins;
    }
    if (sortBy === "kd") {
      return right.kd - left.kd;
    }
    if (sortBy === "winrate") {
      return right.winRate - left.winRate;
    }
    if (sortBy === "appearances") {
      return right.appearances - left.appearances;
    }
    if (sortBy === "carry") {
      return scopedMetricById[right.id] - scopedMetricById[left.id];
    }
    if (sortBy === "consistency") {
      return scopedMetricById[right.id] - scopedMetricById[left.id];
    }
    if (sortBy === "drought") {
      return scopedMetricById[left.id] - scopedMetricById[right.id];
    }
    return (
      right.wins - left.wins ||
      right.kills - left.kills ||
      right.appearances - left.appearances
    );
  });
};
