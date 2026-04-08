import { SEASONS } from "./config";
import { todayStr } from "./time";

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

export const buildPlayerIndex = (players) =>
  Object.fromEntries(players.map((player) => [player.id, player]));

export const getPlayerById = (playerIndex, playerId) =>
  playerId ? playerIndex[playerId] ?? null : null;

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
  if (seasonId === "all") {
    return sessions;
  }

  const season = SEASONS.find((item) => item.id === seasonId);
  if (!season) {
    return sessions;
  }

  return sessions.filter(
    (session) => session.date >= season.start && session.date <= season.end,
  );
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

  if (sessions.some((session) => session.date === "2026-04-04" && session.attendees?.includes(playerId))) {
    badges.push({ icon: "🥚", label: "Easter Egg" });
  }

  if (stats.appearances >= 1) {
    badges.push({ icon: "🎂", label: "Day One" });
  }

  if (sessions.some((session) => session.date === "2026-04-03" && session.attendees?.includes(playerId))) {
    badges.push({ icon: "💪", label: "No Days Off" });
  }

  const seasonTwo = SEASONS.find((season) => season.id === "s2");
  if (seasonTwo) {
    const seasonTwoSessions = sessions.filter(
      (session) => session.date >= seasonTwo.start && session.date <= seasonTwo.end,
    );
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

  if (sessions.some((session) => session.date === "2026-04-01" && session.winner === playerId)) {
    badges.push({ icon: "🃏", label: "Fool's Crown", hot: true });
  }

  const seasonOneSessions = sessions.filter(
    (session) => session.date >= "2026-03-01" && session.date <= "2026-03-31",
  );
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
    killKing: killKings[0] || null,
    killKings,
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
      label: "FULL DEPLOYMENT",
      desc: "15 lobbies played this week",
      progress: Math.min(weeklySessions.length, lobbyTarget),
      target: lobbyTarget,
      unit: `${weeklySessions.length} of ${lobbyTarget} lobbies`,
    },
    {
      icon: "💀",
      color: "#FF4D8F",
      label: "KILL QUOTA",
      desc: "Community racks up 60 kills",
      progress: Math.min(weeklyKills, killTarget),
      target: killTarget,
      unit: `${weeklyKills} of ${killTarget} kills`,
    },
    {
      icon: "👑",
      color: "#FFD700",
      label: "THRONE CONTESTED",
      desc: "4 different winners claim a lobby",
      progress: Math.min(uniqueWinners, winnerTarget),
      target: winnerTarget,
      unit: `${uniqueWinners} of ${winnerTarget} winners`,
    },
  ];
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

  const killKing = killKingsList[0] || { pid: "", k: 0, sid: "", player: null };
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
    killKingsList,
    lobbies: daySessions.length,
    winnersList,
  };
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
  let sourceSessions = sessions;
  if (seasonId === "s1") {
    sourceSessions = sessions.filter(
      (session) => session.date >= "2026-03-01" && session.date <= "2026-03-31",
    );
  } else if (seasonId === "s2") {
    sourceSessions = sessions.filter(
      (session) => session.date >= "2026-04-01" && session.date <= "2026-04-30",
    );
  } else if (seasonId !== "all") {
    const season = SEASONS.find((entry) => entry.id === seasonId);
    if (season) {
      sourceSessions = sourceSessions.filter(
        (session) => session.date >= season.start && session.date <= season.end,
      );
    }
  }

  const base = allStats(players, sourceSessions);
  const ranked =
    seasonId === "all" && period === "all"
      ? base
      : base.filter((player) => player.appearances > 0);

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
      return getCarryScore(right.id, sourceSessions) - getCarryScore(left.id, sourceSessions);
    }
    if (sortBy === "consistency") {
      return getConsistency(right.id, sourceSessions) - getConsistency(left.id, sourceSessions);
    }
    if (sortBy === "drought") {
      return getDrought(left.id, sourceSessions) - getDrought(right.id, sourceSessions);
    }
    return (
      right.wins - left.wins ||
      right.kills - left.kills ||
      right.appearances - left.appearances
    );
  });
};
