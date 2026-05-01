export default function ArenaView({ ctx }) {
  const {
    arenaRangeMeta,
    arenaRangeOptions,
    arenaRangeKey,
    setLbSeason,
    setLbPeriod,
    SORT_LABELS,
    sortBy,
    filteredLB,
    lbSearch,
    players,
    setLbSearch,
    setSpotlight,
    sortedLB,
    sessions,
    foolsDay,
    leaderboardShiftData,
    selectGetLiveStreaks,
    arenaScopeSessions,
    getOnDeckPressure,
    lbSeason,
    lbPeriod,
    dn,
    getArenaStats,
    getRank,
    getBadges,
    getArenaStreak,
    card,
    Avatar,
    getArenaCarry,
    getArenaConsistency,
    getArenaBenchmark,
    getArenaFormGuide,
    getPlayerLevel,
    renderPlayerIntel,
    goProfile,
    spotlight,
    getPressureQueue,
    seasonTwoClosed,
    seasonThreeWaiting,
  } = ctx;
  const seasonBoardClosed=seasonTwoClosed&&arenaRangeKey==="season";
  const archiveBoardMode=seasonBoardClosed||seasonThreeWaiting;

  return (
<div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* Arena header */}
          <div className="zone-arrival-slice" style={{"--arrive-delay":"50ms",marginBottom:28,position:"relative"}}>
            {/* Top coordinate bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:12,padding:"0 2px"}}>
              <span style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".7rem",
                letterSpacing:".25em",color:"rgba(255,215,0,.4)",textTransform:"uppercase"}}>
                OFFICIAL BOARD
              </span>
              <span style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".7rem",
                letterSpacing:".2em",color:"rgba(255,255,255,.2)",textTransform:"uppercase"}}>
                {arenaRangeMeta.summary.toUpperCase()}
              </span>
            </div>
            <div style={{textAlign:"center"}}>
              <h2 style={{
                fontFamily:"Barlow Condensed",fontWeight:900,
                fontSize:"clamp(2.4rem,10vw,4.2rem)",
                letterSpacing:".1em",lineHeight:.9,
                background:"linear-gradient(135deg,#FFD700,#FF6B35,#FF4D8F)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                textShadow:"none",
                ...(foolsDay?{transform:"scaleY(-1)",display:"inline-block"}:{})
              }}>
                THE ARENA
              </h2>
              <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                fontSize:".8rem",letterSpacing:".3em",
                color:"rgba(255,255,255,.2)",marginTop:6,textTransform:"uppercase"}}>
                {arenaRangeMeta.strap}
              </div>
            </div>
            {foolsDay&&(
              <div style={{textAlign:"center",fontFamily:"Fredoka One",color:"#FF4D8F",
                fontSize:".82rem",marginTop:8,letterSpacing:1}}>
                🃏 Upside Down Edition. Last place is first today
              </div>
            )}
          </div>

          {/* Arena range rail */}
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {arenaRangeOptions.map((range)=>{
              const active=arenaRangeKey===range.id;
              return(
                <button key={range.id} onClick={()=>{
                  setLbSeason(range.seasonId);
                  setLbPeriod(range.period);
                }} style={{
                  padding:"8px 16px",cursor:"pointer",outline:"none",
                  background:active?`${range.color}18`:"rgba(255,255,255,.03)",
                  border:active?`1px solid ${range.color}55`:"1px solid rgba(255,255,255,.08)",
                  borderBottom:active?`2px solid ${range.color}`:"2px solid transparent",
                  borderRadius:"4px 4px 0 0",
                  fontFamily:"Barlow Condensed",fontWeight:900,
                  fontSize:".72rem",letterSpacing:".15em",
                  color:active?range.color:"var(--text3)",transition:"all .12s"}}>
                  <div>{range.label}</div>
                  <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                    fontSize:".55rem",letterSpacing:".12em",opacity:.6,marginTop:2}}>{range.sub}</div>
                </button>
              );
            })}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span className="bc7" style={{fontSize:".6rem",letterSpacing:".2em",color:"var(--text3)"}}>RANGE</span>
              <span className="bc7" style={{
                fontSize:".62rem",
                letterSpacing:".12em",
                color:"rgba(255,255,255,.55)",
                background:"rgba(255,255,255,.04)",
                border:"1px solid rgba(255,255,255,.08)",
                borderRadius:999,
                padding:"5px 10px",
              }}>
                {arenaRangeMeta.scopeLabel.toUpperCase()} · {SORT_LABELS[sortBy].toUpperCase()} · {filteredLB.length} IN VIEW{lbSearch.trim()?` · FILTER ${lbSearch.trim().toUpperCase()}`:""}
              </span>
            </div>
          </div>

          {!seasonTwoClosed&&(
            <div style={{
              marginBottom:14,
              padding:"9px 12px",
              borderRadius:10,
              border:"1px solid rgba(255,215,0,.16)",
              background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,107,53,.04))",
            }}>
              <div className="bc7" style={{fontSize:".74rem",lineHeight:1.55,color:"var(--text2)"}}>
                Season ends in 6 days. This board still has room to turn.
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{position:"relative",marginBottom:16}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>🔍</span>
            <input className="search-inp" placeholder="Search callsign or gamertag..."
              value={lbSearch} onChange={e=>{
                const nextValue=e.target.value;
                const query=nextValue.trim().toLowerCase();
                setLbSearch(nextValue);
                if(!query){setSpotlight(null);return;}
                const m=players.find(p=>p.username.toLowerCase().includes(query));
                setSpotlight(m?m.id:null);
              }}/>
            {lbSearch&&<button onClick={()=>{setLbSearch("");setSpotlight(null);}} style={{
              position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"rgba(255,255,255,.12)",border:"none",borderRadius:50,
              width:22,height:22,cursor:"pointer",color:"#fff",fontSize:".72rem"}}>✕</button>}
          </div>

          {!archiveBoardMode&&(()=>{
            const pressureQueue=getPressureQueue({seasonId:lbSeason==="all"?undefined:lbSeason,limit:3});
            return(
              <div className="pressure-queue-shell">
                <div className="pressure-queue-head">
                  <h2 className="pressure-queue-title">Pressure Queue</h2>
                </div>
                {pressureQueue.items.length ? (
                  <div className="pressure-queue-grid">
                    {pressureQueue.items.map((item)=>(
                      <div key={item.id} className="pressure-queue-card" style={{
                        borderColor:`${item.color}24`,
                        borderLeft:`3px solid ${item.color}`,
                        background:`linear-gradient(135deg,${item.color}10,rgba(0,0,0,.28))`,
                      }}>
                        <div className="pressure-queue-label" style={{color:`${item.color}cc`}}>
                          {item.label}
                        </div>
                        <div className="pressure-queue-headline">
                          {item.headline}
                        </div>
                        <div className="pressure-queue-detail">
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pressure-queue-empty">
                    {pressureQueue.emptyLine}
                  </div>
                )}
              </div>
            );
          })()}

          {archiveBoardMode&&(
            <div style={{
              marginBottom:14,
              padding:"10px 12px",
              borderRadius:10,
              border:"1px solid rgba(0,229,255,.18)",
              borderLeft:"3px solid rgba(0,229,255,.56)",
              background:"linear-gradient(135deg,rgba(0,229,255,.08),rgba(0,0,0,.24))",
            }}>
              <div className="bc7" style={{fontSize:".74rem",lineHeight:1.55,color:"var(--text2)"}}>
                {seasonBoardClosed
                  ?"Season 2 is locked. This board is final record, not active movement."
                  :"No May lobbies have been filed yet. Arena is showing the latest official archive."}
              </div>
            </div>
          )}

          {sortedLB.length>0&&(()=>{
            const boardLeader=sortedLB[0];
            const boardChaser=sortedLB[1];
            const leaderPlayer=players.find((player)=>player.id===boardLeader.id);
            const chasePlayer=boardChaser?players.find((player)=>player.id===boardChaser.id):null;
            if(!leaderPlayer)return null;
            const scopeLabel=arenaRangeMeta.scopeLabel;
            const climbPlayer=leaderboardShiftData.biggestRise?.player||null;
            const slidePlayer=leaderboardShiftData.biggestSlide?.player||null;
            const liveArenaHeat=selectGetLiveStreaks(arenaScopeSessions,players)[0]||null;
            const liveArenaHeatPlayer=liveArenaHeat?players.find((player)=>player.id===liveArenaHeat.id):null;
            const arenaOnDeck=getOnDeckPressure({seasonId:lbSeason,period:lbPeriod,limit:3});
            const arenaOnDeckLead=arenaOnDeck.topItem?.shortText||"Nothing is sitting one room away yet.";
            const arenaOnDeckTrail=arenaOnDeck.summary.slice(1,3);
            const arenaOnDeckNote=arenaOnDeckTrail.length
              ? arenaOnDeckTrail.join(" · ")
              : liveArenaHeatPlayer
                ? `${dn(liveArenaHeatPlayer.username)} is still carrying a ${liveArenaHeat.streak}W run into the next room.`
                : "The next room has not put a clean flip on deck yet.";
            const pressureText=(()=>{
              if(archiveBoardMode&&boardChaser&&chasePlayer){
                const gap=boardLeader.wins-boardChaser.wins;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level in this archived scope.`
                  :`${dn(leaderPlayer.username)} is ${gap} win${gap===1?"":"s"} clear of ${dn(chasePlayer.username)} in this archived scope.`;
              }
              if(seasonBoardClosed&&boardChaser&&chasePlayer){
                const gap=boardLeader.wins-boardChaser.wins;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} finished level on wins.`
                  :`${dn(leaderPlayer.username)} finished ${gap} win${gap===1?"":"s"} clear of ${dn(chasePlayer.username)}.`;
              }
              if(!boardChaser||!chasePlayer){
                if(arenaRangeKey==="today"){
                  return `${dn(leaderPlayer.username)} owned the last session day without anyone else getting a clean second line on them.`;
                }
                if(arenaRangeKey==="week"){
                  return `${dn(leaderPlayer.username)} is setting the pace this week with nobody close enough yet to call it safe.`;
                }
                return `${dn(leaderPlayer.username)} owns this board for now.`;
              }
              if(sortBy==="kills"){
                const gap=boardLeader.kills-boardChaser.kills;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on kills right now.`
                  :`${dn(leaderPlayer.username)} is ${gap} kill${gap===1?"":"s"} clear of ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="kd"){
                const gap=(parseFloat(boardLeader.kd)-parseFloat(boardChaser.kd)).toFixed(1);
                return gap==="0.0"
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are locked on efficiency.`
                  :`${dn(leaderPlayer.username)} is ${gap} K/G ahead of ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="winrate"){
                const gap=boardLeader.winRate-boardChaser.winRate;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on win rate.`
                  :`${dn(leaderPlayer.username)} is ${gap}% ahead of ${dn(chasePlayer.username)} on win rate.`;
              }
              if(sortBy==="appearances"){
                const gap=boardLeader.appearances-boardChaser.appearances;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on attendance.`
                  :`${dn(leaderPlayer.username)} has ${gap} more lobby${gap===1?"":"ies"} logged than ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="carry"){
                const gap=boardLeader.carry-boardChaser.carry;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are even on carry score.`
                  :`${dn(leaderPlayer.username)} leads carry score by ${gap}.`;
              }
              if(sortBy==="consistency"){
                const gap=boardLeader.consistency-boardChaser.consistency;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on consistency.`
                  :`${dn(leaderPlayer.username)} is ${gap}% steadier than ${dn(chasePlayer.username)} right now.`;
              }
              const gap=boardLeader.wins-boardChaser.wins;
              return gap===0
                ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on wins.`
                :`${dn(leaderPlayer.username)} is ${gap} win${gap===1?"":"s"} clear of ${dn(chasePlayer.username)}.`;
            })();
            const leadValue=(()=>{
              if(archiveBoardMode){
                return boardChaser&&chasePlayer
                  ?seasonBoardClosed
                    ?`${dn(leaderPlayer.username)} finished Season 2 ahead of ${dn(chasePlayer.username)}`
                    :`${dn(leaderPlayer.username)} leads the latest archived board over ${dn(chasePlayer.username)}`
                  :seasonBoardClosed
                    ?`${dn(leaderPlayer.username)} finished Season 2 alone on top`
                    :`${dn(leaderPlayer.username)} leads the latest archived board`;
              }
              if(arenaRangeKey==="today"){
                return boardChaser&&chasePlayer
                  ?`${dn(leaderPlayer.username)} owned the last session day over ${dn(chasePlayer.username)}`
                  :`${dn(leaderPlayer.username)} owned the last session day`;
              }
              if(arenaRangeKey==="week"){
                return boardChaser&&chasePlayer
                  ?`${dn(leaderPlayer.username)} is setting this week over ${dn(chasePlayer.username)}`
                  :`${dn(leaderPlayer.username)} is setting the week alone`;
              }
              if(arenaRangeKey==="season"){
                return boardChaser&&chasePlayer
                  ?`${dn(leaderPlayer.username)} has to hold off ${dn(chasePlayer.username)}`
                  :`${dn(leaderPlayer.username)} is alone on the season front line`;
              }
              return boardChaser&&chasePlayer
                ?`${dn(leaderPlayer.username)} has to hold off ${dn(chasePlayer.username)}`
                :`${dn(leaderPlayer.username)} is alone on the front line`;
            })();
            const moveValue=climbPlayer
              ?leaderboardShiftData.biggestRise?.label==="NEW"
                ? arenaRangeKey==="week"
                  ?`${dn(climbPlayer.username)} forced onto this week's board`
                  :arenaRangeKey==="today"
                    ?`${dn(climbPlayer.username)} forced onto the latest-day board`
                    :`${dn(climbPlayer.username)} forced onto the board`
                : arenaRangeKey==="week"
                  ?`${dn(climbPlayer.username)} jumped ${leaderboardShiftData.biggestRise?.label} on this week's board`
                  :arenaRangeKey==="today"
                    ?`${dn(climbPlayer.username)} climbed ${leaderboardShiftData.biggestRise?.label} on the latest-day board`
                    :`${dn(climbPlayer.username)} climbed ${leaderboardShiftData.biggestRise?.label}`
              :arenaRangeKey==="today"
                ?"The last day held its order"
                :arenaRangeKey==="week"
                  ?"This week has not broken open yet"
                  :"No fresh jump on the latest session day";
            const moveNote=climbPlayer
              ?arenaRangeKey==="week"
                ?`${dn(climbPlayer.username)} made the sharpest weekly move since ${new Date(leaderboardShiftData.latestScopeDate+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}.`
                :arenaRangeKey==="today"
                  ?`${dn(climbPlayer.username)} made the sharpest move inside the latest session day.`
                  :`${dn(climbPlayer.username)} made the sharpest push since ${new Date(leaderboardShiftData.latestScopeDate+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}.`
              :arenaRangeKey==="today"
                ?"The last day closed without a surprise climb, so the pressure stayed on the same shoulders."
                :arenaRangeKey==="week"
                  ?"The week's order is still stable enough for one heavy room to redraw it."
                  :"The order held through the latest file.";
            const pulseCards=archiveBoardMode
              ?[
                {
                  label:seasonBoardClosed?"FINAL FRONT":"ARCHIVE FRONT",
                  color:leaderPlayer.color,
                  value:leadValue,
                  note:pressureText,
                },
                {
                  label:seasonBoardClosed?"LOCKED MOVEMENT":"LAST MOVEMENT",
                  color:climbPlayer?.color||"#00E5FF",
                  value:moveValue,
                  note:climbPlayer
                    ?`${dn(climbPlayer.username)} made the sharpest move in the latest archived scope.`
                    :"The archived order held without a surprise move.",
                },
                {
                  label:"ARCHIVE NOTE",
                  color:"#00E5FF",
                  value:seasonBoardClosed?"Final standings are locked":"Waiting on May data",
                  note:seasonBoardClosed
                    ?"Season 2 movement is now archive context until a new season file opens."
                    :"The next Arena movement starts when the first official May lobby is filed.",
                },
              ]
              :[
                {
                  label:"FRONT SPOT",
                  color:leaderPlayer.color,
                  value:leadValue,
                  note:pressureText,
                },
                {
                  label:arenaRangeKey==="today"?"LAST DAY SWING":"BIGGEST MOVE",
                  color:climbPlayer?.color||"#00E5FF",
                  value:moveValue,
                  note:moveNote,
                },
                {
                  label:"ON DECK",
                  color:arenaOnDeck.topItem?.color||liveArenaHeatPlayer?.color||slidePlayer?.color||"#FF6B35",
                  value:arenaOnDeckLead,
                  note:arenaOnDeckNote,
                },
              ];
            return(
              <div style={{marginBottom:16}}>
                <div style={{
                  marginBottom:8,
                  background:`linear-gradient(135deg,${leaderPlayer.color}12,rgba(0,0,0,.4))`,
                  border:`1px solid ${leaderPlayer.color}33`,
                  borderLeft:`3px solid ${leaderPlayer.color}`,
                  borderRadius:"0 10px 10px 0",
                  padding:"14px 16px",
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
                    <span className="bc9" style={{fontSize:".64rem",letterSpacing:".24em",color:`${leaderPlayer.color}bb`}}>
                      {archiveBoardMode?seasonBoardClosed?"FINAL BOARD":"OFFICIAL BOARD":"PRESSURE BOARD"}
                    </span>
                    <span className="bc7" style={{fontSize:".6rem",letterSpacing:".14em",color:"var(--text3)"}}>
                      {scopeLabel.toUpperCase()} · SORTED BY {SORT_LABELS[sortBy].toUpperCase()}
                    </span>
                  </div>
                  <div className="bc9" style={{fontSize:"clamp(1rem,3vw,1.2rem)",color:leaderPlayer.color,marginBottom:4}}>
                    {leaderPlayer.host?"👑 ":""}{dn(leaderPlayer.username)} has the front spot.
                  </div>
                  <div className="bc7" style={{fontSize:".76rem",color:"var(--text2)",lineHeight:1.6}}>
                    {pressureText}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}>
                  {pulseCards.map((card)=>(
                    <div key={card.label} style={{
                      background:`linear-gradient(135deg,${card.color}10,rgba(255,255,255,.03))`,
                      border:`1px solid ${card.color}2f`,
                      borderLeft:`3px solid ${card.color}`,
                      borderRadius:"0 8px 8px 0",
                      padding:"12px 14px",
                    }}>
                      <div className="bc7" style={{fontSize:".56rem",letterSpacing:".2em",color:`${card.color}bb`,marginBottom:7}}>
                        {card.label}
                      </div>
                      <div className="bc9" style={{fontSize:".92rem",color:card.color,lineHeight:1.2,marginBottom:6}}>
                        {card.value}
                      </div>
                      <div className="bc7" style={{fontSize:".7rem",color:"var(--text2)",lineHeight:1.55}}>
                        {card.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Spotlight card */}
          {spotlight&&(()=>{
            const p=players.find(x=>x.id===spotlight);if(!p)return null;
            const st=getArenaStats(p.id);
            const rank=getRank(p.id);
            const badges=getBadges(p.id);
            const streak=getArenaStreak(p.id);
            return(
              <div style={{...card({border:`2px solid ${p.color}`,background:`linear-gradient(135deg,${p.color}16,var(--card))`}),
                padding:22,marginBottom:18,animation:"popIn .3s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
                  <Avatar p={p} size={60} glow/>
                  <div>
                    <div style={{fontFamily:"Fredoka One",fontSize:"1.5rem",color:p.color}}>{p.host?"👑 ":""}{dn(p.username)}</div>
                    <div style={{fontSize:".82rem",color:rank.color,fontWeight:700}}>{rank.title}</div>
                    {streak>=2&&<div style={{fontSize:".76rem",color:"#FF6B35",fontWeight:800,marginTop:2}} className="fire">🔥 {streak}-game streak!</div>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:9,marginBottom:12}}>
                  {[
                    {l:"Wins",     v:st.wins,           c:"#FFD700",i:"🏆"},
                    {l:"Kills",    v:st.kills,          c:"#FF4D8F",i:"💀"},
                    {l:"K/G",      v:st.kd,             c:"#00E5FF",i:"⚡"},
                    {l:"Win Rate", v:st.winRate+"%",    c:"#00FF94",i:"🎯"},
                    {l:"Lobbies",  v:st.appearances,    c:"#FFAB40",i:"📅"},
                    {l:"Carry",    v:getArenaCarry(p.id),c:"#FF6B35",i:"🎖️"},
                    {l:"Consistency",v:getArenaConsistency(p.id)+"%",c:"#00FF94",i:"🧱"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"rgba(0,0,0,.35)",borderRadius:9,padding:"8px 12px"}}>
                      <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:700,marginBottom:1}}>{s.i} {s.l}</div>
                      <div style={{fontFamily:"Fredoka One",color:s.c,fontSize:"1.2rem"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {badges.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {badges.map((b,i)=>(
                      <span key={i} style={{background:"rgba(255,255,255,.09)",borderRadius:50,padding:"3px 9px",fontSize:".7rem",fontWeight:700,color:"#fff",border:"1px solid rgba(255,255,255,.18)"}}>{b.icon} {b.label}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sort pills */}
          <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {id:"wins",l:"🏆 Wins"},
              {id:"kills",l:"💀 Kills"},
              {id:"kd",l:"⚡ K/G"},
              {id:"winrate",l:"🎯 Win%"},
              {id:"appearances",l:"📅 Lobbies"},
              {id:"carry",l:"🎖️ Carry"},
              {id:"consistency",l:"🧱 Consistency"},
            ].map(s=>(
              <button key={s.id} className="pill" onClick={()=>setSortBy(s.id)} style={{
                padding:"7px 14px",borderRadius:50,fontWeight:700,fontSize:".78rem",
                background:sortBy===s.id?"var(--orange)":"var(--card)",
                color:sortBy===s.id?"#fff":"var(--text2)",
                border:sortBy===s.id?"none":"1.5px solid var(--border)",
                boxShadow:sortBy===s.id?"0 0 18px rgba(255,107,53,.42)":"none"}}>
                {s.l}
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="lb-table hud-bg" style={{...card(),overflow:"hidden",border:"1.5px solid rgba(255,255,255,.1)"}}>
            {/* Arena header */}
            <div style={{display:"grid",gridTemplateColumns:"46px 1fr 60px 60px 60px 60px 60px 52px",
              padding:"10px 18px",
              background:"linear-gradient(90deg,rgba(0,0,0,.7),rgba(0,0,0,.4))",
              borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              {["#","PLAYER","W","K","K/G","WIN%","G","LVL"].map((h,i)=>(
                <span key={i} style={{
                  fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".72rem",
                  letterSpacing:".15em",color:"rgba(255,255,255,.3)",
                  textAlign:i>1?"center":"left",textTransform:"uppercase"
                }}>{h}</span>
              ))}
            </div>
            {filteredLB.map((player,i)=>{
              const globalRank=sortedLB.findIndex(p=>p.id===player.id);
              const medals=["🥇","🥈","🥉"];
              const rank=getRank(player.id);
              const shift=leaderboardShiftData.map[player.id];
              const isHL=spotlight===player.id;
              const isFirst=globalRank===0&&sessions.length>0&&!foolsDay;
              const streak=getArenaStreak(player.id);
              const lvl=getPlayerLevel(player.id);
              return(
                <div key={player.id}
                  className={`arena-row${isFirst?" arena-row-1":""}`}
                  onClick={()=>goProfile(player.id)}
                  style={{
                    display:"grid",gridTemplateColumns:"46px 1fr 60px 60px 60px 60px 60px 52px",
                    padding:"11px 18px",alignItems:"center",cursor:"pointer",
                    borderTop:"1px solid rgba(255,255,255,.04)",
                    background:isHL?`${player.color}14`:isFirst?"linear-gradient(90deg,rgba(255,215,0,.07),transparent)":"transparent",
                    outline:isHL?`2px solid ${player.color}44`:"none",
                    borderRadius:isHL?6:0,
                    animationDelay:`${Math.min(i,.25)*i*.025}s`,
                  }}>
                  {/* Rank number */}
                  <span className="rank-num" style={{
                    fontSize:globalRank<3?"1.3rem":".95rem",
                    color:isFirst?"#FFD700":globalRank===1?"#C0C0C0":globalRank===2?"#CD7F32":"rgba(255,255,255,.25)",
                    animation:isFirst?"crownSpin 3s ease-in-out infinite":undefined,
                    display:"inline-block",
                  }}>
                    {globalRank<3?medals[globalRank]:globalRank+1}
                  </span>
                  {/* Player info */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{position:"relative"}}>
                      <Avatar p={player} size={34} glow={isHL||isFirst} intel={renderPlayerIntel(player)}/>
                      {isFirst&&<div style={{
                        position:"absolute",inset:-2,borderRadius:"50%",
                        border:"1.5px solid rgba(255,215,0,.5)",
                        boxShadow:"0 0 12px rgba(255,215,0,.4)",
                        animation:"rankGlow 2s ease-in-out infinite",
                        pointerEvents:"none"
                      }}/>}
                    </div>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <div style={{
                          fontFamily:isFirst?"Barlow Condensed":"Fredoka One",
                          fontWeight:isFirst?900:400,
                          letterSpacing:isFirst?".04em":0,
                          color:isFirst?"#FFD700":"#fff",
                          fontSize:".9rem",
                          maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                        }}>
                          {player.host?"👑 ":""}{dn(player.username)}
                        </div>
                        {shift&&shift.label!=="HOLD"&&(
                          <span className="bc7" style={{
                            fontSize:".52rem",
                            letterSpacing:".14em",
                            color:shift.tone==="up"?"#00FF94":shift.tone==="down"?"#FF6B35":"#00E5FF",
                            background:shift.tone==="up"?"rgba(0,255,148,.12)":shift.tone==="down"?"rgba(255,107,53,.12)":"rgba(0,229,255,.12)",
                            border:`1px solid ${shift.tone==="up"?"rgba(0,255,148,.35)":shift.tone==="down"?"rgba(255,107,53,.35)":"rgba(0,229,255,.35)"}`,
                            borderRadius:999,
                            padding:"2px 6px",
                          }}>
                            {shift.label}
                          </span>
                        )}
                      </div>
                      <div style={{fontSize:".63rem",color:rank.color,fontWeight:700,letterSpacing:".02em"}}>
                        {rank.title}{streak>=2?` 🔥×${streak}`:""}
                      </div>
                      {isFirst&&(
                        <div className="bc7" style={{fontSize:".56rem",color:"#FFD700",letterSpacing:".2em",marginTop:4}}>
                          CURRENT LEADER
                        </div>
                      )}
                      {/* Form dots */}
                      {(()=>{
                        const form=getArenaFormGuide(player.id,5);
                        if(!form.length)return null;
                        return(
                          <div style={{display:"flex",gap:3,marginTop:4}}>
                            {form.map((f,fi)=>(
                              <div key={fi} style={{
                                width:7,height:7,borderRadius:"50%",
                                background:f.win?player.color:"rgba(255,255,255,.18)",
                                boxShadow:f.win?`0 0 5px ${player.color}88`:"none",
                                flexShrink:0}}/>
                            ))}
                          </div>
                        );
                      })()}
                      {/* Benchmark */}
                      {(()=>{
                        const bm=getArenaBenchmark(player.id);
                        if(!bm)return null;
                        return(
                          <div style={{fontSize:".57rem",color:"var(--text3)",fontWeight:700,
                            marginTop:3,display:"flex",alignItems:"center",gap:3,
                            fontFamily:"Barlow Condensed",letterSpacing:".05em"}}>
                            <span style={{opacity:.5}}>↑</span>
                            <span style={{color:bm.target.color,opacity:.75}}>{bm.target.username}</span>
                            <span style={{opacity:.4}}>{bm.sameWins?`${bm.killGap}K`:` ${bm.winGap}W`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* HUD stats */}
                  {[
                    {v:player.wins,       c:"#FFD700"},
                    {v:player.kills,      c:"#FF4D8F"},
                    {v:player.kd,         c:"#00E5FF"},
                    {v:player.winRate+"%",c:"#00FF94"},
                    {v:player.appearances,c:"#FFAB40"},
                  ].map((s,si)=>(
                    <span key={si} className="stat-hud" style={{
                      textAlign:"center",
                      fontSize:isFirst?"1.1rem":".98rem",
                      color:isFirst?s.c:`${s.c}cc`,
                      animationDelay:`${si*.04+i*.02}s`,
                      textShadow:isFirst?`0 0 12px ${s.c}66`:"none",
                    }}>{s.v}</span>
                  ))}
                  {/* Level */}
                  <div style={{textAlign:"center"}}>
                    <div className="bc9" style={{fontSize:".88rem",
                      color:`${player.color}cc`,lineHeight:1}}>{lvl.lvl}</div>
                    <div style={{height:2,background:"rgba(255,255,255,.08)",
                      borderRadius:1,overflow:"hidden",marginTop:3}}>
                      <div style={{height:"100%",borderRadius:1,
                        background:player.color,width:`${lvl.progress}%`,
                        transition:"width .4s ease"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="lb-cards" style={{flexDirection:"column",gap:9}}>
            {filteredLB.map((player,i)=>{
              const globalRank=sortedLB.findIndex(p=>p.id===player.id);
              const medals=["🥇","🥈","🥉"];
              const rank=getRank(player.id);
              const shift=leaderboardShiftData.map[player.id];
              const isHL=spotlight===player.id;
              const isFirst=globalRank===0&&!foolsDay;
              const streak=getArenaStreak(player.id);
              return(
                <div key={player.id} onClick={()=>goProfile(player.id)} style={{...card({border:isHL?`2px solid ${player.color}`:isFirst?"1.5px solid rgba(255,215,0,.55)":`1.5px solid ${player.color}2a`}),
                  padding:"12px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",
                  background:isHL?`${player.color}10`:isFirst?"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,255,255,.02))":"var(--card)",
                  animation:`slideR .3s ease ${i*.03}s both`}}>
                  <span style={{fontFamily:"Fredoka One",fontSize:globalRank<3?"1.25rem":"1rem",
                    color:globalRank<3?"#fff":"var(--text3)",minWidth:26,textAlign:"center"}}>
                    {globalRank<3?medals[globalRank]:globalRank+1}
                  </span>
                  <Avatar p={player} size={36} glow={isHL}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <div style={{fontFamily:"Fredoka One",color:"#fff",fontSize:".9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {player.host?"👑 ":""}{dn(player.username)}
                      </div>
                      {shift&&shift.label!=="HOLD"&&(
                        <span className="bc7" style={{
                          fontSize:".5rem",
                          letterSpacing:".14em",
                          color:shift.tone==="up"?"#00FF94":shift.tone==="down"?"#FF6B35":"#00E5FF",
                          background:shift.tone==="up"?"rgba(0,255,148,.12)":shift.tone==="down"?"rgba(255,107,53,.12)":"rgba(0,229,255,.12)",
                          border:`1px solid ${shift.tone==="up"?"rgba(0,255,148,.35)":shift.tone==="down"?"rgba(255,107,53,.35)":"rgba(0,229,255,.35)"}`,
                          borderRadius:999,
                          padding:"2px 6px",
                        }}>
                          {shift.label}
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:".65rem",color:rank.color,fontWeight:700}}>
                      {rank.title}{streak>=2?` 🔥×${streak}`:""}
                    </div>
                    {isFirst&&<div className="bc7" style={{fontSize:".52rem",color:"#FFD700",letterSpacing:".18em",marginTop:3}}>CURRENT LEADER</div>}
                    {/* Form guide dots */}
                    {(()=>{
                      const form=getArenaFormGuide(player.id,5);
                      if(!form.length)return null;
                      return(
                        <div style={{display:"flex",gap:3,marginTop:4}}>
                          {form.map((f,fi)=>(
                            <div key={fi} title={f.win?"W":"L"} style={{
                              width:7,height:7,borderRadius:"50%",
                              background:f.win?player.color:"rgba(255,255,255,.18)",
                              boxShadow:f.win?`0 0 4px ${player.color}77`:"none",
                              flexShrink:0}}/>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    {[
                      {v:player.wins,         c:"#FFD700",l:"W"},
                      {v:player.kills,        c:"#FF4D8F",l:"K"},
                      {v:player.winRate+"%",  c:"#00FF94",l:"WR"},
                      {v:player.appearances,  c:"#FFAB40",l:"G"},
                      {v:"LV"+getPlayerLevel(player.id).lvl, c:"#C77DFF",l:"LVL"},
                    ].map((s,j)=>(
                      <div key={j} className="mob-hide" style={{textAlign:"center",minWidth:28}}>
                        <div className="bc9" style={{color:s.c,fontSize:".9rem",lineHeight:1}}>{s.v}</div>
                        <div className="bc7" style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {arenaScopeSessions.length===0&&(
            <div style={{textAlign:"center",padding:"48px 0"}}>
              <div style={{fontSize:"2.2rem",marginBottom:10}}>📊</div>
              <p style={{fontWeight:700,color:"var(--text2)"}}>
                {arenaRangeMeta.emptyTitle}
              </p>
              <p style={{fontSize:".82rem",color:"var(--text3)",marginTop:5}}>{arenaRangeMeta.emptyNote}</p>
            </div>
          )}
        </div>
  );
}
