export default function Season2View({ ctx }) {
  const {
    todayStr,
    SEASON_TWO_ID,
    SEASONS,
    sessions,
    allStats,
    players,
    compareSessionsAsc,
    getLatestSessionDate,
    getLatestDayConsequences,
    buildSeasonCampaignFile,
    joinHumanList,
    dn,
    formatLobbyDate,
    parseSessionIdNumber,
    go,
    goProfile,
    Avatar,
    s2CdClock,
    SEASON_TWO_LAUNCH_DATE,
  } = ctx;

  return (
<div className="fade-up season2-top-shell zone-view-shell" style={{minHeight:"calc(100vh - 120px)"}}>
          <div className="season2-hero-block" style={{textAlign:"center",marginBottom:32}}>
            <p style={{color:"#00E5FF",fontWeight:800,fontSize:".7rem",letterSpacing:3,
              textTransform:"uppercase",marginBottom:8}}>April 2026</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.4rem)",
              background:"linear-gradient(135deg,#00E5FF,#C77DFF,#00FF94)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              marginBottom:8}}>
              🚀 Season 2
            </h2>
            <p style={{color:"var(--text2)",fontSize:".88rem",fontWeight:600}}>
              {todayStr()<SEASON_TWO_LAUNCH_DATE
                ? "Season 2 is on deck. The board stays sealed until opening night."
                : "The live campaign file. Opening shots, swing nights, and pressure points are still being written."}
            </p>
          </div>
          {(()=>{
            const s2=SEASONS.find(x=>x.id===SEASON_TWO_ID);
            const s2Sessions=sessions.filter(s=>s.date>=s2.start&&s.date<=s2.end);
            const today=todayStr();
            const seasonFinalDay=today===s2.end;
            const finalDayFiled=s2Sessions.some((session)=>session.date===s2.end);
            // Hoist all data before any early return so esbuild stays in JS mode
            const s2Stats=allStats(s2Sessions).filter(p=>p.appearances>0);
            const byWins=[...s2Stats].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
            const byKills=[...s2Stats].sort((a,b)=>b.kills-a.kills);
            const byApp=[...s2Stats].sort((a,b)=>b.appearances-a.appearances);
            const totalKills=s2Sessions.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
            const uniqueWins=[...new Set(s2Sessions.filter(s=>s.winner).map(s=>s.winner))].length;
            const days=[...new Set(s2Sessions.map(s=>s.date))].length;
            const podium=byWins.slice(0,3);
            const seasonLeader=byWins[0]||null;
            const seasonChaser=byWins[1]||null;
            const killLeader=byKills[0]||null;
            const attendanceLeader=byApp[0]||null;
            const seasonLeaderPlayer=seasonLeader?players.find(p=>p.id===seasonLeader.id):null;
            const seasonChaserPlayer=seasonChaser?players.find(p=>p.id===seasonChaser.id):null;
            const killLeaderPlayer=killLeader?players.find(p=>p.id===killLeader.id):null;
            const attendanceLeaderPlayer=attendanceLeader?players.find(p=>p.id===attendanceLeader.id):null;
            const winsGap=seasonLeader&&seasonChaser?seasonLeader.wins-seasonChaser.wins:0;
            const attendanceTieCount=attendanceLeader
              ?byApp.filter((player)=>player.appearances===attendanceLeader.appearances).length
              :0;
            const quietWatchPlayer=[...s2Stats]
              .filter((player)=>player.wins===0)
              .sort((left,right)=>right.appearances-left.appearances||right.kills-left.kills)[0]||null;
            const quietWatchProfile=quietWatchPlayer?players.find((player)=>player.id===quietWatchPlayer.id):null;
            let topGame={pid:"",k:0,sid:"",date:""};
            s2Sessions.forEach(s=>{
              if(!s.kills)return;
              const entries=Object.keys(s.kills);
              for(let ei=0;ei<entries.length;ei++){
                const pid=entries[ei];const k=s.kills[pid];
                if(k>topGame.k){topGame.k=k;topGame.pid=pid;topGame.sid=s.id;topGame.date=s.date;}
              }
            });
            const topGameLobby=topGame.sid?`Lobby ${parseSessionIdNumber(topGame.sid)||topGame.sid}`:"";
            const s2Ordered=[...s2Sessions].sort(compareSessionsAsc);
            const s2Opener=s2Ordered[0]||null;
            const s2OpenerWinner=s2Opener?players.find((player)=>player.id===s2Opener.winner):null;
            const s2Campaign=buildSeasonCampaignFile(s2Sessions);
            const s2LoudestDay=s2Campaign?.loudestDay||null;
            const s2DayLeaders=s2LoudestDay?.topWinners?.length
              ?joinHumanList(s2LoudestDay.topWinners.map((entry)=>dn(entry.player?.username||"")))
              :"";
            const s2LatestDate=getLatestSessionDate(s2Sessions);
            const s2LatestFallout=s2LatestDate?getLatestDayConsequences(s2LatestDate):null;
            const s2LatestSplitLeaders=s2LatestFallout?.topWinners.length
              ?joinHumanList(s2LatestFallout.topWinners.map((entry)=>dn(entry.player?.username||"")))
              :"";
            const s2TurningNight=s2Campaign?.turningNight||null;
            const s2BestRun=s2Campaign?.bestRun||null;
            const s2LockNight=s2Campaign?.lockNight||null;
            const s2CrowdDay=s2Campaign?.biggestCrowd||null;
            const s2SpreadDay=s2Campaign?.widestWinnerDay||null;
            const seasonPulse=s2LoudestDay&&s2BestRun?.player
              ?`${uniqueWins} winners have already touched the file. ${formatLobbyDate(s2LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})} was the loudest night at ${s2LoudestDay.totalKills} kills, and ${dn(s2BestRun.player.username)} still owns the cleanest run at ${s2BestRun.streak} straight.`
              :seasonLeaderPlayer&&seasonChaserPlayer
                ?winsGap===0
                  ?`${dn(seasonLeaderPlayer.username)} and ${dn(seasonChaserPlayer.username)} are level on wins, and the file still has room to turn.`
                  :`${dn(seasonLeaderPlayer.username)} has the front for now, but only ${winsGap} win${winsGap===1?"":"s"} separate the top two files.`
                : `${uniqueWins} different winners have already left fingerprints on the season file.`;
            const quietPulse=quietWatchProfile&&quietWatchPlayer
              ? `${dn(quietWatchProfile.username)} is still chasing the first Season 2 win, so the support pack is still open.`
              : attendanceLeaderPlayer&&attendanceLeader
                ? attendanceTieCount>1
                  ? `${attendanceTieCount} players are tied at the attendance ceiling. Even the loyalty line is still crowded.`
                  : `${dn(attendanceLeaderPlayer.username)} has answered the call ${attendanceLeader.appearances} times already and keeps the season file moving.`
                : "The season file is still taking shape.";
            const s2NumberMarkers=[
              seasonLeaderPlayer&&seasonLeader
                ?{
                  label:"Top winner",
                  value:`${dn(seasonLeaderPlayer.username)} · ${seasonLeader.wins}W`,
                  note:winsGap>0&&seasonChaserPlayer
                    ?`${winsGap} win${winsGap===1?"":"s"} clear of ${dn(seasonChaserPlayer.username)}`
                    :"front line still tight",
                  color:"#FFD700",
                }
                :null,
              killLeaderPlayer&&killLeader
                ?{
                  label:"Top reaper",
                  value:`${dn(killLeaderPlayer.username)} · ${killLeader.kills}K`,
                  note:"still carrying the damage pace",
                  color:"#FF4D8F",
                }
                :null,
              s2BestRun?.player&&s2BestRun.streak>0
                ?{
                  label:"Longest streak",
                  value:`${dn(s2BestRun.player.username)} · ${s2BestRun.streak} straight`,
                  note:s2BestRun.end?`holds from ${formatLobbyDate(s2BestRun.end.date,{weekday:"short",day:"numeric",month:"short"})}`:"best run so far",
                  color:"#00E5FF",
                }
                :null,
              s2LoudestDay
                ?{
                  label:"Loudest night",
                  value:`${s2LoudestDay.totalKills}K on ${formatLobbyDate(s2LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:`${s2LoudestDay.lobbies} lobbies moved that night`,
                  color:"#FF6B35",
                }
                :null,
              s2CrowdDay
                ?{
                  label:"Biggest crowd",
                  value:`${s2CrowdDay.uniquePlayers} players on ${formatLobbyDate(s2CrowdDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:"the fullest room the season has pulled so far",
                  color:"#00FF94",
                }
                :null,
              s2SpreadDay&&s2SpreadDay.winnerSpread>1
                ?{
                  label:"Widest winner spread",
                  value:`${s2SpreadDay.winnerSpread} winners on ${formatLobbyDate(s2SpreadDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:"the room opened up instead of settling",
                  color:"#C77DFF",
                }
                :null,
            ].filter(Boolean).slice(0,5);
            const seasonDossier=s2Campaign?.openerWinner&&seasonLeaderPlayer
              ?`${dn(s2Campaign.openerWinner.username)} opened the live file on ${formatLobbyDate(s2Campaign.opener.date,{weekday:"short",day:"numeric",month:"short"})}. ${s2TurningNight&&s2Campaign?.leader?`${dn(s2Campaign.leader.username)} gave the table its first real turn on ${formatLobbyDate(s2TurningNight.date,{weekday:"short",day:"numeric",month:"short"})}.`:s2LoudestDay?.topKiller?.player?`${dn(s2LoudestDay.topKiller.player.username)} still owns the loudest night on ${formatLobbyDate(s2LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})}.`:"The file is still waiting on the night that changes how everybody reads it."} ${s2LockNight?`${dn(seasonLeaderPlayer.username)} has held the top line since ${formatLobbyDate(s2LockNight.date,{weekday:"short",day:"numeric",month:"short"})}, but the chase has not gone quiet.`:`${dn(seasonLeaderPlayer.username)} has the front with ${seasonLeader.wins} wins, but the file is still loose enough for one good night to bend it again.`}`
              :`${uniqueWins} different winners have already left fingerprints on the Season 2 file.`;
            const seasonMemoryCards=[
              {
                label:"OPENING SHOT",
                color:"#00E5FF",
                value:s2OpenerWinner
                  ?`${dn(s2OpenerWinner.username)} set the first live mark on the board`
                  :"Opening night is still waiting on its first winner",
                note:s2BestRun?.player&&s2BestRun.streak>=2&&s2BestRun.start&&s2BestRun.end
                  ?`${formatLobbyDate(s2Opener?.date||s2.start,{weekday:"short",day:"numeric",month:"short"})} started the campaign. ${dn(s2BestRun.player.username)} still owns the cleanest stretch on file with ${s2BestRun.streak} straight wins from Lobby ${parseSessionIdNumber(s2BestRun.start.id)||s2BestRun.start.id} to Lobby ${parseSessionIdNumber(s2BestRun.end.id)||s2BestRun.end.id}.`
                  :seasonPulse,
              },
              {
                label:"SWING NIGHT",
                color:"#C77DFF",
                value:s2TurningNight&&s2Campaign?.leader&&s2Campaign?.chaser
                  ?`${dn(s2Campaign.leader.username)} made ${formatLobbyDate(s2TurningNight.date,{weekday:"short",day:"numeric",month:"short"})} the night the race turned`
                  :s2LoudestDay?.topKiller?.player
                    ?`${dn(s2LoudestDay.topKiller.player.username)} turned ${formatLobbyDate(s2LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})} into the loudest night so far`
                    :topGame.pid&&players.find((player)=>player.id===topGame.pid)
                      ?`${dn(players.find((player)=>player.id===topGame.pid).username)} owns the season spike at ${topGame.k} kills`
                      :"The season is still waiting on one night everybody remembers",
                note:s2TurningNight&&s2Campaign?.leader&&s2Campaign?.chaser
                  ?`${dn(s2Campaign.leader.username)} won ${s2TurningNight.championDayWins} lobbies while ${dn(s2Campaign.chaser.username)} only took ${s2TurningNight.runnerUpDayWins}. ${s2LoudestDay&&s2LoudestDay.date!==s2TurningNight.date?`${formatLobbyDate(s2LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})} stayed the loudest night on raw damage, but this was the one that changed the top line.`:`The lead reached ${s2TurningNight.gap} wins by lights out.`}`
                  :s2LoudestDay
                  ?`${s2LoudestDay.totalKills} total kills across ${s2LoudestDay.lobbies} lobbies. ${s2DayLeaders?`${s2DayLeaders} carried the wins line while the whole board started talking.`:"That was the night the whole board jumped."}`
                  :topGame.pid&&players.find((player)=>player.id===topGame.pid)
                    ?`${topGameLobby} on ${formatLobbyDate(topGame.date,{weekday:"short",day:"numeric",month:"short"})} is still the loudest single-room burst in the file.`
                    :"The biggest room of the campaign has not landed yet.",
              },
              {
                label:"LIVE PRESSURE",
                color:"#00FF94",
                value:s2LatestFallout?.topWinners.length>=2&&s2LatestFallout.topKiller?.player
                  ?`${s2LatestSplitLeaders} split the latest session day`
                  :seasonLeaderPlayer&&seasonChaserPlayer
                    ?winsGap===0
                      ?`${dn(seasonLeaderPlayer.username)} and ${dn(seasonChaserPlayer.username)} are level at the top`
                      :`${dn(seasonLeaderPlayer.username)} is ${winsGap}W clear of ${dn(seasonChaserPlayer.username)}`
                    :attendanceLeaderPlayer
                      ?`${dn(attendanceLeaderPlayer.username)} keeps the file moving through attendance`
                      :"This campaign is still writing its first pressure point",
                note:s2LatestFallout?.topWinners.length>=2&&s2LatestFallout.topKiller?.player
                  ?`${dn(s2LatestFallout.topKiller.player.username)} still hauled out ${s2LatestFallout.topKiller.kills} kills, so the latest split did not settle anything.`
                  :s2LockNight&&seasonLeaderPlayer
                    ?`${dn(seasonLeaderPlayer.username)} has held the top line since ${formatLobbyDate(s2LockNight.date,{weekday:"short",day:"numeric",month:"short"})}, but the chase is still close enough for one sharp night to matter.`
                  :quietPulse,
              },
            ];

            // Pre-season state
            if(today<s2.start) return(
              <div>
                {/* Live S2 countdown */}
                <div style={{
                  background:"linear-gradient(135deg,rgba(0,229,255,.1),rgba(199,125,255,.08))",
                  border:"2px solid rgba(0,229,255,.4)",borderRadius:20,
                  padding:"36px 24px",textAlign:"center",marginBottom:20,
                  animation:"popIn .4s ease"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:".72rem",color:"#00E5FF",
                    letterSpacing:4,textTransform:"uppercase",marginBottom:16,opacity:.8}}>
                    Season 2 launches in
                  </div>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
                    {[{l:"Days",v:s2CdClock.d},{l:"Hours",v:s2CdClock.h},{l:"Mins",v:s2CdClock.m},{l:"Secs",v:s2CdClock.s}].map((seg,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.4)",borderRadius:14,
                        padding:"16px 20px",minWidth:70,border:"1px solid rgba(0,229,255,.2)"}}>
                        <div style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3rem)",
                          color:"#00E5FF",lineHeight:1}}>{String(seg.v).padStart(2,"0")}</div>
                        <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:800,
                          letterSpacing:1.5,textTransform:"uppercase",marginTop:4}}>{seg.l}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".86rem",fontWeight:600,
                    maxWidth:420,margin:"0 auto 20px",lineHeight:1.6}}>
                    Every old crown gets stripped, every quiet file opens again, and opening night writes the first real line.
                  </p>
                  <button onClick={()=>go("season1")} style={{
                    background:"rgba(0,229,255,.12)",border:"1.5px solid rgba(0,229,255,.35)",
                    borderRadius:12,padding:"9px 22px",color:"#00E5FF",fontWeight:800,
                    fontSize:".84rem",cursor:"pointer"}}>
                    Open Season 1 file
                  </button>
                </div>
              </div>
            );

            // No data yet
            if(!s2Sessions.length) return(
              <div style={{
                background:"var(--card)",border:"1.5px solid var(--border)",
                borderRadius:20,padding:"40px 24px",textAlign:"center"}}>
                <div style={{fontSize:"2.5rem",marginBottom:12}}>🎮</div>
                <div style={{fontFamily:"Fredoka One",fontSize:"1.3rem",color:"#00E5FF",marginBottom:8}}>
                  Season 2 is live, but the opener has not been filed yet
                </div>
                <p style={{color:"var(--text3)",fontSize:".85rem",fontWeight:600}}>
                  The room is waiting on that first finished lobby. Once it lands, this whole board stops feeling sealed and starts feeling hunted.
                </p>
              </div>
            );

            return(
              <div>
                {seasonFinalDay&&(
                  <div style={{
                    marginBottom:18,
                    padding:"12px 14px",
                    border:"1px solid rgba(255,215,0,.24)",
                    borderLeft:"3px solid rgba(255,215,0,.72)",
                    borderRadius:"0 10px 10px 0",
                    background:"linear-gradient(135deg,rgba(255,215,0,.1),rgba(0,229,255,.05),rgba(0,0,0,.26))",
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                    gap:12,
                    flexWrap:"wrap",
                  }}>
                    <div style={{minWidth:0}}>
                      <div className="bc7" style={{fontSize:".58rem",letterSpacing:".24em",color:"rgba(255,215,0,.78)",marginBottom:5}}>
                        FINAL DAY FILE
                      </div>
                      <div className="bc7" style={{fontSize:".78rem",lineHeight:1.65,color:"var(--text2)"}}>
                        Season 2 closes today. The wrap locks after the final filed lobby.
                      </div>
                    </div>
                    <div className="bc7" style={{fontSize:".68rem",letterSpacing:".14em",color:finalDayFiled?"#00FF94":"#FFD700",whiteSpace:"nowrap"}}>
                      {finalDayFiled?"FINAL DAY FILED":"FINAL ROOMS OPEN"}
                    </div>
                  </div>
                )}

                {/* Season 2 totals */}
                <div className="season2-banner" style={{
                  background:"linear-gradient(135deg,rgba(0,229,255,.12),rgba(0,255,148,.08),rgba(199,125,255,.1))",
                  border:"2px solid rgba(0,229,255,.35)",borderRadius:20,
                  padding:"24px 20px",marginBottom:28,textAlign:"center"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#00E5FF",marginBottom:16}}>
                    Season 2 by the Numbers
                  </div>
                  <div className="season2-banner-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
                    {[
                      {l:"Lobbies",v:s2Sessions.length,c:"#00E5FF",i:"🎮"},
                      {l:"Total Kills",v:totalKills,c:"#FF4D8F",i:"💀"},
                      {l:"Days Played",v:days,c:"#00FF94",i:"📅"},
                      {l:"Unique Winners",v:uniqueWins,c:"#C77DFF",i:"🏆"},
                      {l:"Longest Streak",v:s2BestRun?.streak?`${s2BestRun.streak}W`:"0W",c:"#FFD700",i:"🔥"},
                      {l:"Loudest Night",v:s2LoudestDay?`${s2LoudestDay.totalKills}K`:"0K",c:"#FF6B35",i:"🌋"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 10px"}}>
                        <div style={{fontSize:"1.4rem",marginBottom:4}}>{s.i}</div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.6rem",color:s.c,lineHeight:1}}>{s.v}</div>
                        <div style={{fontSize:".68rem",color:"var(--text3)",fontWeight:800,
                          textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="season2-banner-copy" style={{
                    marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.08)",
                    display:"grid",gap:8,textAlign:"left"}}>
                    <div style={{fontSize:".6rem",color:"rgba(0,229,255,.6)",fontWeight:800,
                      letterSpacing:".26em",textTransform:"uppercase"}}>Season pulse</div>
                    <div style={{fontSize:".8rem",color:"var(--text2)",fontWeight:700,lineHeight:1.7}}>
                      {seasonPulse}
                    </div>
                    <div style={{fontSize:".6rem",color:"rgba(199,125,255,.64)",fontWeight:800,
                      letterSpacing:".26em",textTransform:"uppercase"}}>Campaign dossier</div>
                    <div style={{fontSize:".78rem",color:"var(--text2)",fontWeight:700,lineHeight:1.7}}>
                      {seasonDossier}
                    </div>
                    <div style={{fontSize:".78rem",color:"var(--text3)",fontWeight:700,lineHeight:1.7}}>
                      {quietPulse}
                    </div>
                    {s2NumberMarkers.length>0&&(
                      <div className="season2-marker-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginTop:4}}>
                        {s2NumberMarkers.map((marker)=>(
                          <div key={marker.label} style={{
                            background:`linear-gradient(135deg,${marker.color}10,rgba(0,0,0,.26))`,
                            border:`1px solid ${marker.color}26`,
                            borderLeft:`3px solid ${marker.color}`,
                            borderRadius:"0 8px 8px 0",
                            padding:"11px 12px",
                          }}>
                            <div className="bc7" style={{fontSize:".55rem",letterSpacing:".18em",color:`${marker.color}bb`,marginBottom:5,textTransform:"uppercase"}}>
                              {marker.label}
                            </div>
                            <div className="bc9" style={{fontSize:".84rem",lineHeight:1.2,color:marker.color,marginBottom:4}}>
                              {marker.value}
                            </div>
                            <div className="bc7" style={{fontSize:".64rem",lineHeight:1.55,color:"var(--text3)"}}>
                              {marker.note}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  marginBottom:22,
                  padding:"11px 14px",
                  borderRadius:12,
                  border:"1px solid rgba(255,215,0,.18)",
                  background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(199,125,255,.05))",
                }}>
                  <div className="bc7" style={{fontSize:".78rem",lineHeight:1.55,color:"var(--text2)"}}>
                    Season ends in 6 days. The top line is still live.
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginBottom:28}}>
                  {seasonMemoryCards.map((card)=>(
                    <div key={card.label} style={{
                      background:`linear-gradient(135deg,${card.color}10,rgba(0,0,0,.32))`,
                      border:`1px solid ${card.color}30`,
                      borderLeft:`3px solid ${card.color}`,
                      borderRadius:"0 8px 8px 0",
                      padding:"14px 16px",
                    }}>
                      <div className="bc7" style={{fontSize:".56rem",letterSpacing:".22em",color:`${card.color}bb`,marginBottom:8}}>
                        {card.label}
                      </div>
                      <div className="bc9" style={{fontSize:".94rem",color:card.color,lineHeight:1.2,marginBottom:7}}>
                        {card.value}
                      </div>
                      <div className="bc7" style={{fontSize:".72rem",color:"var(--text2)",lineHeight:1.65}}>
                        {card.note}
                      </div>
                    </div>
                  ))}
                </div>

                {/* S2 Podium */}
                {podium.length>=1&&(
                  <div style={{marginBottom:28}}>
                    <h3 style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:"#00E5FF",
                      marginBottom:16,textAlign:"center"}}>🥇 Season 2 Standings</h3>
                    <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"flex-end",flexWrap:"wrap"}}>
                      {podium.map((p,i)=>{
                        const player=players.find(x=>x.id===p.id);
                        if(!player)return null;
                        const medals=["🥇","🥈","🥉"];
                        const heights=["140px","110px","90px"];
                        const sizes=[68,54,46];
                        return(
                          <div key={i} style={{
                            display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                            cursor:"pointer",animation:`popIn .4s ease ${i*.12}s both`}}
                            onClick={()=>goProfile(player.id)}>
                            <div style={{width:sizes[i],height:sizes[i],borderRadius:"50%",
                              background:`linear-gradient(135deg,${player.color},${player.color}88)`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontFamily:"Fredoka One",fontSize:i===0?"1.6rem":"1.2rem",color:"#fff",
                              boxShadow:`0 0 ${i===0?30:16}px ${player.color}66`,
                              border:`2px solid ${player.color}`}}>
                              {player.username[0]}
                            </div>
                            <div style={{fontFamily:"Fredoka One",fontSize:i===0?"1rem":".88rem",
                              color:player.color,textAlign:"center",maxWidth:90,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {player.host?"👑 ":""}{dn(player.username)}
                            </div>
                            <div style={{
                              background:i===0?"linear-gradient(135deg,#00E5FF,#00FF94)":i===1?"rgba(192,192,192,.2)":"rgba(205,127,50,.2)",
                              border:`1.5px solid ${i===0?"#00E5FF":i===1?"#C0C0C0":"#CD7F32"}`,
                              borderRadius:"12px 12px 0 0",
                              width:i===0?100:80,height:heights[i],
                              display:"flex",flexDirection:"column",alignItems:"center",
                              justifyContent:"flex-start",paddingTop:12,gap:4}}>
                              <div style={{fontSize:"1.6rem"}}>{medals[i]}</div>
                              <div style={{fontFamily:"Fredoka One",
                                color:i===0?"#160d2e":i===1?"#C0C0C0":"#CD7F32",
                                fontSize:i===0?"1.1rem":".9rem"}}>{p.wins}W</div>
                              <div style={{fontSize:".7rem",color:i===0?"rgba(22,13,46,.7)":"var(--text3)",fontWeight:700}}>{p.kills}K</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* S2 Award cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:28}}>
                  {[
                    {icon:"👑",color:"#00E5FF",title:"S2 Champion",player:byWins[0],stat:byWins[0]?`${byWins[0].wins}W · ${byWins[0].kills}K`:"Crown line still open",desc:seasonLeaderPlayer&&seasonChaserPlayer
                      ?winsGap===0
                        ?`The live crown is dead even with ${dn(seasonChaserPlayer.username)}. The next clean finish changes the page.`
                        :winsGap===1
                          ?`${dn(seasonChaserPlayer.username)} is only one win behind and still within one loud night of the lead.`
                          :`${winsGap} wins clear of ${dn(seasonChaserPlayer.username)} while the chase still has teeth.`
                      :"Currently carrying the season crown"},
                    {icon:"💀",color:"#FF4D8F",title:"S2 Reaper",player:byKills[0],stat:byKills[0]?`${byKills[0].kills} total kills`:"Damage board still open",desc:killLeaderPlayer&&seasonLeaderPlayer
                      ?killLeaderPlayer.id===seasonLeaderPlayer.id
                        ?"Holding both the crown line and the damage pace while the rest of the file tries to catch up."
                        :`Still driving the damage board even while ${dn(seasonLeaderPlayer.username)} controls the wins race.`
                      :"Setting the damage line for the season"},
                    {icon:"🎮",color:"#00FF94",title:"Most Loyal",player:byApp[0],stat:byApp[0]?`${byApp[0].appearances} lobbies`:"Attendance file still forming",desc:attendanceTieCount>1
                      ?`Sharing the attendance ceiling with ${attendanceTieCount-1} other regular${attendanceTieCount-1===1?"":"s"} and keeping the campaign loud through presence alone.`
                      :"Keeps answering the call and making sure the live file never goes quiet."},
                    ...(topGame.pid?[{icon:"☄️",color:"#C77DFF",title:"Best Single Game",player:players.find(p=>p.id===topGame.pid),stat:`${topGame.k} kills in ${topGameLobby}`,desc:`${formatLobbyDate(topGame.date,{weekday:"short",day:"numeric",month:"short"})} · still the room every damage spike gets measured against.`}]:[]),
                  ].map((a,i)=>{
                    if(!a.player)return null;
                    const playerObj=a.player.username?a.player:players.find(p=>p.id===a.player?.id);
                    if(!playerObj)return null;
                    return(
                      <div key={i} className="card-h" onClick={()=>goProfile(playerObj.id)}
                        style={{background:`linear-gradient(135deg,${a.color}12,var(--card))`,
                          border:`2px solid ${a.color}44`,borderRadius:16,padding:"18px 16px",
                          cursor:"pointer",animation:`fadeUp .4s ease ${i*.07}s both`}}>
                        <div style={{fontSize:"1.8rem",marginBottom:8}}>{a.icon}</div>
                        <div style={{fontSize:".68rem",color:a.color,fontWeight:800,
                          letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{a.title}</div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                          <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                            background:`linear-gradient(135deg,${playerObj.color},${playerObj.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:".9rem",color:"#fff"}}>
                            {playerObj.username[0]}
                          </div>
                          <div style={{fontFamily:"Fredoka One",color:playerObj.color,fontSize:".95rem",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {playerObj.host?"👑 ":""}{playerObj.username}
                          </div>
                        </div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:a.color,marginBottom:2}}>{a.stat}</div>
                        <div style={{fontSize:".72rem",color:"var(--text3)"}}>{a.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Full S2 leaderboard */}
                <div style={{marginBottom:8}}>
                  <h3 style={{fontFamily:"Fredoka One",fontSize:"1.15rem",color:"#00E5FF",marginBottom:14}}>
                    📊 Full Season 2 Leaderboard
                  </h3>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {byWins.map((p,i)=>{
                      const player=players.find(x=>x.id===p.id);
                      if(!player)return null;
                      return(
                        <div key={i} onClick={()=>goProfile(player.id)} style={{
                          display:"flex",alignItems:"center",gap:12,
                          background:"var(--card)",border:`1.5px solid ${i<3?"rgba(0,229,255,.3)":"var(--border)"}`,
                          borderRadius:13,padding:"10px 14px",cursor:"pointer",
                          animation:`fadeUp .3s ease ${i*.03}s both`}}>
                          <div style={{fontFamily:"Fredoka One",fontSize:"1rem",
                            color:i===0?"#00E5FF":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--text3)",
                            width:22,textAlign:"center",flexShrink:0}}>
                            {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                          </div>
                          <Avatar p={player} size={34}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"Fredoka One",color:player.color,fontSize:".92rem",
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {player.host?"👑 ":""}{dn(player.username)}
                            </div>
                          </div>
                          <div style={{display:"flex",gap:14,flexShrink:0}}>
                            {[
                              {l:"W",v:p.wins,c:"#FFD700"},
                              {l:"K",v:p.kills,c:"#FF4D8F"},
                              {l:"GP",v:p.appearances,c:"#00E5FF"},
                            ].map((s,j)=>(
                              <div key={j} style={{textAlign:"center",minWidth:28}}>
                                <div style={{fontFamily:"Fredoka One",fontSize:".95rem",color:s.c,lineHeight:1}}>{s.v}</div>
                                <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:800}}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
  );
}
