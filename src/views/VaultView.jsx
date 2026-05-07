export default function VaultView({ ctx }) {
  const {
    sessions,
    players,
    getRecords,
    dn,
    Avatar,
    renderPlayerIntel,
    goProfile,
    getStats,
    getLobbyDateMarker,
    activeCampaign,
    SEASONS,
    go,
  } = ctx;
  const rec = getRecords();

  if (!rec) {
    return (
      <div className="fade-up" style={{ minHeight: "calc(100vh - 120px)" }}>
        <p style={{ color: "var(--text3)", textAlign: "center" }}>The Vault opens once the room has history worth keeping.</p>
      </div>
    );
  }

  const formatArchiveDate = (date, options = {}) => {
    if (!date) return "No date filed";
    return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...options,
    });
  };
  const getLobbyTotalKills = (session) =>
    Object.values(session?.kills || {}).reduce((sum, kills) => sum + (Number(kills) || 0), 0) +
    (Number(session?.unassignedKills) || 0);
  const getDayRows = (sourceSessions) => {
    const dayMap = {};
    sourceSessions.forEach((session) => {
      if (!dayMap[session.date]) {
        dayMap[session.date] = { date: session.date, lobbies: 0, kills: 0, winners: {}, players: {} };
      }
      dayMap[session.date].lobbies += 1;
      dayMap[session.date].kills += getLobbyTotalKills(session);
      if (session.winner) {
        dayMap[session.date].winners[session.winner] = (dayMap[session.date].winners[session.winner] || 0) + 1;
      }
      (session.attendees || []).forEach((playerId) => {
        dayMap[session.date].players[playerId] = true;
      });
    });
    return Object.values(dayMap);
  };
  const getSeasonFile = (season) => {
    const seasonSessions = sessions.filter((session) => session.date >= season.start && session.date <= season.end);
    const seasonPlayers = players
      .map((player) => ({ player, stats: getStats(player.id, seasonSessions) }))
      .filter((entry) => entry.stats.appearances > 0);
    const byWins = [...seasonPlayers].sort(
      (left, right) => right.stats.wins - left.stats.wins || right.stats.kills - left.stats.kills,
    );
    const byKills = [...seasonPlayers].sort(
      (left, right) => right.stats.kills - left.stats.kills || right.stats.wins - left.stats.wins,
    );
    const byAppearances = [...seasonPlayers].sort(
      (left, right) => right.stats.appearances - left.stats.appearances || right.stats.wins - left.stats.wins,
    );
    const dayRows = getDayRows(seasonSessions);
    const loudestDay =
      [...dayRows].sort(
        (left, right) => right.kills - left.kills || right.lobbies - left.lobbies || right.date.localeCompare(left.date),
      )[0] || null;
    const filedDays = dayRows.map((day) => day.date);
    const winnersByPlayer = {};
    seasonSessions.forEach((session) => {
      if (!session.winner) return;
      winnersByPlayer[session.winner] = winnersByPlayer[session.winner] || new Set();
      winnersByPlayer[session.winner].add(session.date);
    });
    const invincible = Object.entries(winnersByPlayer)
      .filter(([, dates]) => filedDays.length > 0 && filedDays.every((date) => dates.has(date)))
      .map(([playerId]) => players.find((player) => player.id === playerId))
      .filter(Boolean)[0] || null;
    const latestDate = seasonSessions.length
      ? [...seasonSessions].sort((left, right) => right.date.localeCompare(left.date))[0].date
      : "";
    const totalKills = seasonSessions.reduce((sum, session) => sum + getLobbyTotalKills(session), 0);

    return {
      season,
      mode: activeCampaign?.id === season.id ? "ACTIVE RECORD" : "SEALED ARCHIVE",
      sessions: seasonSessions,
      lobbies: seasonSessions.length,
      kills: totalKills,
      champion: byWins[0] || null,
      killLeader: byKills[0] || null,
      mostActive: byAppearances[0] || null,
      loudestDay,
      invincible,
      latestDate,
    };
  };

  const topWinP = players.find((p) => p.id === rec.topWinner[0]);
  const topKillP = players.find((p) => p.id === rec.topKiller[0]);
  const topGameP = players.find((p) => p.id === rec.topGame.pid);
  const topDayP = players.find((p) => p.id === rec.topDay.pid);
  const streakP = players.find((p) => p.id === rec.bestStreak.pid);
  const firstWinP = players.find((p) => p.id === rec.first?.winner);
  const topDayKillP = players.find((p) => p.id === rec.topDayKill?.pid);
  const latestFiledDate = sessions.length
    ? [...sessions].sort((left, right) => right.date.localeCompare(left.date))[0].date
    : "";
  const uniqueWinners = new Set(sessions.filter((session) => session.winner).map((session) => session.winner)).size;
  const sessionDays = getDayRows(sessions);
  const loudestKillDay =
    [...sessionDays].sort(
      (left, right) => right.kills - left.kills || right.lobbies - left.lobbies || right.date.localeCompare(left.date),
    )[0] || null;
  const busiestDay =
    [...sessionDays].sort(
      (left, right) => right.lobbies - left.lobbies || right.kills - left.kills || right.date.localeCompare(left.date),
    )[0] || null;
  const firstDate = rec.first?.date || "";
  const firstNight = sessionDays.find((day) => day.date === firstDate);
  const seasonFiles = (SEASONS || [])
    .filter((season) => ["s1", "s2", "s3"].includes(season.id))
    .map(getSeasonFile)
    .filter((file) => file.sessions.length > 0);

  const records = [
    { icon: "🏆", color: "#FFD700", title: "All-time crown line", player: topWinP, stat: `${rec.topWinner[1]} wins`, sub: "Permanent wins record across every filed lobby." },
    { icon: "💀", color: "#FF4D8F", title: "All-time damage line", player: topKillP, stat: `${rec.topKiller[1]} kills`, sub: "Permanent damage record across the full room file." },
    { icon: "☄️", color: "#FF6B35", title: "Highest single room", player: topGameP, stat: `${rec.topGame.k}K`, sub: `${rec.topGame.sid} on ${formatArchiveDate(rec.topGame.date)}.` },
    { icon: "🔥", color: "#FFD700", title: "Longest clean run", player: streakP, stat: `${rec.bestStreak.streak} straight`, sub: "Best consecutive lobby-win run on file." },
    { icon: "🌋", color: "#FF4D8F", title: "Loudest kill day", player: topDayKillP, stat: `${rec.topDayKill?.k || 0}K`, sub: rec.topDayKill?.date ? `${formatArchiveDate(rec.topDayKill.date)} individual damage record.` : "No damage day filed yet." },
    { icon: "📆", color: "#00E5FF", title: "Heaviest archive day", player: topDayP, stat: `${rec.topDay.count} lobbies`, sub: `${formatArchiveDate(rec.topDay.date)} attendance grind.` },
    { icon: "🧹", color: "#00FF94", title: "Best Lobby Wipe", player: players.find((p) => p.id === rec.bestLobbyWipe?.playerId), stat: rec.bestLobbyWipe ? `${rec.bestLobbyWipe.kills}K wipe` : "No wipe filed", sub: rec.bestLobbyWipe ? `${rec.bestLobbyWipe.lobbySize}-player room in ${rec.bestLobbyWipe.sessionId}.` : "Won with every possible kill in a 5+ player room." },
    { icon: "⚡", color: "#C77DFF", title: "First crown filed", player: firstWinP, stat: rec.first?.date ? formatArchiveDate(rec.first.date) : "Archive unopened", sub: rec.first?.id ? `${rec.first.id} opened the room record.` : "The opening crown is not filed yet." },
  ];

  const historicNightMap = new Map();
  const addHistoricNight = (id, night) => {
    if (!night?.date || historicNightMap.has(id)) return;
    historicNightMap.set(id, night);
  };
  addHistoricNight("loudest-kill-day", {
    date: loudestKillDay?.date,
    label: "Loudest kill day",
    value: loudestKillDay ? `${loudestKillDay.kills} kills` : "",
    note: loudestKillDay ? `${loudestKillDay.lobbies} lobbies filed.` : "",
    color: "#FF4D8F",
  });
  addHistoricNight("most-lobbies-day", {
    date: busiestDay?.date,
    label: "Most lobbies in a day",
    value: busiestDay ? `${busiestDay.lobbies} lobbies` : "",
    note: busiestDay ? `${busiestDay.kills} kills on the same file.` : "",
    color: "#00E5FF",
  });
  addHistoricNight("highest-single-room", {
    date: rec.topGame?.date,
    label: "Highest single-game kill spike",
    value: topGameP ? `${dn(topGameP.username)} · ${rec.topGame.k}K` : `${rec.topGame.k}K`,
    note: rec.topGame?.sid ? `${rec.topGame.sid} on ${formatArchiveDate(rec.topGame.date)}.` : "",
    color: "#FF6B35",
    player: topGameP,
  });
  addHistoricNight("first-night", {
    date: firstDate,
    label: "First ever night",
    value: firstNight ? `${firstNight.lobbies} lobbies filed` : "Opening file",
    note: firstWinP ? `${dn(firstWinP.username)} filed the first crown.` : "",
    color: "#C77DFF",
    player: firstWinP,
  });
  seasonFiles.forEach((file) => {
    addHistoricNight(`${file.season.id}-opener`, {
      date: file.season.start,
      label: `${file.season.name} opener`,
      value: file.sessions.some((session) => session.date === file.season.start)
        ? `${file.sessions.filter((session) => session.date === file.season.start).length} lobbies`
        : "No opener file",
      note: `${file.season.label} campaign origin.`,
      color: file.season.color,
    });
    if (file.sessions.some((session) => session.date === file.season.end)) {
      addHistoricNight(`${file.season.id}-final`, {
        date: file.season.end,
        label: `${file.season.name} final day`,
        value: `${file.sessions.filter((session) => session.date === file.season.end).length} lobbies`,
        note: file.mode === "SEALED ARCHIVE" ? "Final standings locked from this file." : "Active record remains open.",
        color: file.season.color,
      });
    }
  });
  const historicNights = [...historicNightMap.values()].filter((night) => night.date).slice(0, 8);

  return (
    <div className="fade-up vault-view-shell" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="vault-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <span className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".3em", color: "rgba(199,125,255,.5)" }}>PERMANENT ARCHIVE</span>
          <button type="button" onClick={() => go?.("hof")} className="bc7" style={{
            border: "1px solid rgba(199,125,255,.28)",
            background: "rgba(199,125,255,.08)",
            color: "#C77DFF",
            borderRadius: 999,
            padding: "7px 11px",
            fontSize: ".58rem",
            letterSpacing: ".16em",
            cursor: "pointer",
          }}>
            Open Legends Wing
          </button>
        </div>
        <h2 className="bc9" style={{ fontSize: "clamp(2rem,8vw,4rem)", letterSpacing: ".08em", lineHeight: .9, color: "#C77DFF", textShadow: "0 0 28px rgba(199,125,255,.3)", margin: "0 0 10px" }}>THE VAULT</h2>
        <div style={{ height: 1, background: "linear-gradient(90deg,rgba(199,125,255,.44),transparent)", marginBottom: 8 }} />
        <div className="bc7 vault-support-line" style={{ fontSize: ".72rem", letterSpacing: ".12em", color: "var(--text3)", lineHeight: 1.45, whiteSpace: "normal", overflowWrap: "break-word" }}>Official records, sealed campaigns, and nights with permanent archive weight.</div>
      </div>

      <div className="vault-archive-totals" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 1, border: "1px solid rgba(199,125,255,.15)", borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
        {[
          { l: "FILED SESSIONS", v: rec.totalSessions, c: "#FFD700" },
          { l: "RECORDED KILLS", v: rec.totalKills, c: "#FF4D8F" },
          { l: "ALL-TIME WINNERS", v: uniqueWinners, c: "#00FF94" },
          { l: "LATEST ARCHIVE DATE", v: latestFiledDate ? formatArchiveDate(latestFiledDate) : "Waiting", c: "#C77DFF" },
        ].map((stat, index) => (
          <div key={index} style={{ padding: "15px 12px", textAlign: "center", background: "rgba(255,255,255,.02)", borderRight: "1px solid rgba(255,255,255,.04)" }}>
            <div className="bc9" style={{ fontSize: "clamp(1.15rem,4vw,1.8rem)", color: stat.c, lineHeight: 1, textShadow: `0 0 14px ${stat.c}33` }}>{stat.v}</div>
            <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".18em", color: "var(--text3)", marginTop: 6 }}>{stat.l}</div>
          </div>
        ))}
      </div>

      <div className="vault-grid" style={{ marginBottom: 28 }}>
        {records.map((record, index) => (
          <div key={record.title} className="vault-card" style={{ "--vc": record.color, background: `linear-gradient(135deg,${record.color}0a,rgba(0,0,0,.4))`, animation: "fadeUp .4s ease both", animationDelay: `${index * .04}s`, cursor: record.player ? "pointer" : "default" }} onClick={() => record.player && goProfile(record.player.id)}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: `${record.color}88`, marginBottom: 8, textTransform: "uppercase" }}>{record.title}</div>
            {record.player && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, minWidth: 0 }}>
                <Avatar p={record.player} size={28} intel={renderPlayerIntel(record.player)} />
                <div className="bc9" style={{ fontSize: ".85rem", color: record.player.color, letterSpacing: ".04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.player.host ? "👑 " : ""}{dn(record.player.username)}</div>
              </div>
            )}
            <div className="bc9" style={{ fontSize: "clamp(1.35rem,4vw,1.9rem)", color: record.color, lineHeight: 1, marginBottom: 6, textShadow: `0 0 16px ${record.color}44` }}>{record.icon} {record.stat}</div>
            <div className="bc7" style={{ fontSize: ".64rem", color: "var(--text3)", letterSpacing: ".05em", lineHeight: 1.45 }}>{record.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "18px", marginBottom: 22, background: "linear-gradient(135deg,rgba(199,125,255,.08),rgba(0,0,0,.28))", border: "1px solid rgba(199,125,255,.22)", borderLeft: "3px solid rgba(199,125,255,.58)", borderRadius: "0 10px 10px 0" }}>
        <div className="bc7" style={{ fontSize: ".6rem", letterSpacing: ".24em", color: "rgba(199,125,255,.78)", marginBottom: 12 }}>SEASON RECORD FILES</div>
        <div className="vault-season-files-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
          {seasonFiles.map((file) => {
            const isActive = file.mode === "ACTIVE RECORD";
            const leader = file.champion?.player || null;
            const killLeader = file.killLeader?.player || null;
            const mostActive = file.mostActive?.player || null;
            const lines = file.season.id === "s1"
              ? [
                  leader ? `Champion: ${dn(leader.username)} · ${file.champion.stats.wins}W` : "Champion: Waiting",
                  killLeader ? `Kill leader: ${dn(killLeader.username)} · ${file.killLeader.stats.kills}K` : "Kill leader: Waiting",
                  mostActive ? `Most active file: ${dn(mostActive.username)} · ${file.mostActive.stats.appearances}G` : "Most active file: Waiting",
                  file.loudestDay ? `Loudest night: ${file.loudestDay.kills}K on ${formatArchiveDate(file.loudestDay.date)}` : "Loudest night: Waiting",
                ]
              : file.season.id === "s2"
                ? [
                    leader ? `Champion: ${dn(leader.username)} · ${file.champion.stats.wins}W` : "Champion: Waiting",
                    killLeader ? `Reaper: ${dn(killLeader.username)} · ${file.killLeader.stats.kills}K` : "Reaper: Waiting",
                    file.invincible ? `Invincible: ${dn(file.invincible.username)}` : "Invincible: Not earned",
                    file.loudestDay ? `Loudest night: ${file.loudestDay.kills}K on ${formatArchiveDate(file.loudestDay.date)}` : "Loudest night: Waiting",
                  ]
                : [
                    leader ? `Current leader: ${dn(leader.username)} · ${file.champion.stats.wins}W` : "Current leader: Waiting",
                    killLeader ? `Damage leader: ${dn(killLeader.username)} · ${file.killLeader.stats.kills}K` : "Damage leader: Waiting",
                    `Filed lobbies: ${file.lobbies}`,
                    file.latestDate ? `Latest filed day: ${formatArchiveDate(file.latestDate)}` : "Latest filed day: Waiting",
                  ];
            return (
              <div key={file.season.id} style={{
                padding: "14px 14px 15px",
                borderRadius: 12,
                border: `1px solid ${file.season.color}33`,
                borderTop: `3px solid ${file.season.color}`,
                background: `linear-gradient(135deg,${file.season.color}0d,rgba(0,0,0,.34))`,
              }}>
                <div className="bc7" style={{ fontSize: ".54rem", letterSpacing: ".22em", color: `${file.season.color}cc`, marginBottom: 6 }}>{file.mode}</div>
                <div className="bc9" style={{ fontSize: "1rem", color: file.season.color, marginBottom: 8 }}>{file.season.name} · {file.season.label}</div>
                <div className="vault-season-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6, marginBottom: 10 }}>
                  <div style={{ padding: "8px", background: "rgba(0,0,0,.3)", borderRadius: 8 }}>
                    <div className="bc9" style={{ color: "#00E5FF", fontSize: "1rem", lineHeight: 1 }}>{file.lobbies}</div>
                    <div className="bc7" style={{ color: "var(--text3)", fontSize: ".5rem", letterSpacing: ".16em" }}>LOBBIES</div>
                  </div>
                  <div style={{ padding: "8px", background: "rgba(0,0,0,.3)", borderRadius: 8 }}>
                    <div className="bc9" style={{ color: "#FF4D8F", fontSize: "1rem", lineHeight: 1 }}>{file.kills}</div>
                    <div className="bc7" style={{ color: "var(--text3)", fontSize: ".5rem", letterSpacing: ".16em" }}>KILLS</div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  {lines.map((line) => (
                    <div key={line} className="bc7" style={{ fontSize: ".66rem", color: "var(--text2)", lineHeight: 1.45 }}>{line}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "18px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,77,143,.15)", borderLeft: "3px solid rgba(255,77,143,.45)", borderRadius: "0 8px 8px 0" }}>
        <div className="bc9" style={{ fontSize: ".9rem", color: "#FF4D8F", letterSpacing: ".06em", marginBottom: 4 }}>HISTORIC NIGHTS</div>
        <div className="bc7" style={{ fontSize: ".7rem", color: "var(--text3)", marginBottom: 14, letterSpacing: ".06em" }}>Curated nights with official record meaning.</div>
        <div className="vault-historic-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8 }}>
          {historicNights.map((night) => {
            const marker = getLobbyDateMarker(night.date);
            return (
              <div key={`${night.label}-${night.date}`} onClick={() => night.player && goProfile(night.player.id)} style={{
                padding: "11px 12px",
                borderRadius: 10,
                border: `1px solid ${night.color}22`,
                borderLeft: `3px solid ${night.color}`,
                background: `linear-gradient(135deg,${night.color}0c,rgba(0,0,0,.28))`,
                cursor: night.player ? "pointer" : "default",
              }}>
                <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".18em", color: `${night.color}bb`, marginBottom: 6 }}>{night.label}</div>
                <div className="bc9" style={{ fontSize: ".9rem", color: night.color, lineHeight: 1.18, marginBottom: 5 }}>{marker?.icon ? `${marker.icon} ` : ""}{formatArchiveDate(night.date,{weekday:"short"})}</div>
                <div className="bc9" style={{ fontSize: ".82rem", color: "var(--text2)", lineHeight: 1.3 }}>{night.value}</div>
                {night.note&&(
                  <div className="bc7" style={{ fontSize: ".62rem", color: "var(--text3)", lineHeight: 1.45, marginTop: 5 }}>{night.note}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
