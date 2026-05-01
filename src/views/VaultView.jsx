export default function VaultView({ ctx }) {
  const { sessions, players, getRecords, dn, Avatar, renderPlayerIntel, goProfile, getStats, getLobbyDateMarker } = ctx;
  const rec = getRecords();

  if (!rec) {
    return (
      <div className="fade-up" style={{ minHeight: "calc(100vh - 120px)" }}>
        <p style={{ color: "var(--text3)", textAlign: "center" }}>The Vault opens once the room has history worth keeping.</p>
      </div>
    );
  }

  const topWinP = players.find((p) => p.id === rec.topWinner[0]);
  const topKillP = players.find((p) => p.id === rec.topKiller[0]);
  const topGameP = players.find((p) => p.id === rec.topGame.pid);
  const topDayP = players.find((p) => p.id === rec.topDay.pid);
  const streakP = players.find((p) => p.id === rec.bestStreak.pid);
  const firstWinP = players.find((p) => p.id === rec.first?.winner);
  const topDayKillP = players.find((p) => p.id === rec.topDayKill?.pid);
  const legacyPulse = [
    topWinP ? `${dn(topWinP.username)} still owns the crown line at ${rec.topWinner[1]} wins` : null,
    topKillP && topKillP.id !== topWinP?.id ? `${dn(topKillP.username)} still drives the damage board at ${rec.topKiller[1]} kills` : null,
    streakP ? `${dn(streakP.username)} still holds the longest clean run at ${rec.bestStreak.streak} in a row` : null,
  ]
    .filter(Boolean)
    .join(". ")
    .concat(".");

  const records = [
    { icon: "🏆", color: "#FFD700", title: "Most Wins All Time", player: topWinP, stat: `${rec.topWinner[1]} wins`, sub: "Still the crown every closer is chasing" },
    { icon: "💀", color: "#FF4D8F", title: "Most Kills All Time", player: topKillP, stat: `${rec.topKiller[1]} kills`, sub: "The room's all-time damage line still runs through this file" },
    { icon: "☄️", color: "#FF6B35", title: "Highest Single Game", player: topGameP, stat: `${rec.topGame.k}K`, sub: `${rec.topGame.sid} · one burst the room still talks about from ${rec.topGame.date}` },
    { icon: "🔥", color: "#FF6B35", title: "Longest Win Streak", player: streakP, stat: `${rec.bestStreak.streak} in a row`, sub: "The cleanest run anyone has held together in one sitting" },
    { icon: "🌋", color: "#FF4D8F", title: "Most Kills in a Day", player: topDayKillP, stat: `${rec.topDayKill?.k || 0}K`, sub: rec.topDayKill?.date ? `${rec.topDayKill.date} · the loudest session day on file` : "The room is still waiting for that kind of eruption" },
    { icon: "📆", color: "#00E5FF", title: "Most Lobbies in a Day", player: topDayP, stat: `${rec.topDay.count} lobbies`, sub: `${rec.topDay.date} · the heaviest one-day grind the archive has seen` },
    { icon: "🎮", color: "#00FF94", title: "Total Sessions", player: null, stat: rec.totalSessions, sub: `${[...new Set(sessions.map((s) => s.date))].length} session days since the room first went live` },
    { icon: "⚡", color: "#C77DFF", title: "First Ever Win", player: firstWinP, stat: rec.first?.date || "Archive unopened", sub: rec.first?.id ? `In ${rec.first.id} · the crown that started the whole file` : "The opening crown is still waiting" },
  ];
  return (
    <div className="fade-up" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <span className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".3em", color: "rgba(199,125,255,.5)" }}>PERMANENT ARCHIVE</span>
          <span className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".2em", color: "var(--text3)" }}>{sessions.length} SESSIONS · SEASON ARCHIVE CURRENT</span>
        </div>
        <h2 className="bc9" style={{ fontSize: "clamp(2rem,8vw,4rem)", letterSpacing: ".08em", lineHeight: .9, color: "#C77DFF", textShadow: "0 0 28px rgba(199,125,255,.3)", margin: "0 0 10px" }}>THE VAULT</h2>
        <div style={{ height: 1, background: "linear-gradient(90deg,rgba(199,125,255,.44),transparent)", marginBottom: 8 }} />
        <div className="bc7" style={{ fontSize: ".72rem", letterSpacing: ".12em", color: "var(--text3)" }}>All-time marks that still change how the room talks</div>
      </div>
      <div>
        <div style={{ padding: "16px 18px", marginBottom: 18, background: "linear-gradient(135deg,rgba(199,125,255,.12),rgba(0,0,0,.38))", border: "1px solid rgba(199,125,255,.28)", borderLeft: "3px solid rgba(199,125,255,.55)", borderRadius: "0 8px 8px 0" }}>
          <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "rgba(199,125,255,.75)", marginBottom: 8 }}>LEGACY PULSE</div>
          <div className="bc7" style={{ fontSize: ".78rem", color: "var(--text2)", lineHeight: 1.7 }}>{legacyPulse}</div>
        </div>
        <div className="vault-grid" style={{ marginBottom: 28 }}>
          {records.map((r, i) => (
            <div key={i} className="vault-card" style={{ "--vc": r.color, background: `linear-gradient(135deg,${r.color}0a,rgba(0,0,0,.4))`, animation: "fadeUp .4s ease both", animationDelay: `${i * .06}s`, cursor: r.player ? "pointer" : "default" }} onClick={() => r.player && goProfile(r.player.id)}>
              <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: `${r.color}66`, marginBottom: 8, textTransform: "uppercase" }}>{r.title}</div>
              {r.player && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <Avatar p={r.player} size={28} intel={renderPlayerIntel(r.player)} />
                  <div className="bc9" style={{ fontSize: ".85rem", color: r.player.color, letterSpacing: ".04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.player.host ? "👑 " : ""}{dn(r.player.username)}</div>
                </div>
              )}
              <div className="bc9" style={{ fontSize: "clamp(1.4rem,4vw,2rem)", color: r.color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 16px ${r.color}44` }}>{r.icon} {r.stat}</div>
              <div className="bc7" style={{ fontSize: ".64rem", color: "var(--text3)", letterSpacing: ".05em" }}>{r.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 18px", marginBottom: 20, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,77,143,.15)", borderLeft: "3px solid rgba(255,77,143,.5)", borderRadius: "0 8px 8px 0" }}>
          <div className="bc9" style={{ fontSize: ".88rem", color: "#FF4D8F", letterSpacing: ".06em", marginBottom: 4 }}>💀 NIGHTS THE ROOM STILL BRINGS UP</div>
          <div className="bc7" style={{ fontSize: ".7rem", color: "var(--text3)", marginBottom: 16, letterSpacing: ".06em" }}>The loudest single-lobby spike from every session night on file</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[...new Set(sessions.map((s) => s.date))].sort().reverse().map((date, i) => {
              const daySess = sessions.filter((s) => s.date === date);
              let kkMax = 0;
              let kkPid = null;
              let kkSid = "";
              daySess.forEach((s) => {
                Object.entries(s.kills || {}).forEach(([pid, k]) => {
                  if (k > kkMax) {
                    kkMax = k;
                    kkPid = pid;
                    kkSid = s.id;
                  }
                });
              });
              const kkP = kkPid ? players.find((x) => x.id === kkPid) : null;
              const dd = new Date(`${date}T12:00:00Z`);
              const dayLabel = dd.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              const specialTag = getLobbyDateMarker(date)?.icon ? `${getLobbyDateMarker(date).icon} ` : "";
              const isLatest = i === 0;
              return (
                <div key={date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: isLatest ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.18)", borderLeft: `2px solid ${isLatest ? "rgba(255,77,143,.55)" : kkP ? `${kkP.color}22` : "rgba(255,255,255,.05)"}`, borderRadius: "0 4px 4px 0" }}>
                  <div style={{ minWidth: 78, flexShrink: 0 }}>
                    <div className="bc7" style={{ fontSize: ".68rem", color: isLatest ? "#FF4D8F" : "var(--text3)", letterSpacing: ".06em" }}>{specialTag}{dayLabel}</div>
                    <div className="bc7" style={{ fontSize: ".56rem", color: "var(--text3)", opacity: .55, marginTop: 1 }}>{daySess.length} lobbies</div>
                  </div>
                  {kkP && <Avatar p={kkP} size={26} intel={renderPlayerIntel(kkP)} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bc9" style={{ fontSize: ".84rem", lineHeight: 1.2, color: kkP?.color || "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: kkP ? "pointer" : "default" }} onClick={() => kkP && goProfile(kkP.id)}>
                      {kkP ? dn(kkP.username) : "Night stayed quiet"}
                    </div>
                    {kkMax > 0 && <div className="bc7" style={{ fontSize: ".62rem", color: "#FF4D8F", lineHeight: 1, marginTop: 2 }}>{kkMax}K · {kkSid}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 1, border: "1px solid rgba(199,125,255,.15)", borderRadius: 2, overflow: "hidden" }}>
          {[
            { l: "TOTAL SESSIONS", v: rec.totalSessions, c: "#FFD700" },
            { l: "TOTAL KILLS", v: rec.totalKills, c: "#FF4D8F" },
            { l: "ACTIVE PLAYERS", v: players.filter((p) => getStats(p.id).appearances > 0).length, c: "#00FF94" },
            { l: "UNIQUE WINNERS", v: [...new Set(sessions.filter((s) => s.winner).map((s) => s.winner))].length, c: "#FF6B35" },
            { l: "SESSION DAYS", v: [...new Set(sessions.map((s) => s.date))].length, c: "#00E5FF" },
            { l: "AVG PER DAY", v: rec.totalSessions ? Math.round(rec.totalSessions / [...new Set(sessions.map((s) => s.date))].length) : 0, c: "#C77DFF" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "14px 10px", textAlign: "center", background: "rgba(255,255,255,.02)", borderRight: "1px solid rgba(255,255,255,.04)" }}>
              <div className="bc9" style={{ fontSize: "clamp(1.2rem,4vw,1.8rem)", color: s.c, lineHeight: 1, textShadow: `0 0 14px ${s.c}33` }}>{s.v}</div>
              <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".18em", color: "var(--text3)", marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
