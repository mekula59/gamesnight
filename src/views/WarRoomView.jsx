import { MotionReveal } from "./lazyViewComponents";

export default function WarRoomView({ ctx }) {
  const {
    sessions,
    players,
    compareSessionsDesc,
    getLatestSessionDate,
    getLatestDayConsequences,
    getPlayer,
    getLatestDayHeatRun,
    getLobbyTotalKills,
    getLobbySearchHaystack,
    getLobbyTopDamage,
    hasCustomLobbyNote,
    getLobbyBeatTags,
    getLobbyDateMarker,
    getLobbyReport,
    formatLobbyDate,
    lobbySearch,
    lobbyFilter,
    lobbyDate,
    lobbyLimit,
    expandedSid,
    setExpandedSid,
    updateLobbyFilter,
    updateLobbyDate,
    updateLobbySearch,
    clearLobbyFilters,
    setLobbyLimit,
    setShareCard,
    goProfile,
    handleEditSession,
    handleDelSession,
    adminMode,
    card,
    lbl,
    inp,
    primaryBtn,
    Avatar,
    dn,
    activeCampaign,
  } = ctx;

  const archiveSessions = [...sessions].sort(compareSessionsDesc);
  const latestLobby = archiveSessions[0] || null;
  const latestArchiveDate = getLatestSessionDate();
  const latestIsCampaignOpener=Boolean(activeCampaign?.start&&latestArchiveDate===activeCampaign.start);
  const latestConsequences = getLatestDayConsequences(latestArchiveDate);
  const latestConsequenceLines = (latestConsequences?.summary || []).slice(0, 2);
  const latestWinner = latestLobby ? getPlayer(latestLobby.winner) : null;
  const liveHeat = getLatestDayHeatRun(latestArchiveDate) || null;
  const heatPlayer = liveHeat?.player || null;
  const loudestLobby = archiveSessions.length
    ? archiveSessions.reduce((best, session) =>
        getLobbyTotalKills(session) > getLobbyTotalKills(best) ? session : best,
      )
    : null;
  const loudestKills = loudestLobby ? getLobbyTotalKills(loudestLobby) : 0;
  const searchTerm = lobbySearch.trim().toLowerCase();
  let filtered = [...archiveSessions];
  if (lobbyFilter) filtered = filtered.filter((s) => s.attendees?.includes(lobbyFilter));
  if (lobbyDate) filtered = filtered.filter((s) => s.date === lobbyDate);
  if (searchTerm) filtered = filtered.filter((s) => getLobbySearchHaystack(s).includes(searchTerm));
  const visible = filtered.slice(0, lobbyLimit);
  const firstVisibleDate = visible[0]?.date || "";
  const archiveNights = new Set(filtered.map((s) => s.date)).size;
  const daySummary = filtered.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = { count: 0, kills: 0, wins: {} };
    }
    acc[session.date].count += 1;
    acc[session.date].kills += getLobbyTotalKills(session);
    if (session.winner) {
      acc[session.date].wins[session.winner] = (acc[session.date].wins[session.winner] || 0) + 1;
    }
    return acc;
  }, {});
  const activeTrail = [
    lobbyFilter ? `Operative: ${dn(getPlayer(lobbyFilter)?.username || "Unknown")}` : "",
    lobbyDate ? `Date: ${formatLobbyDate(lobbyDate, { day: "numeric", month: "short", year: "numeric" })}` : "",
    searchTerm ? `Search: ${lobbySearch.trim()}` : "",
  ].filter(Boolean);

  return (
    <div className="fade-up zone-view-shell" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <MotionReveal
          className="warroom-hero zone-receive-anchor"
          style={{
            "--receive-delay": "70ms",
            ...card({
              padding: "22px 20px",
              marginBottom: 4,
              overflow: "hidden",
              position: "relative",
              background:
                "linear-gradient(135deg,rgba(255,77,143,.14),rgba(25,15,61,.96) 55%,rgba(0,229,255,.08))",
            }),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "radial-gradient(circle at top right,rgba(255,77,143,.18),transparent 42%)",
            }}
          />
          <div
            className="bc7"
            style={{
              fontSize: ".65rem",
              letterSpacing: ".22em",
              color: "#FF9BC2",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Battle reports with consequences
          </div>
          <h2
            style={{
              fontFamily: "Fredoka One",
              fontSize: "clamp(2rem,8vw,3.2rem)",
              background: "linear-gradient(135deg,#FF4D8F,#C77DFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🎮 War Room
          </h2>
          <p style={{ color: "var(--text2)", marginTop: 8, fontSize: ".84rem", lineHeight: 1.7, maxWidth: 760 }}>
            {latestIsCampaignOpener
              ? `${activeCampaign.name} opened on ${formatLobbyDate(latestArchiveDate,{weekday:"short",day:"numeric",month:"short"})}. Read the newest campaign file first, then pull any older report.`
              : "The full session archive. Read the freshest rooms first, filter one operative or one day, and open any report to see how the room actually broke."}
          </p>
          <div
            className="warroom-hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 10,
              marginTop: 16,
            }}
          >
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>
                Latest close
              </div>
              <div className="bc9" style={{ fontSize: ".94rem", color: latestWinner?.color || "#FFD700", marginBottom: 4 }}>
                {latestWinner ? dn(latestWinner.username) : "No winner on file"}
              </div>
              <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.55 }}>
                {latestLobby ? `${latestLobby.id.toUpperCase()} on ${formatLobbyDate(latestLobby.date)}` : "Waiting on the next room to land."}
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>
                Heat check
              </div>
              <div className="bc9" style={{ fontSize: ".94rem", color: heatPlayer?.color || "#FF6B35", marginBottom: 4 }}>
                {heatPlayer ? `${dn(heatPlayer.username)} ${liveHeat.streak}W run` : "No live streak on file"}
              </div>
              <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.55 }}>
                {heatPlayer ? "Cleanest run on the latest filed day." : "The next room decides who heats up next."}
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>
                Loudest room
              </div>
              <div className="bc9" style={{ fontSize: ".94rem", color: "#FF4D8F", marginBottom: 4 }}>
                {loudestLobby ? `${loudestKills} kills` : "Archive still quiet"}
              </div>
              <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.55 }}>
                {loudestLobby ? `${loudestLobby.id.toUpperCase()} on ${formatLobbyDate(loudestLobby.date)}` : "The first explosion will mark this slot."}
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>
                Latest consequences
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {latestConsequenceLines.length ? (
                  latestConsequenceLines.map((line) => (
                    <div key={line} className="bc7" style={{ fontSize: ".72rem", color: "var(--text2)", lineHeight: 1.55 }}>
                      <span style={{ color: "#00FF94", marginRight: 7 }}>▸</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="bc7" style={{ fontSize: ".72rem", color: "var(--text3)", lineHeight: 1.55 }}>
                    The last session day moved the totals, but no clear consequence line held long enough to pin here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </MotionReveal>

        <MotionReveal
          className="warroom-filter-card zone-receive-follow"
          delay={80}
          style={{ "--receive-delay": "150ms", ...card({ padding: 18, marginBottom: 2, border: "1.5px solid rgba(255,77,143,.18)" }) }}
        >
          <div className="warroom-filter-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div className="bc7" style={{ fontSize: ".62rem", letterSpacing: ".18em", color: "#FF9BC2", textTransform: "uppercase", marginBottom: 6 }}>
                Sweep the room
              </div>
              <div className="bc7" style={{ fontSize: ".78rem", color: "var(--text2)", lineHeight: 1.6, maxWidth: 680 }}>
                Pull one operative, lock a date, or sweep the archive for a room ID, winner, or field note. Reports stay filed newest first.
              </div>
            </div>
            <div className="bc7" style={{ fontSize: ".64rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase" }}>
              {archiveSessions.length} reports on file
            </div>
          </div>
          <div className="warroom-filter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            <div>
              <label style={{ ...lbl, marginBottom: 6, fontSize: ".64rem" }}>Pull operative</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: ".9rem", pointerEvents: "none" }}>👤</span>
                <select value={lobbyFilter} onChange={(e) => updateLobbyFilter(e.target.value)} style={{ ...inp({ width: "100%", padding: "9px 12px 9px 34px", fontSize: ".86rem" }) }}>
                  <option value="">Any operative</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: 6, fontSize: ".64rem" }}>Lock date</label>
              <input type="date" value={lobbyDate} onChange={(e) => updateLobbyDate(e.target.value)} style={{ ...inp({ width: "100%", padding: "9px 12px", fontSize: ".86rem" }) }} />
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: 6, fontSize: ".64rem" }}>Search the file</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: ".9rem", pointerEvents: "none" }}>🔎</span>
                <input value={lobbySearch} onChange={(e) => updateLobbySearch(e.target.value)} placeholder="Room, closer, note" style={{ ...inp({ width: "100%", padding: "9px 12px 9px 36px", fontSize: ".86rem" }) }} />
              </div>
            </div>
          </div>
          {activeTrail.length > 0 && (
            <div className="warroom-active-trail" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <div className="trail-items" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {activeTrail.map((item) => (
                  <div key={item} className="bc7" style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", fontSize: ".62rem", letterSpacing: ".08em", color: "var(--text3)", textTransform: "uppercase" }}>
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={clearLobbyFilters} style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "rgba(255,255,255,.07)", color: "var(--text2)", cursor: "pointer", fontWeight: 700, fontSize: ".8rem" }}>
                Reset trail
              </button>
            </div>
          )}
        </MotionReveal>

        <MotionReveal className="warroom-results-row zone-receive-follow" delay={120} style={{ "--receive-delay": "210ms", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
          <p className="bc7" style={{ color: "var(--text3)", fontSize: ".78rem", fontWeight: 700 }}>
            {filtered.length} report{filtered.length !== 1 ? "s" : ""} across {archiveNights} archive night{archiveNights !== 1 ? "s" : ""}
          </p>
          <p className="bc7" style={{ color: "var(--text3)", fontSize: ".74rem", letterSpacing: ".08em", textTransform: "uppercase" }}>
            Showing {visible.length} now · newest first
          </p>
        </MotionReveal>

        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "34px 18px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "0 10px 10px 0", borderLeft: "3px solid rgba(255,77,143,.35)" }}>
            <div style={{ fontSize: "2rem", marginBottom: 10 }}>🗂️</div>
            <div className="bc9" style={{ fontSize: "1rem", color: "#FF4D8F", marginBottom: 6 }}>
              No battle report fits this trail yet
            </div>
            <div className="bc7" style={{ fontSize: ".74rem", color: "var(--text3)", letterSpacing: ".04em" }}>
              Ease a filter, widen the search, or wait for the next room to land.
            </div>
          </div>
        )}

        {(() => {
          let firstNightOrder = 0;
          return visible.map((s, idx) => {
            const winner = players.find((p) => p.id === s.winner);
            const { player: tkP, kills: tkK } = getLobbyTopDamage(s);
            const totalLobbyKills = getLobbyTotalKills(s);
            const customNote = hasCustomLobbyNote(s) ? s.notes.trim() : "";
            const beatTags = getLobbyBeatTags(s);
            const primaryTag = beatTags[0];
            const showNightBreak = idx === 0 || visible[idx - 1].date !== s.date;
            const isFirstVisibleNight = s.date === firstVisibleDate;
            const firstNightCardIndex = isFirstVisibleNight ? firstNightOrder++ : -1;
            const marker = getLobbyDateMarker(s.date);
            const nightSummary = daySummary[s.date];
            const nightLeaderEntry = nightSummary ? Object.entries(nightSummary.wins).sort((left, right) => right[1] - left[1])[0] : null;
            const nightLeader = nightLeaderEntry ? getPlayer(nightLeaderEntry[0]) : null;
            return (
              <MotionReveal key={s.id} className="archive-rhythm-card" delay={idx < 8 ? Math.min(idx, 7) * 45 : 0} disabled={idx >= 8} threshold={0.08} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {showNightBreak && (
                  <div className={`warroom-night-break archive-rhythm-break${isFirstVisibleNight ? " archive-entry-break" : ""}`} style={{ "--archive-entry-delay": "180ms", display: "flex", alignItems: "center", gap: 10, marginTop: idx === 0 ? 0 : 4 }}>
                    <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,rgba(255,77,143,.3),transparent)" }} />
                    <div className="bc7 warroom-night-pill" style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", fontSize: ".62rem", letterSpacing: ".14em", color: "var(--text3)", textTransform: "uppercase", textAlign: "center" }}>
                      {idx === 0 ? "Latest night on file" : "Night file"} · {formatLobbyDate(s.date, { weekday: "long", day: "numeric", month: "short" })} · {nightSummary.count} report{nightSummary.count !== 1 ? "s" : ""} · {nightSummary.kills} kills
                      {nightLeader && nightLeaderEntry ? ` · ${dn(nightLeader.username)} closed ${nightLeaderEntry[1]}` : ""}
                    </div>
                    <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,rgba(199,125,255,.3))" }} />
                  </div>
                )}

                <div className={`warroom-report-card${isFirstVisibleNight ? " archive-entry-card" : ""}`} style={{ "--archive-card-delay": `${220 + firstNightCardIndex * 70}ms`, ...card({ padding: 20, position: "relative", cursor: "pointer", overflow: "hidden", animation: `fadeUp .35s ease ${Math.min(idx, .5) * .06}s both`, border: `1.5px solid ${expandedSid === s.id ? "rgba(255,107,53,.6)" : primaryTag?.border || "var(--border)"}`, boxShadow: expandedSid === s.id ? "0 18px 42px rgba(255,107,53,.14)" : "none" }) }} onClick={(e) => { if (e.target.tagName === "BUTTON") return; setExpandedSid((v) => (v === s.id ? null : s.id)); }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: primaryTag?.color || "#FF4D8F", opacity: .85 }} />
                  <div className="warroom-report-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12, paddingLeft: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <div style={{ fontFamily: "Fredoka One", color: "#FFAB40", fontSize: ".88rem" }}>📅 {formatLobbyDate(s.date)}</div>
                        {marker && <span style={{ color: "var(--text3)", fontSize: ".76rem", fontWeight: 700 }}>{marker.icon} {marker.label}</span>}
                        <span className="hide-mob" style={{ color: "var(--text3)", fontSize: ".76rem", fontWeight: 700 }}>· {s.id.toUpperCase()}</span>
                      </div>
                      <p className="bc7" style={{ color: "var(--text2)", fontSize: ".76rem", lineHeight: 1.7, letterSpacing: ".04em", maxWidth: 660 }}>
                        {getLobbyReport(s)}
                      </p>
                      <div className="warroom-beat-tags" style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                        {beatTags.map((tag) => (
                          <div key={tag.label} className="bc7" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: tag.background, border: `1px solid ${tag.border}`, fontSize: ".58rem", letterSpacing: ".16em", color: tag.color, textTransform: "uppercase" }}>
                            {tag.label}
                          </div>
                        ))}
                        {customNote && (
                          <div className="bc7" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", fontSize: ".58rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase" }}>
                            Field note · {customNote}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="warroom-room-stats" style={{ display: "grid", gap: 6, minWidth: 122, flexShrink: 0, paddingLeft: 8 }}>
                      <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                        <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 4 }}>Room noise</div>
                        <div style={{ fontFamily: "Fredoka One", fontSize: ".9rem", color: "#FF4D8F" }}>{totalLobbyKills} kills</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                        <div className="bc7" style={{ fontSize: ".52rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 4 }}>Bodies in room</div>
                        <div style={{ fontFamily: "Fredoka One", fontSize: ".9rem", color: "#00E5FF" }}>{s.attendees?.length || 0} players</div>
                      </div>
                    </div>
                  </div>

                  {s.placements && s.placements.length > 0 && (
                    <div className="warroom-placements" style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10, paddingLeft: 8 }}>
                      {s.placements.slice(0, 5).map((pid, pi) => {
                        const p = players.find((x) => x.id === pid);
                        if (!p) return null;
                        const k = s.kills?.[pid] || 0;
                        const medals = ["🥇", "🥈", "🥉"];
                        return (
                          <div key={pid} style={{ display: "flex", alignItems: "center", gap: 5, background: `${p.color}14`, border: `1px solid ${p.color}44`, borderRadius: 8, padding: "4px 9px" }}>
                            <span style={{ fontSize: ".78rem" }}>{pi < 3 ? medals[pi] : `${pi + 1}.`}</span>
                            <Avatar p={p} size={22} />
                            <span style={{ fontFamily: "Fredoka One", color: p.color, fontSize: ".8rem" }}>{p.username}</span>
                            {k > 0 && <span style={{ color: "#FF4D8F", fontSize: ".72rem", fontWeight: 700 }}>{k}k</span>}
                          </div>
                        );
                      })}
                      {s.placements.length > 5 && (
                        <div style={{ display: "flex", alignItems: "center", padding: "4px 9px", background: "rgba(255,255,255,.06)", borderRadius: 8, color: "var(--text3)", fontSize: ".76rem", fontWeight: 700 }}>
                          +{s.placements.length - 5} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="warroom-endchips" style={{ display: "flex", gap: 7, flexWrap: "wrap", paddingLeft: 8 }}>
                    {winner && (
                      <div style={{ background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.25)", borderRadius: 8, padding: "5px 11px", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: ".7rem", color: "var(--text3)" }}>🏆 Closed the room</span>
                        <Avatar p={winner} size={22} />
                        <span style={{ fontFamily: "Fredoka One", color: winner.color, fontSize: ".86rem" }}>{winner.username}</span>
                      </div>
                    )}
                    {tkP && tkK > 0 && (
                      <div style={{ background: "rgba(255,77,143,.08)", border: "1px solid rgba(255,77,143,.25)", borderRadius: 8, padding: "5px 11px", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: ".7rem", color: "var(--text3)" }}>💀 Damage lead</span>
                        <Avatar p={tkP} size={22} />
                        <span style={{ fontFamily: "Fredoka One", color: tkP.color, fontSize: ".86rem" }}>{tkP.username} ({tkK}k)</span>
                      </div>
                    )}
                  </div>

                  {expandedSid === s.id && s.placements && s.placements.length > 0 && (
                    <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14, paddingLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontSize: ".72rem", color: "var(--text3)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>How the room broke</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {s.placements.map((pid, pi) => {
                          const p = players.find((x) => x.id === pid);
                          if (!p) return null;
                          const k = s.kills?.[pid] || 0;
                          const medals = ["🥇", "🥈", "🥉"];
                          const isWin = pi === 0;
                          return (
                            <div key={pid} onClick={() => goProfile(pid)} style={{ display: "flex", alignItems: "center", gap: 10, background: isWin ? "rgba(255,215,0,.08)" : `${p.color}08`, border: `1px solid ${isWin ? "rgba(255,215,0,.3)" : `${p.color}22`}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer" }}>
                              <span style={{ fontFamily: "Fredoka One", fontSize: pi < 3 ? "1.1rem" : ".9rem", minWidth: 26, textAlign: "center", color: pi < 3 ? "#fff" : "var(--text3)" }}>{pi < 3 ? medals[pi] : `${pi + 1}`}</span>
                              <Avatar p={p} size={28} />
                              <span style={{ fontFamily: "Fredoka One", color: p.color, fontSize: ".88rem", flex: 1 }}>{p.username}</span>
                              <span style={{ fontFamily: "Fredoka One", color: k > 0 ? "#FF4D8F" : "var(--text3)", fontSize: ".9rem" }}>{`${k}K`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ position: "absolute", top: 12, right: adminMode ? 44 : 12, color: "var(--text3)", fontSize: ".72rem", fontWeight: 700 }}>{expandedSid === s.id ? "▲" : "▼"}</div>
                  {s.clip && (
                    <div style={{ marginTop: 8, paddingLeft: 8 }}>
                      <a href={s.clip} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 8, textDecoration: "none", background: "rgba(145,71,255,.18)", border: "1px solid rgba(145,71,255,.4)", color: "#cc99ff", fontWeight: 700, fontSize: ".74rem" }}>
                        🎬 Watch clip
                      </a>
                    </div>
                  )}
                  {expandedSid === s.id && (
                    <div style={{ marginTop: 10, paddingLeft: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); setShareCard({ sid: s.id, visible: true }); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(0,229,255,.12)", border: "1px solid rgba(0,229,255,.4)", color: "#00E5FF", fontWeight: 700, fontSize: ".78rem" }}>
                        📤 Share report
                      </button>
                    </div>
                  )}

                  {adminMode && (
                    <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 5 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditSession(s); }} style={{ background: "rgba(255,215,0,.15)", border: "1px solid rgba(255,215,0,.5)", color: "#FFD700", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: ".7rem" }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelSession(s.id); }} style={{ background: "rgba(231,76,60,.15)", border: "1px solid #E74C3C", color: "#E74C3C", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: ".7rem" }}>✕</button>
                    </div>
                  )}
                </div>
              </MotionReveal>
            );
          });
        })()}

        {filtered.length > visible.length && (
          <div style={{ ...card({ padding: 18, textAlign: "center", border: "1px dashed rgba(255,255,255,.14)" }) }}>
            <div className="bc7" style={{ fontSize: ".74rem", letterSpacing: ".08em", color: "var(--text3)", marginBottom: 10 }}>
              {filtered.length - visible.length} older report{filtered.length - visible.length !== 1 ? "s" : ""} still waiting deeper in the archive
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setLobbyLimit((count) => count + 8)} style={{ ...primaryBtn({ padding: "10px 18px", fontSize: ".86rem" }) }}>
                Load older reports
              </button>
              {lobbyLimit > 8 && (
                <button onClick={() => setLobbyLimit(8)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "rgba(255,255,255,.07)", color: "var(--text2)", cursor: "pointer", fontWeight: 700, fontSize: ".82rem" }}>
                  Back to freshest file
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
