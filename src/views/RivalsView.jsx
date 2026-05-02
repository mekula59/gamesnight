export default function RivalsView({ ctx }) {
  const {
    rivalryBoard,
    dn,
    rivalSearch,
    setRivalSearch,
    players,
    h2hA,
    setH2hA,
    h2hB,
    setH2hB,
    getH2H,
    getStats,
    getRank,
    card,
    Avatar,
  } = ctx;

  const board = rivalryBoard || { hot: [], watch: [], cold: [] };
  const searchTerm = rivalSearch.trim().toLowerCase();
  const cardMatchesSearch = (entry) => {
    if (!searchTerm) return true;
    return `${entry.playerA.username} ${entry.playerB.username} ${entry.scoreLine}`.toLowerCase().includes(searchTerm);
  };
  const formatDate = (date) => date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "No clash";
  const heatSections = [
    {
      title: "Hot Rivalries",
      tone: "active",
      chip: "ACTIVE",
      cards: (board.hot || []).filter(cardMatchesSearch),
      empty: searchTerm ? "No hot rivalry matches that search." : "No hot rivalry is close enough right now.",
    },
    {
      title: "On Watch",
      tone: "watch",
      chip: "WATCH",
      cards: (board.watch || []).filter(cardMatchesSearch),
      empty: searchTerm ? "No watch rivalry matches that search." : "No watch rivalry is close enough right now.",
    },
    {
      title: "Cold History",
      tone: "cold",
      chip: "HISTORY",
      cards: (board.cold || []).filter(cardMatchesSearch),
      empty: searchTerm ? "No cold rivalry matches that search." : "Cold history is quiet right now.",
    },
  ];
  const totalVisible = heatSections.reduce((sum, section) => sum + section.cards.length, 0);
  const getLeaderLine = (entry) => {
    if (!entry.leaderId) return "Rivalry level";
    const leader = entry.leaderId === entry.playerA.id ? entry.playerA : entry.playerB;
    return `${dn(leader.username)} leads by ${entry.gap}`;
  };
  const getMobilePressureLine = (entry, tone) => {
    if (entry.gap <= 1) return "One top-two result can swing this.";
    if (tone === "active") return "Recent clashes keep this hot.";
    if (tone === "watch") return "Close enough to track next.";
    return "History file, low heat.";
  };

  const renderHeatCard = (entry, tone) => (
    <article key={entry.pairId} className={`rival-ops-card rivalry-evidence-card heat-${tone}`}>
      <div className="rival-card-mobile-chip bc7">{tone === "active" ? "ACTIVE" : tone === "watch" ? "WATCH" : "HISTORY"}</div>
      <div className="rival-card-matchup">
        <div className="rival-card-player">
          <Avatar p={entry.playerA} size={tone === "active" ? 38 : 32} glow={tone === "active"} />
          <span className="bc9 rival-ops-card-name">{dn(entry.playerA.username)}</span>
        </div>
        <div className="rival-card-score-lockup">
          <div className="bc9 rival-ops-score">{entry.scoreLine}</div>
          <div className="bc7 rival-ops-score-label">TOP-TWO SCORE</div>
        </div>
        <div className="rival-card-player rival-card-player-b">
          <Avatar p={entry.playerB} size={tone === "active" ? 38 : 32} glow={tone === "active"} />
          <span className="bc9 rival-ops-card-name">{dn(entry.playerB.username)}</span>
        </div>
      </div>
      <div className="rival-card-evidence-row">
        <span>
          <span className="rival-evidence-desktop">{entry.meetings} meetings</span>
          <span className="rival-evidence-mobile">{entry.meetings} MTGS</span>
        </span>
        <span>
          <span className="rival-evidence-desktop">Last {formatDate(entry.lastMeetingDate)}</span>
          <span className="rival-evidence-mobile">{formatDate(entry.lastMeetingDate)}</span>
        </span>
        <span>
          <span className="rival-evidence-desktop">S2 {entry.seasonScore.scoreLine}</span>
          <span className="rival-evidence-mobile">{entry.seasonScore.scoreLine}</span>
        </span>
      </div>
      <div className="rival-card-foot">
        <span className="bc7 rival-ops-card-pressure">{getLeaderLine(entry)}</span>
        <span className="bc7 rival-ops-card-chip">{entry.heatScore} heat</span>
      </div>
      <div className="bc7 rival-card-pressure-line rival-desktop-pressure">{entry.pressureLine}</div>
      <div className="bc7 rival-card-pressure-line rival-mobile-pressure">{getMobilePressureLine(entry, tone)}</div>
    </article>
  );

  return (
    <div className="fade-up rivals-page" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="rival-heat-hero">
        <p style={{ color: "var(--text3)", fontWeight: 800, fontSize: ".7rem", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Live rivalry heat</p>
        <h2 style={{ fontFamily: "Fredoka One", fontSize: "clamp(2rem,8vw,3.2rem)",
          background: "linear-gradient(135deg,#FF4D8F,#FFD700,#FF6B35)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          ⚔️ Rivalries
        </h2>
        <p style={{ color: "var(--text2)", marginTop: 8, fontSize: ".86rem" }}>
          Tracked from 1st vs 2nd finishes across official lobbies.
        </p>
      </div>

      <div className="rival-heat-search">
        <span className="rival-heat-search-icon">🔍</span>
        <input className="search-inp" placeholder="Filter rivalry board..."
          value={rivalSearch} onChange={(e) => setRivalSearch(e.target.value)} />
      </div>

      <div className="rival-ops-shell heat-board-shell">
        {totalVisible === 0 ? (
          <div className="rival-ops-empty">
            <div className="bc7 rival-ops-empty-title">NO FILES FOUND</div>
            <div className="bc7 rival-ops-empty-line">No rivalry on the heat board matches that search.</div>
          </div>
        ) : heatSections.map((section) => (
          <section key={section.title} className={`rival-ops-tier heat-tier-${section.tone}`}>
            <div className="rival-ops-tier-head">
              <h3 className="rival-ops-tier-title">{section.title}</h3>
              <span className="bc7 rival-ops-tier-count">{section.cards.length} files</span>
            </div>
            {section.cards.length ? (
              <div className={`rival-ops-track heat-board-track is-${section.tone}`}>
                {section.cards.map((entry) => renderHeatCard(entry, section.tone))}
              </div>
            ) : (
              <div className="rival-ops-empty heat-tier-empty">
                <div className="bc7 rival-ops-empty-line">{section.empty}</div>
              </div>
            )}
          </section>
        ))}
      </div>

      <details className="h2h-scroll h2h-secondary-tool" style={{ ...card({ border: "1px solid rgba(0,229,255,.12)" }), padding: 0, marginTop: 20, marginBottom: 22 }}>
        <summary className="bc9" style={{ color: "#00E5FF", fontSize: "1rem", cursor: "pointer", padding: "16px 18px", listStyle: "none" }}>
          Open H2H tool
        </summary>
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[{ val: h2hA, set: setH2hA, label: "Player A" }, { val: h2hB, set: setH2hB, label: "Player B" }].map((s, i) => (
              <div key={i} style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: "block", color: "var(--text3)", fontWeight: 800, fontSize: ".7rem", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</label>
                <select value={s.val} onChange={(e) => s.set(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "2px solid var(--border)", background: "#190f3d", color: "#fff", fontSize: ".9rem", outline: "none" }}>
                  <option value="">Select player...</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.username}</option>)}
                </select>
              </div>
            ))}
          </div>
          {(() => {
            const h = getH2H(h2hA, h2hB);
            const pA = players.find((x) => x.id === h2hA);
            const pB = players.find((x) => x.id === h2hB);
            if (!h || !pA || !pB) return (
              <p style={{ color: "var(--text3)", fontSize: ".84rem", textAlign: "center", padding: "12px 0" }}>Select two players to compare them head-to-head</p>
            );
            const stA = getStats(h2hA), stB = getStats(h2hB);
            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ textAlign: "center" }}>
                    <Avatar p={pA} size={52} glow />
                    <div style={{ fontFamily: "Fredoka One", color: pA.color, fontSize: "1rem", marginTop: 6 }}>{pA.username}</div>
                    <div style={{ fontSize: ".72rem", color: getRank(h2hA).color, fontWeight: 700 }}>{getRank(h2hA).title}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Fredoka One", color: "var(--text3)", fontSize: "1.4rem" }}>vs</div>
                    <div style={{ fontSize: ".68rem", color: "var(--text3)", fontWeight: 700, marginTop: 4 }}>{h.shared} shared lobbies</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Avatar p={pB} size={52} glow />
                    <div style={{ fontFamily: "Fredoka One", color: pB.color, fontSize: "1rem", marginTop: 6 }}>{pB.username}</div>
                    <div style={{ fontSize: ".72rem", color: getRank(h2hB).color, fontWeight: 700 }}>{getRank(h2hB).title}</div>
                  </div>
                </div>
                <div className="h2h-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 12 }}>
                  {[
                    { l: "Wins shared", aV: h.aWins, bV: h.bWins, c: "#FFD700" },
                    { l: "Kills shared", aV: h.aKills, bV: h.bKills, c: "#FF4D8F" },
                    { l: "1v1 Duels", aV: h.aDuels, bV: h.bDuels, c: "#C77DFF" },
                    { l: "All-time Wins", aV: stA.wins, bV: stB.wins, c: "#FFD700" },
                    { l: "All-time Kills", aV: stA.kills, bV: stB.kills, c: "#FF4D8F" },
                    { l: "Win Rate", aV: `${stA.winRate}%`, bV: `${stB.winRate}%`, c: "#00FF94" },
                  ].map((row, i) => {
                    const aNum = parseFloat(row.aV) || 0, bNum = parseFloat(row.bV) || 0;
                    const aWin = aNum > bNum, tie = aNum === bNum;
                    return (
                      <div key={i} style={{ background: "rgba(0,0,0,.35)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: ".6rem", color: "var(--text3)", fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>{row.l}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "Fredoka One", color: aWin ? row.c : tie ? "var(--text2)" : "var(--text3)", fontSize: "1.1rem" }}>{row.aV}</span>
                          <span style={{ color: "var(--text3)", fontSize: ".7rem" }}>-</span>
                          <span style={{ fontFamily: "Fredoka One", color: !aWin && !tie ? row.c : tie ? "var(--text2)" : "var(--text3)", fontSize: "1.1rem" }}>{row.bV}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {h.shared > 0 && (
                  <div style={{ textAlign: "center", padding: "10px", background: `linear-gradient(135deg,${h.aWins > h.bWins ? pA.color : pB.color}12,rgba(0,0,0,.2))`, borderRadius: 10, fontSize: ".82rem", fontWeight: 700, color: "var(--text2)" }}>
                    {h.aWins === h.bWins ? "Shared rooms are dead even" :
                      `${(h.aWins > h.bWins ? pA : pB).username} leads shared lobbies ${Math.max(h.aWins, h.bWins)}-${Math.min(h.aWins, h.bWins)}`}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </details>
    </div>
  );
}
