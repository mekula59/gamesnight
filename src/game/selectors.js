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
    badges.push({ icon: "🔥", label: `${streak} Streak`, hot: true });
  } else if (streak >= 2) {
    badges.push({ icon: "🔥", label: `${streak} Streak` });
  }

  if (stats.wins > 0) {
    badges.push({ icon: "🏆", label: "Winner" });
  }
  if (stats.appearances >= sessions.length && sessions.length >= 4) {
    badges.push({ icon: "📅", label: "Full House" });
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

  return {
    date: latestDate,
    topWinner: [...stats].sort(
      (left, right) => right.wins - left.wins || right.kills - left.kills,
    )[0],
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

  const daySessions = [...sessions]
    .filter((session) => session.date === latestDate)
    .sort(compareSessionsAsc);

  const streaks = {};
  daySessions.forEach((session) => {
    players.forEach((player) => {
      if (!session.attendees?.includes(player.id)) {
        return;
      }

      if (!streaks[player.id]) {
        streaks[player.id] = 0;
      }

      if (session.winner === player.id) {
        streaks[player.id] += 1;
      } else {
        streaks[player.id] = 0;
      }
    });
  });

  return players
    .filter((player) => (streaks[player.id] || 0) >= 2)
    .map((player) => ({ ...player, streak: streaks[player.id] }))
    .sort((left, right) => right.streak - left.streak);
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

  const topWinnerEntry = Object.entries(winMap).sort(
    (left, right) => right[1] - left[1],
  )[0];

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
  const winnersList = Object.entries(winMap)
    .sort((left, right) => right[1] - left[1])
    .map(([pid, wins]) => ({ pid, wins, player: players.find((player) => player.id === pid) }));

  return {
    date,
    sessions: daySessions,
    totalKills,
    uniquePlayers: uniquePlayers.length,
    topWinner: topWinnerEntry
      ? {
          pid: topWinnerEntry[0],
          wins: topWinnerEntry[1],
          player: players.find((player) => player.id === topWinnerEntry[0]),
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

  const biggestClimber = afterRanks
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
            : `${leaderPlayer.username} kept the ${activeSeason.name} lead with ${leaderDayWins} wins on the day.`,
        shortText:
          afterGap > beforeGap
            ? `${leaderPlayer.username} kept the lead at +${afterGap}.`
            : `${leaderPlayer.username} kept the lead.`,
      });
    }
  }

  if (biggestClimber?.player) {
    const climbLine =
      biggestClimber.afterRank <= 5
        ? `${biggestClimber.player.username} climbed into ${formatOrdinal(biggestClimber.afterRank)} on the all-time wins table.`
        : `${biggestClimber.player.username} climbed to ${formatOrdinal(biggestClimber.afterRank)} on the all-time wins table.`;
    pushConsequence(consequences, {
      type: "climbed",
      icon: "📈",
      color: "#00E5FF",
      priority: 95,
      text: climbLine,
      shortText: climbLine,
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
  let currentWinner = "";
  let currentLength = 0;
  let currentStart = null;
  let best = null;

  daySessions.forEach((session) => {
    if (!session.winner) {
      currentWinner = "";
      currentLength = 0;
      currentStart = null;
      return;
    }

    if (session.winner === currentWinner) {
      currentLength += 1;
    } else {
      currentWinner = session.winner;
      currentLength = 1;
      currentStart = session;
    }

    if (currentLength >= 2 && (!best || currentLength > best.length)) {
      best = {
        player: playerIndex[currentWinner] || null,
        length: currentLength,
        start: currentStart,
        end: session,
      };
    }
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

  const bestWinRun = getLongestWinRun(daySessions, playerIndex);
  if (bestWinRun?.player) {
    pushStoryline(
      `${bestWinRun.player.username} had the cleanest run of the day with ${bestWinRun.length} straight wins from ${getLobbyLabel(bestWinRun.start.id)} through ${getLobbyLabel(bestWinRun.end.id)}.`,
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
      text: `Finish ${seasonBenchmark.winGap === 1 ? "1 win" : `${seasonBenchmark.winGap} wins`} better than ${seasonBenchmark.target.username} today and pull level in Season 2.`,
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
    const scopeLabel = chase === seasonChaser ? "Season 2" : "all-time";
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
  const rivalOps = getRivalOpsLifecycleState(state, nowUtc);
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

  if (rivalOps.activeOp) {
    pushCandidate({
      level: "FLASHPOINT",
      title: "FLASHPOINT",
      line: "Rival Ops is live and resolves on the next shared night.",
      source: "rival_ops",
    });
  } else if (rivalOps.watchOps.length) {
    pushCandidate({
      level: "HOT",
      title: "HOT",
      line: "One rivalry file is heating up right now.",
      source: "rival_ops",
    });
  } else if (rivalOps.resolvedEcho?.line) {
    pushCandidate({
      level: "AFTERMATH",
      title: "AFTERMATH",
      line: rivalOps.resolvedEcho.line,
      source: "rival_ops",
    });
  } else if (rivalOps.cooldownOps.length) {
    pushCandidate({
      level: "WATCH",
      title: "WATCH",
      line: "The last live rivalry file is cooling off right now.",
      source: "rival_ops",
    });
  }

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
  const rivalOps = getRivalOpsLifecycleState(state, nowUtc);
  const missionBoard = getMissionBoardState(state?.sessions || [], state?.players || []);

  if (activeAlert?.source !== "rival_ops") {
    if (rivalOps.activeOp) {
      return {
        kind: "pressure",
        label: "PRESSURE",
        value: "RIVAL OPS LIVE",
        tone: "hot",
        source: "rival_ops",
      };
    }
    if (rivalOps.watchOps.length) {
      return {
        kind: "pressure",
        label: "PRESSURE",
        value: "RIVAL OPS WATCH",
        tone: "watch",
        source: "rival_ops",
      };
    }
  }

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
const RIVAL_OPS_MAX_VISIBLE = 1;
const RIVAL_OPS_COOLDOWN_DAYS = 7;
const RIVAL_OPS_RESOLVED_HOLD_DAYS = 1;

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
  const stored = state?.rivalOpsState?.ops?.[0] || null;

  const candidates = rivalryRows
    .map((row) => getRivalOpsPairPressure(state, row.p1, row.p2, nowUtc))
    .filter((row) => row?.eligible);

  return candidates
    .filter((row) => {
      if (!stored || stored.pairId !== row.pairId) {
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

const toSingleRivalOpState = (persisted) => {
  const next = persisted || emptyRivalOpsState();
  return {
    ops: next.ops?.length ? [next.ops[0]] : [],
    selectedOpId: next.selectedOpId || next.ops?.[0]?.id || null,
    lastResolvedOpId: next.lastResolvedOpId || null,
  };
};

export const reconcileRivalOpsState = (state, nowUtc = todayStr()) => {
  const currentSeasonId = getCurrentRivalOpsSeasonId(nowUtc);
  const baseState = toSingleRivalOpState(state?.rivalOpsState);
  if (!currentSeasonId) {
    return emptyRivalOpsState();
  }

  const stored = baseState.ops[0] || null;
  const candidates = getRivalOpsCandidatePairs({ ...state, rivalOpsState: baseState }, nowUtc);
  const topCandidate = candidates[0] || null;

  const createNextOp = (candidate) => {
    if (!candidate) {
      return emptyRivalOpsState();
    }
    const nextOp = isActiveThresholdPair(candidate)
      ? activateRivalOp(armWatchRivalOp(candidate, nowUtc), nowUtc)
      : armWatchRivalOp(candidate, nowUtc);
    return {
      ops: [nextOp],
      selectedOpId: nextOp.id,
      lastResolvedOpId: baseState.lastResolvedOpId,
    };
  };

  if (!stored) {
    return createNextOp(topCandidate);
  }

  if (stored.seasonId !== currentSeasonId) {
    return createNextOp(topCandidate);
  }

  const storedPressure = getRivalOpsPairPressure(
    state,
    stored.playerAId,
    stored.playerBId,
    nowUtc,
  );

  if ((stored.state === "watch" || stored.state === "active") && !storedPressure?.eligible) {
    return createNextOp(topCandidate);
  }

  if (stored.state === "watch" && storedPressure && isActiveThresholdPair(storedPressure)) {
    const activeOp = activateRivalOp(stored, nowUtc);
    return {
      ops: [activeOp],
      selectedOpId: activeOp.id,
      lastResolvedOpId: baseState.lastResolvedOpId,
    };
  }

  if (stored.state === "active") {
    const outcome = resolveRivalOpFromSessions(state, stored);
    if (outcome) {
      const resolved = resolveRivalOp(stored, outcome, nowUtc);
      return {
        ops: [resolved],
        selectedOpId: resolved.id,
        lastResolvedOpId: resolved.id,
      };
    }
    return baseState;
  }

  if (stored.state === "resolved") {
    const resolvedAt = stored.resolvedAtUtc || stored.resolutionDay || getUtcDateString(nowUtc);
    if (getUtcDateString(nowUtc) > addDaysUtc(resolvedAt, RIVAL_OPS_RESOLVED_HOLD_DAYS - 1)) {
      const cooled = enterRivalOpCooldown(stored, resolvedAt);
      return {
        ops: [cooled],
        selectedOpId: cooled.id,
        lastResolvedOpId: stored.id,
      };
    }
    return baseState;
  }

  if (stored.state === "cooldown") {
    if (isRivalOpCoolingDown(stored, nowUtc)) {
      return baseState;
    }
    const topAfterCooldown = candidates[0] || null;
    const canReopenSamePair =
      topAfterCooldown &&
      topAfterCooldown.pairId === stored.pairId &&
      (!stored.resolutionDay || (topAfterCooldown.recentSharedDay || "") > stored.resolutionDay);
    if (canReopenSamePair) {
      return createNextOp(topAfterCooldown);
    }
    if (topAfterCooldown && topAfterCooldown.pairId !== stored.pairId) {
      return createNextOp(topAfterCooldown);
    }
    return {
      ops: [],
      selectedOpId: null,
      lastResolvedOpId: baseState.lastResolvedOpId,
    };
  }

  return baseState;
};

export const getStoredRivalOps = (state) =>
  toSingleRivalOpState(state?.rivalOpsState).ops;

export const getActiveRivalOp = (state, nowUtc = todayStr()) =>
  reconcileRivalOpsState(state, nowUtc).ops.find((op) => op.state === "active") || null;

export const getWatchRivalOps = (state, nowUtc = todayStr()) =>
  reconcileRivalOpsState(state, nowUtc).ops.filter((op) => op.state === "watch");

export const getResolvedRivalOpsEcho = (state, nowUtc = todayStr()) => {
  const reconciled = reconcileRivalOpsState(state, nowUtc);
  const op = reconciled.ops[0] || null;
  if (!op || (op.state !== "resolved" && reconciled.lastResolvedOpId !== op.id)) {
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

export const getRivalOpsCardModel = (state, op, nowUtc = todayStr()) => {
  if (!op) {
    return null;
  }
  const players = buildPlayerIndex(state?.players || []);
  const playerA = getPlayerById(players, op.playerAId);
  const playerB = getPlayerById(players, op.playerBId);
  const pairPressure = getRivalOpsPairPressure(state, op.playerAId, op.playerBId, nowUtc);
  const winner = getPlayerById(players, op.winnerId);
  if (!playerA || !playerB) {
    return null;
  }

  const base = {
    id: op.id,
    pairId: op.pairId,
    playerAId: playerA.id,
    playerBId: playerB.id,
    playerALabel: playerA.username,
    playerBLabel: playerB.username,
    state: op.state,
    selectable: true,
    highlighted: true,
  };

  if (op.state === "watch") {
    return {
      ...base,
      stateChip: "WATCH",
      title: "FILE HEATING UP",
      missionLine: "One more shared night can open this duel.",
      pressureLine:
        pairPressure?.seasonWinsGap <= 1
          ? "The season gap is still close enough for one room to change the read."
          : "Both files are still close enough for the next shared night to matter.",
    };
  }

  if (op.state === "active") {
    return {
      ...base,
      stateChip: "ACTIVE",
      title: "RIVAL OP LIVE",
      missionLine: "Finish ahead on the next shared night to take this file.",
      pressureLine:
        pairPressure?.seasonKillsGap <= 6
          ? "Wins are still tight, and the room has not settled this one."
          : "One stronger room decides who owns this file next.",
    };
  }

  if (op.state === "resolved") {
    let missionLine = "No separation landed on the next shared night.";
    let pressureLine = "The duel held level and closed as a standoff.";
    if (op.result === "won" && winner) {
      if (op.resolutionReason === "wins") {
        missionLine = `${winner.username} took the next shared night on wins.`;
        pressureLine = "The file broke cleanly once the room closed.";
      } else if (op.resolutionReason === "kills") {
        missionLine = `${winner.username} took the next shared night on kills after the wins held level.`;
        pressureLine = "Damage was the line that finally separated them.";
      } else if (op.resolutionReason === "placement") {
        missionLine = `${winner.username} took the next shared night on placement after wins and kills tied.`;
        pressureLine = "The room stayed level until the finish order split it.";
      }
    }
    return {
      ...base,
      stateChip: "CLOSED",
      title: "FILE CLOSED",
      missionLine,
      pressureLine,
    };
  }

  if (op.state === "cooldown") {
    return {
      ...base,
      stateChip: "COOLDOWN",
      title: "WINDOW CLOSED",
      missionLine: "This file can reopen after the cooldown clears.",
      pressureLine: "The room needs fresh pressure before this duel goes live again.",
    };
  }

  return null;
};

export const getRivalOpsDetailModel = (state, op, nowUtc = todayStr()) => {
  const card = getRivalOpsCardModel(state, op, nowUtc);
  if (!card) {
    return null;
  }
  const players = buildPlayerIndex(state?.players || []);
  const playerA = getPlayerById(players, op.playerAId);
  const playerB = getPlayerById(players, op.playerBId);
  const pairPressure = getRivalOpsPairPressure(state, op.playerAId, op.playerBId, nowUtc);
  if (!playerA || !playerB) {
    return null;
  }

  return {
    id: card.id,
    pairId: card.pairId,
    header: `${playerA.username} vs ${playerB.username}`,
    stateChip: card.stateChip,
    title: "FILE READ",
    missionLine:
      op.state === "watch"
        ? "This pair is close enough to stay on the live board."
        : op.state === "active"
          ? "The next shared night is carrying the whole file now."
          : op.state === "resolved"
            ? "The room has already settled this file."
            : "This file is waiting on fresh pressure before it reopens.",
    pressureLine: card.pressureLine,
    ruleLabel: "RESOLUTION RULE",
    ruleLine: "The next shared night decides it on wins, then kills, then placement.",
    aftermathLine: op.state === "resolved" ? card.pressureLine : undefined,
    cooldownLine: op.state === "cooldown" ? getRivalOpCooldownLabel(op, nowUtc) : undefined,
    recentSharedDay: pairPressure?.recentSharedDay || null,
  };
};

export const getRivalOpsViewModel = (state, nowUtc = todayStr()) => {
  const reconciled = reconcileRivalOpsState(state, nowUtc);
  const op = reconciled.ops[0] || null;
  const cards = op ? [getRivalOpsCardModel(state, op, nowUtc)].filter(Boolean).slice(0, RIVAL_OPS_MAX_VISIBLE) : [];
  const selectedOpId =
    reconciled.selectedOpId && cards.find((card) => card.id === reconciled.selectedOpId)
      ? reconciled.selectedOpId
      : cards[0]?.id || null;
  const selectedOp = selectedOpId && op?.id === selectedOpId ? op : cards[0] ? op : null;
  const detail = selectedOp ? getRivalOpsDetailModel(state, selectedOp, nowUtc) : null;
  const resolvedEcho = getResolvedRivalOpsEcho({ ...state, rivalOpsState: reconciled }, nowUtc);

  if (!cards.length) {
    return {
      sectionLabel: "RIVAL OPS",
      introLine: "The conflict layer is quiet right now.",
      cards: [],
      selectedOpId: null,
      detail: null,
      resolvedEcho,
      emptyState: {
        title: "NO LIVE FILE",
        line: "No rivalry is hot enough to open right now.",
      },
    };
  }

  return {
    sectionLabel: "RIVAL OPS",
    introLine:
      op?.state === "watch"
        ? "One rivalry file is heating up right now."
        : op?.state === "active"
          ? "One rivalry file is live right now."
          : op?.state === "resolved"
            ? "One rivalry file just closed."
            : op?.state === "cooldown"
              ? "The last live rivalry file is cooling off right now."
              : "The conflict layer is quiet right now.",
    cards,
    selectedOpId,
    detail,
    resolvedEcho,
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
