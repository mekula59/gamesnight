import { BriefingFeed, HomeStage, LeaderSlideshow } from "./lazyViewComponents";

export default function HomeView({ ctx }) {
  const {
    foolsDay,
    getLatestSessionDate,
    getSeasonForDate,
    todayStr,
    SEASONS,
    activeCampaign,
    sessions,
    allStats,
    players,
    getStats,
    dn,
    getMissionBoardState,
    cd,
    live,
    HOSTED_BY,
    FEATURED_GAME,
    getLeaderboardShiftData,
    getLatestDayConsequences,
    getStorylines,
    getDayRecap,
    getDayStorylines,
    getDailyMVP,
    getLobbyDateMarker,
    parseSessionIdNumber,
    getLiveStreaks,
    getLatestDayHeatRun,
    getOnDeckPressure,
    isEventActive,
    card,
    primaryBtn,
    goProfile,
    Avatar,
  } = ctx;

  const joinHumanList = (items) => {
    const list = items.filter(Boolean);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
  };

  return (
<div className="fade-up home-mobile-shell zone-view-shell" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* ── April Fools floating jesters ── */}
          {foolsDay&&(
            <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:5}}>
              {[{e:"🃏",t:"10%",l:"5%",delay:"0s",dur:"3.2s",anim:"jesterFloat"},
                {e:"🃏",t:"20%",r:"6%",delay:".7s",dur:"2.8s",anim:"jesterDrift"},
                {e:"🃏",t:"60%",l:"3%",delay:"1.1s",dur:"3.6s",anim:"jesterFloat"},
                {e:"🃏",t:"70%",r:"4%",delay:".4s",dur:"4.0s",anim:"jesterSpin"},
              ].map((j,ji)=>(
                <span key={ji} style={{position:"absolute",fontSize:"clamp(1.2rem,3vw,1.8rem)",
                  top:j.t,left:j.l||undefined,right:j.r||undefined,
                  animation:`${j.anim} ${j.dur} ease-in-out ${j.delay} infinite`,
                  userSelect:"none",filter:"drop-shadow(0 0 10px rgba(255,77,143,.6))"}}>{j.e}</span>
              ))}
            </div>
          )}

          {/* ── Season / date row ── */}
          {(()=>{
            const latestDate=getLatestSessionDate();
            const currentSeason=activeCampaign||getSeasonForDate(latestDate)||SEASONS[SEASONS.length-1];
            const homeTodayDate=todayStr?todayStr():latestDate;
            const currentSeasonClosed=Boolean(homeTodayDate&&currentSeason.end&&homeTodayDate>currentSeason.end);
            const seasonSess=sessions.filter(s=>s.date>=currentSeason.start&&s.date<=currentSeason.end);
            const seasonKills=seasonSess.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
            const seasonWinnerCount=[...new Set(seasonSess.filter((session)=>session.winner).map((session)=>session.winner))].length;
            const allStats_lb=allStats();
            const champion=allStats_lb.sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0];
            const championP=champion?players.find(p=>p.id===champion.id):null;
            const s2Champion_stats=allStats(seasonSess).sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0];
            const s2ChampP=s2Champion_stats?players.find(p=>p.id===s2Champion_stats.id):null;
            const leaderP=s2ChampP||championP;
            const leaderStats=leaderP?getStats(leaderP.id,seasonSess):null;
            const byS2W=allStats(seasonSess).filter(p=>p.appearances>0).sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
            const secondP=byS2W[1]?players.find(p=>p.id===byS2W[1].id):null;
            const gapW=byS2W[1]?(byS2W[0].wins-byS2W[1].wins):0;
            const missionBoard=getMissionBoardState();
            const missions=missionBoard.missions;
            const openMissionCount=missionBoard.openCount;
            const hottestMission=missionBoard.hottestMission;
            const nextOpenMission=missionBoard.nextMission;
            const adaptiveMissionBoard=missionBoard.mode==="adaptive";
            const nextMissionRemaining=nextOpenMission
              ?Math.max(nextOpenMission.target-nextOpenMission.progress,0)
              :0;
            const nextMissionRemainingLabel=nextOpenMission
              ?`${nextMissionRemaining} ${nextMissionRemaining===1?nextOpenMission.measureSingular:nextOpenMission.measurePlural} left`
              :"";
            const commandClockCompact=`${cd.d>0?`${cd.d}D `:""}${String(cd.h).padStart(2,"0")}H ${String(cd.m).padStart(2,"0")}M ${String(cd.s).padStart(2,"0")}S`;
            const clockUrgent=!live&&cd.d===0&&cd.h<=1;
            const commandStatusColor=live
              ?"#00FF94"
              :clockUrgent
                ?"#FFD700"
                :"#00E5FF";
            const frontGapValue=leaderP&&secondP
              ?gapW===0?"TIED":`${gapW}W`
              :leaderStats
                ?`${leaderStats.wins}W`
                :"OPEN";

            // Slideshow data for the Field Command read.
            const s2StatsSorted=allStats(seasonSess).filter(p=>p.appearances>0);
            const slide1P=s2ChampP;
            const slide1St=slide1P?getStats(slide1P.id,seasonSess):null;
            const slide1Sub=slide1P&&secondP&&gapW>=0
              ?currentSeasonClosed
                ?`${dn(secondP.username)} finished ${gapW}W back`
                :`${dn(secondP.username)} is ${gapW}W behind`
              :null;
            const s2KillsLeader=[...s2StatsSorted].sort((a,b)=>b.kills-a.kills)[0];
            const slide2P=s2KillsLeader?players.find(p=>p.id===s2KillsLeader.id):null;
            const s2KillsTwo=[...s2StatsSorted].sort((a,b)=>b.kills-a.kills)[1];
            const slide2SubP=s2KillsTwo?players.find(p=>p.id===s2KillsTwo.id):null;
            const slide2Sub=slide2SubP?`${dn(slide2SubP.username)} has ${s2KillsTwo.kills}K`:null;
            let s2BestPid="",s2BestK=0,s2BestSid="";
            for(let _si=0;_si<seasonSess.length;_si++){
              const _s=seasonSess[_si];const _ks=Object.keys(_s.kills||{});
              for(let _ki=0;_ki<_ks.length;_ki++){const _p=_ks[_ki];const _k=_s.kills[_p];if(_k>s2BestK){s2BestK=_k;s2BestPid=_p;s2BestSid=_s.id;}}
            }
            const slide3P=s2BestPid?players.find(p=>p.id===s2BestPid):null;
            const s2AppLeader=[...s2StatsSorted].sort((a,b)=>b.appearances-a.appearances)[0];
            const slide4P=s2AppLeader?players.find(p=>p.id===s2AppLeader.id):null;
            const slide4St=slide4P?getStats(slide4P.id,seasonSess):null;
            let s2BestStreakPid="",s2BestStreakV=0,s2BestStreakKills=0;
            const orderedSeasonSess=[...seasonSess].sort((a,b)=>
              a.date.localeCompare(b.date)||
              ((parseSessionIdNumber(a.id)||0)-(parseSessionIdNumber(b.id)||0))
            );
            players.forEach(pl=>{
              const played=orderedSeasonSess.filter((session)=>session.attendees?.includes(pl.id));
              let current=0,currentKills=0;
              played.forEach((session)=>{
                if(session.winner===pl.id){
                  current+=1;
                  currentKills+=Number(session.kills?.[pl.id]||0);
                  if(current>s2BestStreakV||(current===s2BestStreakV&&currentKills>s2BestStreakKills)){
                    s2BestStreakV=current;
                    s2BestStreakPid=pl.id;
                    s2BestStreakKills=currentKills;
                  }
                }else{
                  current=0;
                  currentKills=0;
                }
              });
            });
            const slide5P=s2BestStreakPid&&s2BestStreakV>=2?players.find(p=>p.id===s2BestStreakPid):null;
            const slide5St=slide5P?getStats(slide5P.id,seasonSess):null;
            const leaderSlides=[
              slide1P&&slide1St&&{label:`${currentSeason.name.toUpperCase()} WINS LEADER`,player:slide1P,stat:`${slide1St.wins}W this season · ${getStats(slide1P.id).wins}W all time`,sub:slide1Sub,icon:"🏆"},
              slide2P&&s2KillsLeader&&{label:`${currentSeason.name.toUpperCase()} KILL LEADER`,player:slide2P,stat:`${s2KillsLeader.kills} kills this season · ${s2KillsLeader.appearances} lobbies`,sub:slide2Sub,icon:"💀"},
              slide3P&&s2BestK>0&&{label:"BEST SINGLE GAME THIS SEASON",player:slide3P,stat:`${s2BestK} kills in one lobby`,sub:`Lobby ${s2BestSid}`,icon:"☄️"},
              slide4P&&slide4St&&{label:`${currentSeason.name.toUpperCase()} MOST APPEARANCES`,player:slide4P,stat:`${slide4St.appearances} lobbies · ${slide4St.wins}W`,sub:"Most committed player this season",icon:"📅"},
              slide5P&&slide5St&&{label:"BEST WIN STREAK THIS SEASON",player:slide5P,stat:`${s2BestStreakV} consecutive wins`,sub:`${slide5St.wins}W from ${slide5St.appearances} lobbies in ${currentSeason.name}`,icon:"🔥"},
            ].filter(Boolean);
            const latestFallout=getLatestDayConsequences(latestDate);
            const stories=getStorylines();
            const seasonShiftData=getLeaderboardShiftData(currentSeason.id,"wins");
            const leaderStageTitle=leaderP
              ? currentSeasonClosed
                ? `${dn(leaderP.username)} finished first in ${currentSeason.name}`
                : `${dn(leaderP.username)} is setting the pace in ${currentSeason.name}`
              : currentSeasonClosed
                ? `${currentSeason.name} closed without a filed front-runner`
                : `${currentSeason.name} is still looking for a front-runner`;
            const leaderStageSub=leaderP&&secondP
              ?currentSeasonClosed
                ? "FINAL STANDINGS LOCKED"
                :gapW===0
                  ? "FRONT LINE TIED"
                  :`${gapW}W GAP AT THE TOP`
              :leaderSlides.length
                ? currentSeasonClosed
                  ? `${leaderSlides.length} FINAL READS`
                  : `${leaderSlides.length} LIVE READS`
                : currentSeasonClosed
                  ? "FILE SEALED"
                  : "RACE STILL FORMING";
            const falloutDateLabel=latestDate
              ?new Date(latestDate+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"long"})
              :"";
            const splitLeaders=latestFallout?.topWinners.length
              ?joinHumanList(latestFallout.topWinners.map((entry)=>dn(entry.player?.username||"")))
              :"";
            const topKillers=latestFallout?.topKillers?.length
              ?latestFallout.topKillers
              :(latestFallout?.topKiller?.player?[latestFallout.topKiller]:[]);
            const topKillerNames=topKillers.length
              ?joinHumanList(topKillers.map((entry)=>dn(entry.player?.username||"")))
              :"";
            const topKillCount=topKillers[0]?.kills||latestFallout?.topKiller?.kills||0;
            const latestDayHeadline=(()=>{
              if(!latestFallout?.topWinners.length||!topKillers.length)return "";
              if(latestFallout.topWinners.length===1&&topKillers.length>1){
                const winnerName=dn(latestFallout.topWinners[0].player?.username||"");
                return `${winnerName} owned ${falloutDateLabel} with ${latestFallout.topWinCount} wins, while ${topKillerNames} tied on damage at ${topKillCount} kills each.`;
              }
              if(latestFallout.topWinners.length>=2&&topKillers.length>1){
                return `${splitLeaders} split ${falloutDateLabel} at ${latestFallout.topWinCount} wins each, and ${topKillerNames} matched the damage line at ${topKillCount} kills each.`;
              }
              if(latestFallout.topWinners.length>=2&&latestFallout.topKiller?.player){
                return `${splitLeaders} split ${falloutDateLabel} at ${latestFallout.topWinCount} wins each, but ${dn(latestFallout.topKiller.player.username)} still hauled out the heavier ${latestFallout.topKiller.kills}-kill line.`;
              }
              if(latestFallout.topWinners.length===1&&latestFallout.topKiller?.player){
                const winnerName=dn(latestFallout.topWinners[0].player?.username||"");
                const killerName=dn(latestFallout.topKiller.player.username);
                return latestFallout.topWinners[0].player?.id===latestFallout.topKiller.player.id
                  ?`${winnerName} owned ${falloutDateLabel} with ${latestFallout.topWinCount} wins and ${latestFallout.topKiller.kills} kills.`
                  :`${winnerName} owned ${falloutDateLabel} with ${latestFallout.topWinCount} wins, while ${killerName} carried the damage race at ${latestFallout.topKiller.kills} kills.`;
              }
              return "";
            })();
            const briefingTitle=latestDayHeadline
              ? `${falloutDateLabel} changed the pressure map. ${latestDayHeadline}`
              :stories.length
              ? "Live reads on the streaks, grudges, droughts, and pressure spikes shaping the room"
              : "Fresh reads will lock in here as soon as the room has more data";
            const recap=getDayRecap(latestDate);
            const recapStorylines=latestDate?getDayStorylines(latestDate):[];
            const mvp=getDailyMVP();
            let dateLabel="";
            let recapTag="AFTER-ACTION REPORT";
            let recapTitle="No session report is locked in yet";
            let recapNotesLabel="FIELD NOTES";
            let recapFieldNotes=[];
            let mvpCards=[];
            if(recap&&recap.lobbies){
              const dd=new Date(latestDate+"T12:00:00Z");
              dateLabel=dd.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
              const latestMarker=getLobbyDateMarker(latestDate);
              const specialTag=latestMarker?`${latestMarker.icon} ${latestMarker.label} · `:"";
              recapTag=`${specialTag}AFTER-ACTION REPORT`;
              recapTitle=latestDayHeadline
                ? latestDayHeadline
                :`${recap.totalKills} confirmed kills across ${recap.lobbies} lobbies on the last session day`;
              const recapConsequenceEntries=(latestFallout?.consequences||[]).slice(0,4);
              recapNotesLabel=recapConsequenceEntries.length
                ?"CONSEQUENCE TRACKER"
                :"FIELD NOTES";
              recapFieldNotes=recapConsequenceEntries.map((entry)=>entry.text);
              const tw=mvp&&mvp.topWinner?players.find(p=>p.id===mvp.topWinner.id):null;
              const tk=mvp&&mvp.topKiller?players.find(p=>p.id===mvp.topKiller.id):null;
              const ta=mvp&&mvp.topAppear?players.find(p=>p.id===mvp.topAppear.id):null;
              const kk=mvp&&mvp.killKing?players.find(p=>p.id===mvp.killKing.id):null;
              const killKingLobby=mvp?.killKing?.killKingSid
                ?`Lobby ${parseSessionIdNumber(mvp.killKing.killKingSid)||mvp.killKing.killKingSid}`
                :"";
              mvpCards=[
                {icon:"🏆",label:"MOST WINS",       player:tw,stat:mvp?.topWinner?.wins+"W",       sub:"lobbies won",     c:"#FFD700"},
                {icon:"💀",label:"MOST KILLS",       player:tk,stat:mvp?.topKiller?.kills+"K",      sub:"total kills",     c:"#FF4D8F"},
                {icon:"☄️",label:"BEST SINGLE GAME", player:kk,stat:mvp?.killKing?.killKingK+"K",   sub:killKingLobby, c:"#FF6B35"},
                {icon:"📅",label:"MOST APPEARANCES", player:ta,stat:mvp?.topAppear?.appearances+"G",sub:"lobbies played",  c:"#00E5FF"},
              ].filter(c=>c.player);
            }
            const missionTitle=missionBoard.title;
            const missionStageSub=missionBoard.subline;
            const liveHeat=getLatestDayHeatRun()||null;
            const liveHeatPlayer=liveHeat?.player||null;
            const seasonEndDate=currentSeason.end?new Date(`${currentSeason.end}T12:00:00Z`):null;
            const todayDate=homeTodayDate;
            const seasonAnchorDate=todayDate?new Date(`${todayDate}T12:00:00Z`):null;
            const seasonDaysLeft=seasonEndDate&&seasonAnchorDate
              ?Math.max(0,Math.ceil((seasonEndDate-seasonAnchorDate)/(1000*60*60*24)))
              :null;
            const seasonClosed=Boolean(todayDate&&currentSeason.end&&todayDate>currentSeason.end);
            const seasonClosing=!seasonClosed&&seasonDaysLeft!=null&&seasonDaysLeft<=10;
            const seasonFinalDay=!seasonClosed&&todayDate===currentSeason.end;
            const homePulseCards=[
              latestDayHeadline
                ?{
                  label:"WHAT MATTERS NOW",
                  value:latestFallout?.topWinners.length===1
                    ?`${dn(latestFallout.topWinners[0].player?.username||"")} owned the last session day`
                    :`${splitLeaders} split the last session day`,
                  note:topKillers.length>1
                    ?`${topKillerNames} matched the damage line at ${topKillCount} kills each, so the room closed with the win board and damage board pulling in different directions.`
                    :`${dn(latestFallout.topKiller?.player?.username||"")} still dragged out ${latestFallout.topKiller?.kills} kills and kept the room's damage line in one pair of hands.`,
                  color:"#FFD700",
                }
                :latestFallout?.reboundWin
                  ?{
                    label:"WHAT MATTERS NOW",
                    value:`${dn(latestFallout.reboundWin.player.username)} hit back in Lobby ${parseSessionIdNumber(latestFallout.reboundWin.session.id)||latestFallout.reboundWin.session.id}`,
                    note:`${latestFallout.reboundWin.priorDayLobbies} earlier lobbies went quiet before that response landed with ${latestFallout.reboundWin.kills} kills.`,
                    color:"#00E5FF",
                  }
                  :recap
                    ?{
                      label:"WHAT MATTERS NOW",
                      value:`${recap.lobbies} lobbies moved the room on ${falloutDateLabel}`,
                      note:`${recap.totalKills} total kills and ${recap.winnersList.length} winning file${recap.winnersList.length===1?"":"s"} came out of the last session day.`,
                      color:"#FFD700",
                    }
                    :{
                      label:"WHAT MATTERS NOW",
                      value:"The board is waiting on the next room",
                      note:"Once the next set of results lands, this is where the pressure change gets called first.",
                      color:"#FFD700",
                    },
            ];
            return(<>
              {/* Hero title — Easter / Fools / default */}
              <div className="home-hero-block zone-receive-follow" style={{"--receive-delay":"120ms",marginBottom:34,position:"relative"}}>
                {(()=>{
                  const isEaster=isEventActive();
                  if(isEaster) return(
                    <>
                      <div style={{marginBottom:10}}>
                        <span className="easter-hud">
                          <span className="easter-hud-dot"/>Easter 2026
                        </span>
                      </div>
                      <div className="easter-logo-zone" style={{display:"inline-block"}}>
                        {[
                          {e:"🥚",top:"-14px",left:"4px",  delay:"0s",  dur:"3.0s",anim:"eggBounce"},
                          {e:"🐣",top:"-18px",right:"2px", delay:".6s", dur:"2.6s",anim:"eggFloat"},
                          {e:"🥚",bottom:"-8px",left:"12px",delay:"1.0s",dur:"3.4s",anim:"eggDrift"},
                          {e:"🐰",bottom:"-6px",right:"6px",delay:".3s",dur:"4.0s",anim:"eggSpin"},
                          {e:"🌸",top:"28%",left:"-16px",  delay:"1.3s",dur:"2.8s",anim:"eggFloat"},
                          {e:"🥚",top:"26%",right:"-14px", delay:".8s", dur:"3.2s",anim:"eggBounce"},
                        ].map((eg,ei)=>(
                          <span key={ei} style={{
                            position:"absolute",fontSize:"clamp(1.1rem,3vw,1.6rem)",
                            top:eg.top||"auto",bottom:eg.bottom||"auto",
                            left:eg.left||"auto",right:eg.right||"auto",
                            animation:`${eg.anim} ${eg.dur} ease-in-out ${eg.delay} infinite`,
                            pointerEvents:"none",zIndex:2,userSelect:"none",
                            filter:"drop-shadow(0 0 8px rgba(255,215,0,.45))",
                          }}>{eg.e}</span>
                        ))}
                        <h1 className="hero-h1 easter-h1" style={{
                          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                          backgroundClip:"text",filter:"none",position:"relative",zIndex:1,
                          margin:"0 0 12px"}}>
                          🐣 GAMES<br/>NIGHT
                        </h1>
                      </div>
                      <div className="bc7" style={{fontSize:".76rem",letterSpacing:".24em",color:"var(--text3)"}}>
                        {FEATURED_GAME} · EASTER BREAK · DOOM ISLAND
                      </div>
                    </>
                  );
                  return(
                    <>
                      <h1 className="bc9" style={{
                        fontSize:"clamp(3.5rem,14vw,7rem)",letterSpacing:".05em",lineHeight:.82,
                        background:"linear-gradient(160deg,#FFD700 0%,#FF6B35 40%,#FF4D8F 70%,#C77DFF 100%)",
                        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                        margin:"0 0 12px",
                        ...(foolsDay?{filter:"hue-rotate(180deg)"}:{})}}>
                        {foolsDay?"🃏 GAMES":"GAMES"}<br/>NIGHT
                      </h1>
                      <div className="bc7" style={{fontSize:".76rem",letterSpacing:".24em",color:"var(--text3)"}}>
                        {FEATURED_GAME} · MON-SAT · 5PM UTC · HOSTED BY {HOSTED_BY.toUpperCase()}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Season stat strip */}
              <div className="home-stat-strip zone-receive-follow" style={{"--receive-delay":"170ms",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(76px,1fr))",
                gap:1,marginBottom:30,border:"1px solid rgba(255,215,0,.12)",borderRadius:2,overflow:"hidden"}}>
                {[
                  {l:`${currentSeason.name.toUpperCase()} LOBBIES`,v:seasonSess.length,   c:"#00E5FF"},
                  {l:`${currentSeason.name.toUpperCase()} KILLS`,  v:seasonKills, c:"#FF4D8F"},
                  {l:"UNIQUE WINNERS", v:seasonWinnerCount, c:"#FFD700"},
                  seasonClosed
                    ?{l:"SEASON STATUS", v:"LOCKED", c:"#FFD700"}
                    :seasonClosing
                    ?{l:"WINDOW LEFT", v:seasonDaysLeft>0?`${seasonDaysLeft}D`:"FINAL", c:"#FFD700"}
                    :{l:"FRONT GAP", v:frontGapValue, c:"#C77DFF"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"16px 10px 15px",textAlign:"center",
                    background:"rgba(255,255,255,.02)",borderRight:"1px solid rgba(255,255,255,.04)"}}>
                    <div className="bc9" style={{fontSize:"clamp(1.1rem,4vw,1.8rem)",color:s.c,
                      lineHeight:1,textShadow:`0 0 14px ${s.c}33`}}>{s.v}</div>
                    <div className="bc7" style={{fontSize:".56rem",letterSpacing:".16em",
                      color:"var(--text3)",marginTop:6,lineHeight:1.45}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {currentSeason.id==="s3"&&seasonSess.length>0&&(
                <div className="zone-receive-follow" style={{
                  "--receive-delay":"185ms",
                  margin:"-14px 0 28px",
                  padding:"10px 13px",
                  border:"1px solid rgba(255,77,143,.2)",
                  borderLeft:"3px solid rgba(255,77,143,.68)",
                  borderRadius:"0 8px 8px 0",
                  background:"linear-gradient(135deg,rgba(255,77,143,.1),rgba(0,0,0,.24))",
                }}>
                  <div className="bc7" style={{fontSize:".74rem",lineHeight:1.55,color:"var(--text2)"}}>
                    Season 3 file opened on May 1. The first board is live.
                  </div>
                </div>
              )}

              {seasonFinalDay&&(
                <div className="zone-receive-follow" style={{
                  "--receive-delay":"185ms",
                  margin:"-14px 0 28px",
                  padding:"10px 13px",
                  border:"1px solid rgba(255,215,0,.2)",
                  borderLeft:"3px solid rgba(255,215,0,.72)",
                  borderRadius:"0 8px 8px 0",
                  background:"linear-gradient(135deg,rgba(255,215,0,.1),rgba(0,0,0,.24))",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"space-between",
                  gap:10,
                  flexWrap:"wrap",
                }}>
                  <div>
                    <div className="bc7" style={{fontSize:".55rem",letterSpacing:".22em",color:"rgba(255,215,0,.72)",marginBottom:4}}>
                      FINAL DAY WATCH
                    </div>
                    <div className="bc7" style={{fontSize:".74rem",lineHeight:1.55,color:"var(--text2)"}}>
                      Final day window is open. Positions harden when the last rooms file.
                    </div>
                  </div>
                  {leaderP&&leaderStats&&(
                    <div className="bc9" style={{fontSize:".86rem",color:"#FFD700",letterSpacing:".08em",whiteSpace:"nowrap"}}>
                      {dn(leaderP.username).toUpperCase()} · {leaderStats.wins}W
                    </div>
                  )}
                </div>
              )}

              <div key={`pulse-${latestDate||currentSeason.id}`} className="home-pulse-grid zone-receive-follow" style={{"--receive-delay":"220ms",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:34}}>
                {homePulseCards.map((card,index)=>(
                  <div key={card.label} className="state-react-card state-react-live" style={{
                    background:index===0
                      ?`linear-gradient(135deg,${card.color}14,rgba(0,0,0,.42))`
                      :`linear-gradient(135deg,${card.color}09,rgba(0,0,0,.34))`,
                    border:`1px solid ${card.color}${index===0?"36":"26"}`,
                    borderLeft:`${index===0?4:3}px solid ${card.color}`,
                    borderRadius:"0 8px 8px 0",
                    padding:index===0?"17px 18px 18px":"15px 17px 16px",
                    minHeight:index===0?118:110,
                    boxShadow:index===0?`0 0 20px ${card.color}12`:"none",
                  }}>
                    <div className="bc7" style={{fontSize:".56rem",letterSpacing:".24em",color:`${card.color}bb`,marginBottom:9}}>
                      {card.label}
                    </div>
                    <div className="bc9" style={{fontSize:index===0?"clamp(1rem,3vw,1.15rem)":"clamp(.94rem,3vw,1.05rem)",color:card.color,lineHeight:1.24,marginBottom:9}}>
                      {card.value}
                    </div>
                    <div className="bc7" style={{fontSize:".75rem",color:"var(--text2)",lineHeight:1.72,maxWidth:index===0?null:360}}>
                      {card.note}
                    </div>
                  </div>
                ))}
              </div>

              <HomeStage
                tag="FIELD COMMAND"
                title={leaderStageTitle}
                sub={leaderStageSub}
                accent="#FFD700">
                <LeaderSlideshow slides={leaderSlides}/>
              </HomeStage>

              <HomeStage
                tag="INTELLIGENCE BRIEFING"
                title={briefingTitle}
                sub={stories.length?`${stories.length} LIVE READS`:"SYNCING ROOM DATA"}
                accent="#00FF94">
                <BriefingFeed key={stories.map((story)=>`${story.icon}|${story.color}|${story.text}`).join("||")} stories={stories}/>
              </HomeStage>

              {recap&&recap.lobbies&&(
                <HomeStage
                  tag={recapTag}
                  title={recapTitle}
                  sub={dateLabel.toUpperCase()}
                  accent="#FFD700">
                  <div key={`after-action-${latestDate}`} className="after-action-card state-react-card state-react-live" style={{
                    background:"rgba(255,255,255,.02)",
                    border:"1px solid rgba(255,255,255,.07)",
                    borderLeft:"3px solid rgba(255,215,0,.4)",
                    borderRadius:"0 8px 8px 0",padding:"19px 20px 20px"}}>
                    <div className="after-action-stats" style={{display:"grid",
                      gridTemplateColumns:"repeat(4,1fr)",
                      gap:1,border:"1px solid rgba(255,255,255,.06)",
                      borderRadius:2,overflow:"hidden",marginBottom:18}}>
                        {[
                          {l:"LOBBIES", v:recap.lobbies,         c:"#00E5FF"},
                          {l:"PLAYERS", v:recap.uniquePlayers,   c:"#C77DFF"},
                          {l:"KILLS",   v:recap.totalKills,      c:"#FF4D8F"},
                          {l:"WINNERS", v:recap.winnersList?.length||0,c:"#FFD700"},
                        ].map((s,i)=>(
                        <div key={i} style={{padding:"12px 9px 11px",textAlign:"center",
                          background:"rgba(255,255,255,.025)"}}>
                          <div className="bc9" style={{fontSize:"clamp(.9rem,3vw,1.3rem)",
                            color:s.c,lineHeight:1}}>{s.v}</div>
                          <div className="bc7" style={{fontSize:".55rem",letterSpacing:".13em",
                            color:"rgba(200,186,255,.72)",marginTop:5,lineHeight:1.45}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {recapFieldNotes.length>0&&(
                      <div className="after-action-group state-react-card state-react-live" style={{
                        display:"grid",gap:10,marginBottom:18,
                        padding:"15px 16px 0",marginLeft:-2,marginRight:-2,
                        borderTop:"1px solid rgba(255,255,255,.06)",
                        background:"linear-gradient(180deg,rgba(0,255,148,.035),transparent 78%)",
                        borderRadius:"6px 6px 0 0"}}>
                        <div className="bc7" style={{fontSize:".61rem",letterSpacing:".21em",
                          color:"rgba(0,255,148,.7)"}}>{recapNotesLabel}</div>
                        {recapFieldNotes.map((note,i)=>(
                          <div key={i} className="bc7" style={{fontSize:".72rem",
                            color:"var(--text2)",lineHeight:1.75,letterSpacing:".035em"}}>
                            <span style={{color:"#00FF94",marginRight:8}}>▸</span>{note}
                          </div>
                        ))}
                      </div>
                    )}
                    {recapStorylines.length>0&&(
                      <div className="after-action-group state-react-card state-react-live" style={{
                        display:"grid",gap:11,marginBottom:18,
                        padding:"15px 16px 0",marginLeft:-2,marginRight:-2,
                        borderTop:"1px solid rgba(255,255,255,.06)",
                        background:"linear-gradient(180deg,rgba(255,215,0,.03),transparent 82%)",
                        borderRadius:"6px 6px 0 0"}}>
                        <div className="bc7" style={{fontSize:".61rem",letterSpacing:".21em",
                          color:"rgba(255,215,0,.76)"}}>STORYLINES</div>
                        {recapStorylines.map((line,i)=>(
                          <div key={i} className="bc7" style={{fontSize:".74rem",
                            color:"var(--text2)",lineHeight:1.8,letterSpacing:".03em"}}>
                            <span style={{color:"#FFD700",marginRight:8}}>◆</span>{line}
                          </div>
                        ))}
                      </div>
                    )}
                    {mvpCards.length>0&&(
                      <div className="after-action-mvp" style={{display:"grid",
                        gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginTop:2}}>
                        {mvpCards.map((c,i)=>(
                          <div key={i} onClick={()=>goProfile(c.player.id)} style={{
                            padding:"13px 14px 14px",cursor:"pointer",
                            background:`${c.c}08`,
                            border:`1px solid ${c.c}1a`,
                            borderLeft:`2px solid ${c.c}55`,
                            borderRadius:"0 4px 4px 0",
                            transition:"transform .1s"}}
                            onMouseEnter={e=>e.currentTarget.style.transform="translateX(2px)"}
                            onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}>
                            <div className="bc7" style={{fontSize:".58rem",letterSpacing:".16em",
                              color:`${c.c}96`,marginBottom:8}}>{c.icon} {c.label}</div>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                              <Avatar p={c.player} size={24}/>
                              <div className="bc9" style={{fontSize:".78rem",
                                color:c.player.color,overflow:"hidden",
                                textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
                                {dn(c.player.username)}
                              </div>
                            </div>
                            <div className="bc9" style={{fontSize:"1.1rem",color:c.c,
                              lineHeight:1,textShadow:`0 0 10px ${c.c}44`}}>{c.stat}</div>
                            {c.sub&&<div className="bc7" style={{fontSize:".6rem",
                              color:"rgba(200,186,255,.7)",marginTop:6,letterSpacing:".055em",lineHeight:1.5}}>{c.sub}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {recap.winnersList&&recap.winnersList.length>1&&(
                      <div className="bc7 after-action-rollup" style={{fontSize:".74rem",color:"rgba(200,186,255,.74)",
                        lineHeight:2.05,marginTop:20,paddingTop:20,
                        borderTop:"1px solid rgba(255,255,255,.06)"}}>
                        {recap.winnersList.slice(0,6).map((w,i)=>(
                          <span key={i}>
                            {i>0?" · ":""}
                            <span style={{color:w.player?.color||"#fff",cursor:"pointer"}}
                              onClick={()=>w.player&&goProfile(w.player.id)}>
                              {dn(w.player?.username||"?")}{w.wins>1?` ×${w.wins}`:""}
                            </span>
                          </span>
                        ))} claimed lobbies
                      </div>
                    )}
                  </div>
                </HomeStage>
              )}

              <HomeStage
                tag="MISSION BOARD"
                title={missionTitle}
                sub={missionStageSub}
                accent="#C77DFF"
                marginBottom={8}>
                <div style={{display:"grid",
                  gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
                  gap:18,alignItems:"start"}}>
                  <div className="mission-board">
                    {missions.map((m,i)=>{
                      const pct=m.target>0?Math.round((m.progress/m.target)*100):0;
                      const done=m.progress>=m.target;
                      const remaining=Math.max(m.target-m.progress,0);
                      const heatingUp=!done&&pct>=75;
                      const building=!done&&pct>=40;
                      const stateLabel=m.stateLabel||(done
                        ? "CLEARED"
                        : remaining===1
                          ? "ON THE EDGE"
                          : heatingUp
                            ? "CLOSING IN"
                            : building
                              ? "BUILDING"
                              : "LIVE WATCH");
                      const stateColor=m.stateColor||(done
                        ? "#00FF94"
                        : remaining===1
                          ? "#FFD700"
                          : heatingUp
                            ? m.color
                            : building
                              ? m.color
                              : "rgba(255,255,255,.56)");
                      const missionMood=m.mood||(done
                        ?m.clearedCopy
                        : remaining===1
                          ?`1 ${m.measureSingular} left. The next clean result changes the board.`
                        : heatingUp
                            ?`${remaining} ${remaining===1?m.measureSingular:m.measurePlural} left. The room can already feel this one leaning.`
                            : building
                              ?`${remaining} ${remaining===1?m.measureSingular:m.measurePlural} still needed. This objective is starting to shape who matters next.`
                              : m.progress===0
                                ?`No movement yet. The first result will decide whether this one matters.`
                                :`${m.unit} so far. Enough movement to put this one on the room's radar.`);
                      const missionFooter=m.footer||(done
                        ? "PAYOFF ACTIVE"
                        : remaining===1
                          ? "ONE RESULT FROM A SWING"
                        : heatingUp
                            ? "ROOM MOOD TILTING"
                            : building
                              ? "PRESSURE BUILDING"
                              : "WEEKLY OBJECTIVE");
                      const missionReadout=done
                        ? "LOCKED"
                        : remaining===1
                          ? "1 LEFT"
                          : remaining>1
                            ? `${remaining} LEFT`
                            : `${pct}%`;
                      return(
                        <div key={i} className="mission-item" style={{
                          "--m-color":m.color,
                          background:done
                            ?`linear-gradient(135deg,${m.color}12,rgba(0,0,0,.3))`
                            : heatingUp
                              ?`linear-gradient(135deg,${m.color}10,rgba(0,0,0,.28))`
                              :"rgba(255,255,255,.025)",
                          boxShadow:done
                            ?"0 0 16px rgba(0,255,148,.08)"
                            : heatingUp
                              ?`0 0 18px ${m.color}18`
                              :"none",
                        }}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:"1.1rem",flexShrink:0}}>{m.icon}</span>
                              <div>
                                <div className="bc9" style={{fontSize:".72rem",
                                  color:done?"#00FF94":m.color,letterSpacing:".1em"}}>
                                  {m.label}
                                </div>
                                <div className="bc7" style={{fontSize:".64rem",color:"var(--text3)",
                                  letterSpacing:".04em",marginTop:2}}>{m.desc}</div>
                              </div>
                            </div>
                            <div className="bc7" style={{
                              fontSize:".52rem",letterSpacing:".24em",
                              color:stateColor,padding:"5px 7px",
                              borderRadius:999,
                              border:`1px solid ${done?"rgba(0,255,148,.28)":`${stateColor}44`}`,
                              background:done?"rgba(0,255,148,.08)":`${stateColor}12`,
                              flexShrink:0}}>
                              {stateLabel}
                            </div>
                          </div>
                          <div className="bc7" style={{fontSize:".66rem",color:"var(--text2)",lineHeight:1.65,marginBottom:8}}>
                            {missionMood}
                          </div>
                          <div className="mission-bar-track">
                            <div className="mission-bar-fill" style={{
                              width:`${pct}%`,
                              background:done?`linear-gradient(90deg,#00FF94,${m.color})`:`linear-gradient(90deg,${m.color}88,${m.color})`,
                              boxShadow:done?"0 0 8px rgba(0,255,148,.5)":`0 0 6px ${m.color}44`,
                            }}/>
                          </div>
                          <div className="bc7" style={{display:"flex",justifyContent:"space-between",gap:12,
                            fontSize:".58rem",color:done?"#00FF94":"var(--text3)",
                            letterSpacing:".12em",marginTop:7,alignItems:"baseline"}}>
                            <span>{missionFooter}</span>
                            <span style={{color:stateColor}}>{missionReadout}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                      minHeight:"100%",
                      background:`linear-gradient(180deg,${commandStatusColor}16,rgba(0,0,0,.44))`,
                      border:`1.5px solid ${commandStatusColor}2f`,
                      borderLeft:`4px solid ${commandStatusColor}66`,
                      borderRadius:"0 10px 10px 0",
                      padding:"20px 20px 21px",
                      boxShadow:`0 0 28px ${commandStatusColor}14`,
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
                        <div className="bc7" style={{fontSize:".58rem",letterSpacing:".34em",
                          color:`${commandStatusColor}99`}}>
                        ▸ COMMAND CLOCK
                        </div>
                        <div className="bc7" style={{
                          fontSize:".5rem",letterSpacing:".24em",
                          color:`${commandStatusColor}cc`,
                          padding:"5px 8px",
                          borderRadius:999,
                          border:`1px solid ${commandStatusColor}33`,
                          background:`${commandStatusColor}12`,
                          flexShrink:0,
                        }}>
                          {live?"ROOM LIVE NOW":"COUNTDOWN ACTIVE"}
                        </div>
                      </div>
                      <div className="bc9" style={{fontSize:"1.18rem",color:commandStatusColor,
                        lineHeight:1.05,marginBottom:6,
                        textShadow:`0 0 22px ${commandStatusColor}33`}}>
                        {live?"Next room opens after the current window":"Next room opens in"}
                      </div>
                      <div className="bc7" style={{fontSize:".72rem",lineHeight:1.68,color:"var(--text2)",marginBottom:16}}>
                        {live
                          ? "This clock is already counting toward the next clean reset."
                          : adaptiveMissionBoard
                            ? "The core weekly board is locked, but these live watches stay active until the room opens."
                            : "Every tick leaves the weekly board exactly where it is until the room opens."}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"stretch",flexWrap:"wrap"}}>
                        {[
                          {v:String(cd.d).padStart(2,"0"), l:"DAYS",    show:cd.d>0},
                          {v:String(cd.h).padStart(2,"0"), l:"HOURS",   show:true},
                          {v:String(cd.m).padStart(2,"0"), l:"MINUTES", show:true},
                          {v:String(cd.s).padStart(2,"0"), l:"SECONDS", show:true},
                        ].filter(d=>d.show||d.l==="HOURS"||d.l==="MINUTES"||d.l==="SECONDS").map((d,i)=>(
                          <div key={i} style={{
                            textAlign:"center",minWidth:cd.d>0?70:76,
                            padding:"11px 10px 10px",
                            background:`linear-gradient(180deg,rgba(0,0,0,.3),${commandStatusColor}10)`,
                            border:`1px solid ${commandStatusColor}26`,
                            borderRadius:12,
                            boxShadow:`inset 0 0 0 1px rgba(255,255,255,.02),0 0 18px ${commandStatusColor}12`}}>
                            <div className="bc9" style={{
                              fontSize:cd.d>0?"clamp(2.4rem,8vw,4rem)":"clamp(2.8rem,10vw,5rem)",
                              color:commandStatusColor,lineHeight:1,
                              textShadow:`0 0 24px ${commandStatusColor}66,0 0 48px ${commandStatusColor}22`,
                              letterSpacing:"-.01em"}}>
                              {d.v}
                            </div>
                            <div className="bc7" style={{fontSize:".55rem",letterSpacing:".22em",
                              color:`${commandStatusColor}88`,marginTop:5}}>{d.l}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bc7" style={{fontSize:".6rem",letterSpacing:".26em",
                        color:`${commandStatusColor}88`,marginTop:14}}>
                        MON-SAT · 5PM UTC · HOSTED BY {HOSTED_BY.toUpperCase()}
                      </div>
                      <div className="bc7" style={{fontSize:".74rem",color:"var(--text2)",
                        marginTop:10,letterSpacing:".045em",lineHeight:1.76}}>
                        {adaptiveMissionBoard&&nextOpenMission
                          ?`${nextOpenMission.label} is the sharpest live watch right now at ${nextOpenMission.progress}/${nextOpenMission.target}.`
                          :nextOpenMission
                          ?`${nextOpenMission.label} is closest to moving at ${nextOpenMission.progress}/${nextOpenMission.target}.`
                          :"The board resets the moment the room opens."}
                      </div>
                      <div className="bc7" style={{fontSize:".74rem",color:"var(--text2)",
                        marginTop:8,letterSpacing:".04em",lineHeight:1.78}}>
                        {adaptiveMissionBoard
                          ? missionBoard.supportLines[0]||"Core weekly goals are locked, but the live watches stay open until reset."
                          : nextMissionRemaining===1&&nextOpenMission
                            ?`One clean result locks ${nextOpenMission.label} and changes the board mood.`
                          : nextOpenMission
                            ?`${nextMissionRemainingLabel}. That is the closest swing still on the board.`
                            :"Fresh results will set the next objective pressure."}
                      </div>
                      {adaptiveMissionBoard&&missionBoard.supportLines[1]&&(
                        <div className="bc7" style={{fontSize:".74rem",color:"var(--text2)",
                          marginTop:8,letterSpacing:".04em",lineHeight:1.78}}>
                          {missionBoard.supportLines[1]}
                        </div>
                      )}
                    </div>
                </div>
              </HomeStage>
            </>);
          })()}
        </div>
  );
}
