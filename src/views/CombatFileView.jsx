import { BadgeFlip } from "./lazyViewComponents";

export default function CombatFileView({ ctx }) {
  const {
    profileId,
    players,
    sessions,
    setProfileId,
    getStats,
    getRank,
    getBadges,
    getLiveDayStreak,
    filterSessionsBySeason,
    activeCampaignId,
    activeCampaign,
    getFormGuide,
    getDrought,
    getCarryScore,
    getConsistency,
    getLastSeen,
    getDaysActive,
    getRivals,
    getBenchmark,
    getDailyOrdersForPlayer,
    dailyOrdersSchedule,
    dn,
    getPlayerLevel,
    getPlayerFileState,
    compareSessionsDesc,
    Avatar,
    renderPlayerIntel,
    getMilestones,
    go,
    setH2hA,
    setH2hB,
  } = ctx;

  const p = profileId ? players.find((x) => x.id === profileId) || players[0] : players[0];
  if (!p) return null;

  const st = getStats(p.id);
  const fileState = getPlayerFileState(p.id);
  const rank = getRank(p.id);
  const badges = getBadges(p.id);
  const liveDayStreak = getLiveDayStreak(p.id);
  const campaignName = activeCampaign?.name || "current campaign";
  const campaignShort = activeCampaign?.id ? activeCampaign.id.toUpperCase() : "SEASON";
  const campaignSess = filterSessionsBySeason(sessions, activeCampaignId);
  const campaignSt = getStats(p.id, campaignSess);
  const form = getFormGuide(p.id, 5);
  const drought = getDrought(p.id);
  const carry = getCarryScore(p.id);
  const consistency = getConsistency(p.id);
  const lastSeen = getLastSeen(p.id);
  const daysActive = getDaysActive(p.id);
  const pRivals = getRivals().filter((r) => r.p1 === p.id || r.p2 === p.id);
  const topRival = pRivals[0];
  const rivalId = topRival ? (topRival.p1 === p.id ? topRival.p2 : topRival.p1) : null;
  const rivalP = rivalId ? players.find((x) => x.id === rivalId) : null;
  const rivalSt = rivalP ? getStats(rivalP.id) : null;
  const rivalWins = topRival ? (topRival.p1 === p.id ? topRival.p1wins : topRival.p2wins) : 0;
  const rivalLoss = topRival ? (topRival.p1 === p.id ? topRival.p2wins : topRival.p1wins) : 0;
  const benchmark = getBenchmark(p.id);
  const dailyOrders = getDailyOrdersForPlayer(p.id);
  const dailyOrdersActive = dailyOrdersSchedule.isActive;
  const milestones = [
    { l: "1W", done: st.wins >= 1 },
    { l: "3W", done: st.wins >= 3 },
    { l: "10W", done: st.wins >= 10 },
    { l: "25W", done: st.wins >= 25 },
    { l: "50W", done: st.wins >= 50 },
    { l: "100W", done: st.wins >= 100 },
  ];
  const recentWins = form.filter((entry) => entry.win).length;
  const displayName = dn(p.username);
  const identityLine = (() => {
    if (st.appearances === 0) return `${displayName} is still an unopened file. The room has not had a real look yet.`;
    if (st.wins >= 10 && st.winRate >= 30) return `${displayName} reads like a proven closer. ${st.wins} wins on file and a ${st.winRate}% close rate keep this name near the front of the room.`;
    if (st.kd >= 1.8 && st.kills >= 30) return `${displayName} is a damage-first problem. ${st.kd} kills per lobby keeps this file dangerous even before the crown shows up.`;
    if (consistency >= 60 && st.appearances >= 8) return `${displayName} is one of the steadier reads in the room. This file is built on repeat solid finishes, not one lucky spike.`;
    if (st.appearances >= 15) return `${displayName} is part of the room's backbone. High attendance keeps this file involved in almost every shift the board remembers.`;
    if (st.winRate >= 25 && st.appearances >= 4) return `${displayName} looks like a live spoiler. The file is not huge yet, but the conversion rate is loud enough to matter.`;
    return `${displayName} is still defining the file. There is enough signal here to matter, but the full shape is still settling.`;
  })();
  const currentStateLine = (() => {
    if (st.appearances === 0) return "Current state is unknown because the room has not logged them yet.";
    if (liveDayStreak >= 3) return `Running hot right now. ${liveDayStreak} straight wins on the latest session day turned this file into live pressure.`;
    if (drought === 0 && st.wins > 0) return "Fresh off a win. The last room they touched ended with the crown in their hands.";
    if (drought >= 6) return `Under pressure. ${drought} lobbies without a win is the loudest part of the file right now.`;
    if (recentWins >= 3) return `Trending upward. ${recentWins} wins in the last five logged lobbies say the file is moving the right way.`;
    if (recentWins === 0 && form.length >= 4) return "Cold patch. The latest form line has gone quiet and everyone can see it.";
    if (campaignSt.appearances >= 3 && campaignSt.wins === 0) return `${campaignName} has stayed open so far. ${campaignSt.appearances} lobbies in and the file is gathering pressure rather than relief.`;
    return "Current form is unsettled. Enough signs to matter, not enough rhythm to relax.";
  })();
  const threatLine = (() => {
    if (st.appearances === 0) return "No threat profile yet because the file is still blank.";
    if (carry >= 3) return `The main threat is clean takeover potential. ${carry} carry wins means the damage and the crown often land together.`;
    if (st.biggestGame >= 6) return `${st.biggestGame} kills is the ceiling on file. If the early fights break their way, the room can disappear fast.`;
    if (st.kd >= 1.8 && st.kills >= 20) return `${st.kd} kills per lobby keeps the pressure constant. Even bad rooms still have to deal with their damage line.`;
    if (st.winRate >= 30 && st.appearances >= 8) return "Closing power is the threat. Once this file gets into the last stretch of a room, it tends to finish clean.";
    if (consistency >= 60 && st.appearances >= 8) return "Stable finishes are the danger. This file does not hand out many easy rooms.";
    return "The threat is timing. Even a thin file can turn a whole room if the opening arrives at the right moment.";
  })();
  const weaknessLine = (() => {
    if (st.appearances === 0) return "Weakness is still unknown. The room has not seen enough to pin one down.";
    if (st.wins === 0) return "The known weakness is the missing first close. Until that lands, every late room carries extra weight.";
    if (drought >= 5) return `The drought is real. ${drought} lobbies without a win turns every quiet finish into a talking point.`;
    if (consistency < 45 && st.appearances >= 8) return "The floor still drops out too often. The highs are real, but the off nights leave too much room for punishment.";
    if (campaignSt.appearances >= 4 && campaignSt.wins === 0) return `This campaign has not paid off yet. The room will keep pressing until the ${campaignName} file answers back.`;
    if (topRival && rivalP && rivalLoss > rivalWins) return `${dn(rivalP.username)} still has the read in the main duel at ${rivalLoss}-${rivalWins}. That matchup is not solved yet.`;
    if (st.appearances < 5) return "The file is still thin. One good night lifts it fast, but one bad one can blur the read again.";
    return "The weakness is drift. If the room drags long without an early swing, this file can lose control of the tempo.";
  })();
  const pressureLine = (() => {
    if (benchmark) {
      if (benchmark.sameWins) return `${dn(benchmark.target.username)} is the next file above on kills. ${Math.max(benchmark.killGap, 0)} more kill${Math.abs(benchmark.killGap) === 1 ? "" : "s"} changes that chase.`;
      return `${dn(benchmark.target.username)} is the next file above on wins. ${benchmark.winGap} more win${benchmark.winGap === 1 ? "" : "s"} closes the gap.`;
    }
    if (topRival && rivalP) return `${dn(rivalP.username)} remains the duel that explains this file best at ${rivalWins}-${rivalLoss} in ${topRival.total} meetings.`;
    if (campaignSt.wins > 0) return `${campaignSt.wins} of the wins on this file have come in ${campaignName}, so the room still has a fresh reason to keep checking back.`;
    return "There is no clean benchmark above them yet, so the next real jump writes a fresh target.";
  })();
  const livingState = fileState?.currentState || {
    label: "LIVE FILE",
    line: currentStateLine,
    color: p.color,
  };
  const livingPressure = fileState?.pressureLine || {
    label: "NEXT CHANGE",
    line: pressureLine,
    detail: "No clean board move is close enough to call yet.",
    color: "#7B8CDE",
  };
  const livingConflict = fileState?.conflict || {
    rivalId: null,
    rivalName: "No primary rival yet",
    playerWins: 0,
    rivalWins: 0,
    meetings: 0,
    playerSharedKills: 0,
    rivalSharedKills: 0,
    sharedWinLeader: "NONE",
    sharedKillLeader: "NONE",
    gapLine: "No duel is close enough to lead the file yet.",
    latestSharedNight: null,
    edgeLine: "No duel has enough repeated shape to lead the file.",
    nextSharedNight: "The next repeated matchup can start writing that case.",
    support: "Conflict stays quiet until the official rooms make it real.",
    color: "#7B8CDE",
  };
  const coreStats = fileState?.coreStats || [
    { label: "WINS", value: st.wins, color: "#FFD700" },
    { label: "KILLS", value: st.kills, color: "#FF4D8F" },
    { label: "WIN RATE", value: `${st.winRate}%`, color: "#00FF94" },
    { label: "LOBBIES", value: st.appearances, color: "#00E5FF" },
  ];
  const showPressureLine = livingPressure.concrete && livingPressure.targetId !== livingConflict.rivalId;
  const rivalryStats = [
    { label: "RIVAL", value: livingConflict.rivalName, color: livingConflict.color },
    { label: "DUEL EDGE", value: `${livingConflict.playerWins}-${livingConflict.rivalWins}`, color: livingConflict.color },
    { label: "MEETINGS", value: livingConflict.meetings, color: "#FFD700" },
    { label: "SHARED WINS", value: livingConflict.sharedWinLeader || "NONE", color: "#00E5FF" },
    { label: "SHARED KILLS", value: `${livingConflict.playerSharedKills}-${livingConflict.rivalSharedKills}`, color: "#FF4D8F" },
    { label: "LAST SHARED", value: livingConflict.latestSharedNight || "WAITING", color: "var(--text2)" },
  ];
  const lvlData = getPlayerLevel(p.id);
  const pSess = [...sessions].filter((s) => s.attendees?.includes(p.id)).sort(compareSessionsDesc);
  const sparkRaw = [...pSess].reverse().slice(-20);
  const spark = sparkRaw.map((s) => s.kills?.[p.id] || 0);
  const sparkMax = Math.max(...spark, 1);
  const yTicks = (() => {
    const step = sparkMax <= 5 ? 1 : sparkMax <= 10 ? 2 : 5;
    const t = [];
    for (let v = 0; v <= sparkMax; v += step) t.push(v);
    if (t[t.length - 1] < sparkMax) t.push(t[t.length - 1] + step);
    return t;
  })();
  const axisMax = yTicks[yTicks.length - 1];
  const PAD_L = 24;
  const PAD_T = 6;
  const PAD_B = 18;
  const PAD_R = 6;
  const W = 260;
  const H = 80;
  const CW = W - PAD_L - PAD_R;
  const CH = H - PAD_T - PAD_B;
  const xPos = (i) => PAD_L + Math.round((i / (spark.length - 1 || 1)) * CW);
  const yPos = (v) => PAD_T + Math.round(CH - (v / axisMax) * CH);
  const pts = spark.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");
  const diffDays = lastSeen ? Math.floor((new Date() - new Date(`${lastSeen}T12:00:00Z`)) / (1000 * 60 * 60 * 24)) : null;
  const lastSeenLabel = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : diffDays != null ? `${diffDays} days ago` : "Awaiting debut";
  const daysOnFileLabel = `${daysActive} ${daysActive === 1 ? "day" : "days"} on file`;

  return (
    <div className="fade-up combat-file-page zone-view-shell" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="zone-arrival-slice" style={{ "--arrive-delay": "40ms", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <span className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".3em", color: "rgba(0,229,255,.5)" }}>SECTOR: BARRACKS · COMBAT FILES</span>
          <span className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".2em", color: "var(--text3)" }}>{players.length} COMBATANTS REGISTERED</span>
        </div>
        <h2 className="bc9" style={{ fontSize: "clamp(2rem,8vw,3.5rem)", letterSpacing: ".08em", lineHeight: .9, color: "#00E5FF", textShadow: "0 0 28px rgba(0,229,255,.3)", margin: "0 0 8px" }}>COMBAT FILE</h2>
        <div style={{ height: 1, background: "linear-gradient(90deg,rgba(0,229,255,.44),transparent)" }} />
      </div>

      <div className="combat-file-selector zone-receive-follow" style={{ "--receive-delay": "100ms", marginBottom: 18 }}>
        <div className="bc7" style={{ fontSize: ".6rem", letterSpacing: ".3em", color: "var(--text3)", marginBottom: 10 }}>OPEN A FILE</div>
        <div className="combat-picker-shell">
          <div className="combat-selector" style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {players.map((pl) => (
              <button key={pl.id} onClick={() => { setProfileId(pl.id); }} style={{ background: p.id === pl.id ? `${pl.color}18` : "rgba(255,255,255,.02)", border: p.id === pl.id ? `1px solid ${pl.color}55` : "1px solid rgba(255,255,255,.06)", borderBottom: p.id === pl.id ? `2px solid ${pl.color}` : "2px solid transparent", color: p.id === pl.id ? pl.color : "var(--text3)", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: ".67rem", letterSpacing: ".1em", padding: "5px 11px", cursor: "pointer", outline: "none", transition: "all .12s" }}>
                <span className="hide-mob">{dn(pl.username).slice(0, 8).toUpperCase()}</span>
                <span className="show-mob combat-picker-label-mobile">{dn(pl.username)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={`dossier-open-${p.id}-${dailyOrdersSchedule.dayKey}-${dailyOrdersActive ? 1 : 0}`} className="dossier-open-shell zone-receive-anchor" style={{ "--receive-delay": "150ms" }}>
        <div className="combat-file-hero living-dossier-top dossier-open-step" style={{ "--dossier-delay": "0ms", background: `linear-gradient(135deg,${p.color}0e,rgba(0,0,0,.5))`, border: `1px solid ${p.color}33`, borderLeft: `4px solid ${p.color}`, borderRadius: "0 8px 8px 0", padding: "16px 16px 14px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -8, top: -8, fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: "7rem", color: p.color, opacity: .05, lineHeight: 1, pointerEvents: "none" }}>{p.username[0]}</div>
          <div className="living-dossier-identity" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "nowrap", position: "relative", zIndex: 1 }}>
            <Avatar p={p} size={60} glow intel={renderPlayerIntel(p)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".3em", color: `${p.color}66`, whiteSpace: "nowrap" }}>{rank.title}</div>
                <div className="bc7" style={{ fontSize: ".6rem", background: `${livingState.color}18`, borderRadius: 3, padding: "2px 8px", border: `1px solid ${livingState.color}44`, color: livingState.color, letterSpacing: ".08em", whiteSpace: "nowrap" }}>{livingState.label}</div>
              </div>
              <div className="bc9" style={{ color: p.color, fontSize: "clamp(1.2rem,5vw,1.9rem)", letterSpacing: ".06em", textShadow: `0 0 20px ${p.color}44`, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.host ? "👑 " : ""}{dn(p.username).toUpperCase()}</div>
              <div className="combat-file-summary" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <div className="bc7 combat-file-summary-chip" style={{ fontSize: ".65rem", color: "var(--text3)", letterSpacing: ".06em", whiteSpace: "nowrap" }}><span className="summary-copy">LAST SEEN {lastSeenLabel}</span></div>
                <div className="bc7 combat-file-summary-chip" style={{ fontSize: ".65rem", color: "var(--text3)", letterSpacing: ".06em", whiteSpace: "nowrap" }}><span className="summary-copy">{daysOnFileLabel.toUpperCase()}</span></div>
                <div className="combat-file-summary-chip level" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div className="bc9" style={{ fontSize: ".78rem", color: p.color, letterSpacing: ".1em", whiteSpace: "nowrap", flexShrink: 0 }}>LVL {lvlData.lvl}</div>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.12)", borderRadius: 2, overflow: "hidden", minWidth: 44 }}>
                    <div style={{ height: "100%", background: p.color, width: `${lvlData.progress}%`, borderRadius: 2, boxShadow: `0 0 6px ${p.color}88`, transition: "width .5s ease" }} />
                  </div>
                  <div className="bc7" style={{ fontSize: ".58rem", color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>{lvlData.xp}XP</div>
                </div>
              </div>
            </div>
          </div>

          <div className="living-dossier-read" style={{ position: "relative", zIndex: 1, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${p.color}18` }}>
            <div className="bc7" style={{ fontSize: ".55rem", letterSpacing: ".2em", color: `${livingState.color}aa`, marginBottom: 7 }}>LIVE READ</div>
            <div className="bc9" style={{ fontSize: "clamp(.98rem,3vw,1.16rem)", color: livingState.color, lineHeight: 1.25 }}>
              {fileState?.liveRead || identityLine}
            </div>
          </div>

          <div className="living-core-stats living-dossier-stats" style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 1, border: `1px solid ${p.color}14`, borderRadius: 2, overflow: "hidden", marginTop: 12 }}>
            {coreStats.map((item) => (
              <div key={item.label} style={{ padding: "12px 8px 11px", textAlign: "center", background: "rgba(255,255,255,.025)", borderRight: "1px solid rgba(255,255,255,.04)" }}>
                <div className="bc9" style={{ fontSize: "clamp(1rem,3vw,1.45rem)", color: item.color, lineHeight: 1, textShadow: `0 0 12px ${item.color}33` }}>{item.value}</div>
                <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".15em", color: "var(--text3)", marginTop: 5 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div className="living-duel-strip" style={{ position: "relative", zIndex: 1, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${livingConflict.color}22` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <div className="bc7" style={{ fontSize: ".55rem", letterSpacing: ".2em", color: `${livingConflict.color}bb` }}>DUEL PRESSURE</div>
              <div className="bc7" style={{ fontSize: ".62rem", color: "var(--text3)", letterSpacing: ".06em" }}>{livingConflict.gapLine}</div>
            </div>
            <div className="living-duel-rail" style={{ display: "flex", alignItems: "stretch", gap: 1, border: "1px solid rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
              {rivalryStats.map((item) => (
                <div key={item.label} style={{ flex: "1 1 0", minWidth: 0, padding: "9px 8px", background: "rgba(255,255,255,.025)", textAlign: "center", borderRight: "1px solid rgba(255,255,255,.04)" }}>
                  <div className="bc9" style={{ fontSize: ".82rem", color: item.color, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  <div className="bc7" style={{ fontSize: ".46rem", letterSpacing: ".1em", color: "var(--text3)", marginTop: 5 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {showPressureLine&&(
            <div className="living-dossier-pressure" style={{ position: "relative", zIndex: 1, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${livingPressure.color}20` }}>
              <div className="bc7" style={{ fontSize: ".55rem", letterSpacing: ".2em", color: `${livingPressure.color}bb`, marginBottom: 6 }}>{livingPressure.label}</div>
              <div className="bc7" style={{ fontSize: ".7rem", color: "var(--text2)", lineHeight: 1.6 }}>{livingPressure.line} {livingPressure.detail}</div>
            </div>
          )}
        </div>

        <div className="combat-file-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 1, border: `1px solid ${p.color}14`, borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
          {(() => {
            const dayMap = {};
            sessions.filter((s) => s.attendees?.includes(p.id)).forEach((s) => {
              dayMap[s.date] = (dayMap[s.date] || 0) + 1;
            });
            const maxDay = Object.values(dayMap).length ? Math.max(...Object.values(dayMap)) : 0;
            return [
              { l: `${campaignShort} WINS`, v: campaignSt.wins, c: "#00E5FF" },
              { l: "ALL WINS", v: st.wins, c: "#FFD700" },
              { l: "KILLS", v: st.kills, c: "#FF4D8F" },
              { l: "BEST GAME", v: `${st.biggestGame}K`, c: "#FF6B35" },
              { l: "WIN RATE", v: `${st.winRate}%`, c: "#00FF94" },
              { l: "K/G", v: st.kd, c: "#00E5FF" },
              { l: "MAX/DAY", v: `${maxDay}G`, c: "#C77DFF" },
              { l: "CARRY", v: carry, c: "#FF6B35" },
              { l: "CONSISTENCY", v: `${consistency}%`, c: "#00FF94" },
              { l: "DROUGHT", v: drought > 0 ? `${drought}G` : "ACTIVE", c: drought > 5 ? "#FF6B35" : drought > 0 ? "#FFD700" : "#00FF94" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "10px 6px", textAlign: "center", background: "rgba(255,255,255,.025)", borderRight: "1px solid rgba(255,255,255,.04)" }}>
                <div className="bc9" style={{ fontSize: "clamp(.9rem,3vw,1.35rem)", color: s.c, lineHeight: 1, textShadow: `0 0 12px ${s.c}33` }}>{s.v}</div>
                <div className="bc7" style={{ fontSize: ".5rem", letterSpacing: ".14em", color: "var(--text3)", marginTop: 4 }}>{s.l}</div>
              </div>
            ));
          })()}
        </div>

        <div className="combat-file-duo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: "0 6px 6px 0", borderLeft: `3px solid ${p.color}33` }}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "var(--text3)", marginBottom: 10 }}>RECENT FORM</div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {form.map((f, i) => (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: 1, background: f.win ? p.color : "rgba(255,255,255,.1)", boxShadow: f.win ? `0 0 7px ${p.color}66` : "none" }} />
              ))}
              <span className="bc7" style={{ fontSize: ".65rem", color: "var(--text3)", flexShrink: 0, marginLeft: 4 }}>{form.filter((f) => f.win).length}/5</span>
            </div>
            <div className="bc7" style={{ fontSize: ".6rem", color: "var(--text3)", marginTop: 8, letterSpacing: ".06em" }}>
              {form.filter((f) => f.win).length >= 4 ? "Running hot" : form.filter((f) => f.win).length >= 2 ? "Holding steady" : "Looking for a spark"}
            </div>
          </div>
          <div style={{ padding: "12px 14px", background: "linear-gradient(135deg,rgba(255,77,143,.06),rgba(0,0,0,.34))", border: "1px solid rgba(255,77,143,.18)", borderRadius: "0 6px 6px 0", borderLeft: "3px solid rgba(255,77,143,.45)" }}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "rgba(255,77,143,.66)", marginBottom: 8 }}>TACTICAL PROFILE</div>
            <div className="bc7" style={{ fontSize: ".68rem", color: "var(--text2)", lineHeight: 1.65, marginBottom: 7 }}>
              {fileState?.threat || threatLine}
            </div>
            <div className="bc7" style={{ fontSize: ".64rem", color: "var(--text3)", lineHeight: 1.6 }}>
              {fileState?.weakness || weaknessLine}
            </div>
          </div>
        </div>

        {(dailyOrders.length > 0 || !dailyOrdersActive) && (
          <div className="dossier-open-step" style={{ "--dossier-delay": "160ms", marginBottom: 12 }}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "var(--text3)", marginBottom: 10 }}>DAILY ORDERS</div>
            {dailyOrdersActive ? (
              <div className="combat-orders-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
                {dailyOrders.map((order, idx) => (
                  <div key={`${order.label}-${idx}`} style={{ background: `linear-gradient(135deg,${order.color}10,rgba(255,255,255,.025))`, border: `1px solid ${order.color}2c`, borderLeft: `3px solid ${order.color}`, borderRadius: "0 8px 8px 0", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{order.icon}</span>
                      <div className="bc7" style={{ fontSize: ".56rem", letterSpacing: ".22em", color: `${order.color}bb` }}>{order.label}</div>
                    </div>
                    <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.7, marginBottom: 8 }}>{order.text}</div>
                    <div className="bc7" style={{ fontSize: ".64rem", color: "var(--text3)", lineHeight: 1.65, letterSpacing: ".03em" }}>{order.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "linear-gradient(135deg,rgba(123,140,222,.1),rgba(255,255,255,.02))", border: "1px solid rgba(123,140,222,.24)", borderLeft: "3px solid rgba(123,140,222,.54)", borderRadius: "0 8px 8px 0", padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>🕘</span>
                  <div className="bc7" style={{ fontSize: ".56rem", letterSpacing: ".22em", color: "rgba(123,140,222,.9)" }}>{dailyOrdersSchedule.dormantTitle}</div>
                </div>
                <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.7, marginBottom: 8 }}>{dailyOrdersSchedule.dormantLead}</div>
                <div className="bc7" style={{ fontSize: ".64rem", color: "var(--text3)", lineHeight: 1.65, letterSpacing: ".03em" }}>{dailyOrdersSchedule.dormantNote}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: "0 6px 6px 0", borderLeft: `3px solid ${p.color}33`, marginBottom: 12 }}>
          <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "var(--text3)", marginBottom: 14 }}>CAREER PROGRESS · {milestones.filter((m) => m.done).length}/{milestones.length} MILESTONES</div>
          <div style={{ display: "flex", gap: 0 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ flex: 1, position: "relative" }}>
                {m.done && <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: ".48rem", color: p.color, whiteSpace: "nowrap", letterSpacing: ".08em" }}>{m.l}</div>}
                <div style={{ height: 4, background: m.done ? p.color : "rgba(255,255,255,.1)", borderRadius: i === 0 ? "2px 0 0 2px" : i === milestones.length - 1 ? "0 2px 2px 0" : 0, boxShadow: m.done ? `0 0 6px ${p.color}55` : "none", transition: "background .3s" }} />
                <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: ".5rem", color: m.done ? p.color : "var(--text3)", whiteSpace: "nowrap" }}>{m.done ? "✓" : "·"}</div>
              </div>
            ))}
          </div>
        </div>

        {(() => {
          const alerts = getMilestones(p.id);
          if (!alerts.length) return null;
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
              {alerts.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: `${m.color}12`, border: `1px solid ${m.color}33`, borderRadius: 4, padding: "6px 12px" }}>
                  <span style={{ fontSize: ".95rem" }}>{m.icon}</span>
                  <span className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", letterSpacing: ".04em" }}>{m.text}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {badges.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".22em", color: "var(--text3)", marginBottom: 10 }}>COMMENDATIONS · CLICK ANY BADGE TO REVEAL UNLOCK CONDITION</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {badges.map((b, bi) => <BadgeFlip key={bi} b={b} playerColor={p.color} />)}
            </div>
          </div>
        )}

        {spark.length > 1 && (
          <div style={{ padding: "14px 16px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "0 6px 6px 0", borderLeft: `3px solid ${p.color}33`, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="bc7" style={{ fontSize: ".6rem", letterSpacing: ".22em", color: "var(--text3)" }}>KILLS PER LOBBY · LAST {spark.length}</div>
              <div className="bc7" style={{ fontSize: ".7rem", color: p.color }}>PEAK {sparkMax}K</div>
            </div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
              <defs>
                <linearGradient id={`grad-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={p.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={p.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={PAD_L} y1={yPos(t)} x2={W - PAD_R} y2={yPos(t)} stroke="rgba(255,255,255,.07)" strokeWidth="1" strokeDasharray={t === 0 ? "0" : "3 3"} />
                  <text x={PAD_L - 4} y={yPos(t) + 3.5} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize="8" fontFamily="Barlow Condensed" fontWeight="700">{t}</text>
                </g>
              ))}
              <>
                <polygon points={`${xPos(0)},${PAD_T + CH} ${pts} ${xPos(spark.length - 1)},${PAD_T + CH}`} fill={`url(#grad-${p.id})`} />
                <polyline points={pts} fill="none" stroke={p.color} strokeWidth="1.8" strokeLinejoin="round" />
                {spark.map((v, i) => (
                  <circle key={i} cx={xPos(i)} cy={yPos(v)} r="2.5" fill={v === sparkMax ? p.color : "var(--bg)"} stroke={p.color} strokeWidth="1.5" />
                ))}
              </>
            </svg>
          </div>
        )}

        {!p.host && (
          <button onClick={() => { setH2hA(p.id); setH2hB(""); go("rivals"); setTimeout(() => document.querySelector(".h2h-scroll")?.scrollIntoView({ behavior: "smooth" }), 300); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,229,255,.08)", border: "1px solid rgba(0,229,255,.25)", borderRadius: 4, padding: "8px 16px", color: "#00E5FF", cursor: "pointer", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: ".72rem", letterSpacing: ".15em", marginBottom: 12 }}>
            ⚔️ OPEN FULL H2H COMPARISON
          </button>
        )}
      </div>
    </div>
  );
}
