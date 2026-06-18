"use client";

import { useState, useEffect, useMemo } from "react";
import { useData } from "@/lib/db";
import { getLvlInfo, getRank } from "@/lib/utils";

const TABS = [
  { id: 'global', label: 'Global (Nivel)', icon: 'ti-world' },
  { id: 'weekly', label: 'Top Semanal', icon: 'ti-calendar-event' },
  { id: 'achievements', label: 'Top Logros', icon: 'ti-trophy' },
  { id: 'training', label: 'Top Entrenamiento', icon: 'ti-barbell' },
  { id: 'habits', label: 'Top Hábitos', icon: 'ti-checks' },
  { id: 'nutrition', label: 'Top Nutrición', icon: 'ti-salad' },
  { id: 'finance', label: 'Top Finanzas', icon: 'ti-coin' },
  { id: 'study', label: 'Top Estudio', icon: 'ti-book' },
];

export default function SocialPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  const [cfg] = useData<any>("cfg");
  const [totalXP] = useData<number>("totalXP");
  const [xpLog] = useData<any[]>("xpLog");
  const [calStates] = useData<any>("calStates");
  const [habLogs] = useData<any>("habLogs");
  const [foodLogs] = useData<any>("foodLogs");
  const [sales] = useData<any[]>("sales");
  const [bibleProgress] = useData<any>("bibleProgress");
  const [lastBackup] = useData<number>("lastBackup");

  useEffect(() => {
    setMounted(true);
  }, []);

  const allUsers = useMemo(() => {
    if (!mounted || !cfg) return [];

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    let myWeekly = 0;
    let myTraining = 0;
    let myNutrition = 0;
    let myHabits = 0;
    let myFinance = 0;
    let myStudy = 0;

    (xpLog || []).forEach(log => {
      const lbl = (log.label || "").toLowerCase();
      
      // Weekly calc
      if (log.ts >= oneWeekAgo) {
        myWeekly += log.amount;
      }
      
      // Category calc (All time for tops, or maybe weekly? The prompt says "los que mas exp ganaron en la semana, mayor ganancia de exp por entrenamiento, mayor exp por nutricion, etc". Usually Top is all time for these specific tasks, but we can just sum up the all-time XP for these categories to make it a general Top)
      // I will sum all-time for categories.
      if (lbl.includes("rutina") || lbl.includes("entren") || lbl.includes("push") || lbl.includes("pull") || lbl.includes("pierna")) {
        myTraining += log.amount;
      } else if (lbl.includes("comida") || lbl.includes("kcal") || lbl.includes("peso") || lbl.includes("dieta") || lbl.includes("nutric")) {
        myNutrition += log.amount;
      } else if (lbl.includes("hábito") || lbl.includes("habit")) {
        myHabits += log.amount;
      } else if (lbl.includes("venta") || lbl.includes("ingreso") || lbl.includes("finanz") || lbl.includes("diner") || lbl.includes("ganancia")) {
        myFinance += log.amount;
      } else if (lbl.includes("libro") || lbl.includes("capítulo") || lbl.includes("biblia") || lbl.includes("lectur") || lbl.includes("estudio") || lbl.includes("facultad")) {
        myStudy += log.amount;
      }
    });

    let unlocked = 0;
    const { lvl } = getLvlInfo(totalXP || 0);

    // Habits
    let streak = 0;
    if (habLogs) {
      const d = new Date();
      while (true) {
        const ds = d.toISOString().slice(0, 10);
        const dayLog = habLogs[ds];
        if (!dayLog || !Object.values(dayLog).includes(1)) break;
        streak++;
        d.setDate(d.getDate() - 1);
      }
    }
    const hasHabit = Object.values(habLogs || {}).some((l: any) => Object.values(l).includes(1));
    const habitCountTotal = Object.values(habLogs || {}).reduce((acc: number, log: any) => acc + Object.values(log).filter(Boolean).length, 0);
    let perfectWeek = false;
    if (habLogs) {
      let perfectDays = 0;
      const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
      last7.forEach(d => {
        if (habLogs[d] && Object.values(habLogs[d]).filter(Boolean).length > 0) perfectDays++;
      });
      perfectWeek = perfectDays === 7;
    }

    if (hasHabit) unlocked++;
    if (streak >= 3) unlocked++;
    if (streak >= 7) unlocked++;
    if (streak >= 14) unlocked++;
    if (streak >= 30) unlocked++;
    if (streak >= 60) unlocked++;
    if (streak >= 100) unlocked++;
    if (streak >= 365) unlocked++;
    if (perfectWeek) unlocked++;
    if (habitCountTotal >= 100) unlocked++;

    // Training
    const trainDays = Object.keys(calStates || {}).filter(k => calStates[k] === "done");
    const trainCount = trainDays.length;
    const hasTrain = trainCount > 0;
    const weekendTrain = trainDays.some(d => {
      const day = new Date(d + 'T12:00:00Z').getUTCDay();
      return day === 0 || day === 6;
    });

    if (hasTrain) unlocked++;
    if (trainCount >= 5) unlocked++;
    if (trainCount >= 10) unlocked++;
    if (trainCount >= 25) unlocked++;
    if (trainCount >= 50) unlocked++;
    if (trainCount >= 75) unlocked++;
    if (trainCount >= 100) unlocked++;
    if (trainCount >= 150) unlocked++;
    if (trainCount >= 300) unlocked++;
    if (weekendTrain) unlocked++;

    // Finances
    const salesList = sales || [];
    const salesCount = salesList.length;
    const totProfit = salesList.reduce((acc, s) => acc + (s.profit || 0), 0);
    const hasHighTicket = salesList.some(s => (s.profit || 0) >= 500);

    if (salesCount > 0) unlocked++;
    if (salesCount >= 5) unlocked++;
    if (salesCount >= 10) unlocked++;
    if (salesCount >= 25) unlocked++;
    if (salesCount >= 50) unlocked++;
    if (salesCount >= 100) unlocked++;
    if (totProfit >= 1000) unlocked++;
    if (totProfit >= 10000) unlocked++;
    if (totProfit >= 100000) unlocked++;
    if (hasHighTicket) unlocked++;

    // Nutrition
    const foodDays = Object.keys(foodLogs || {}).length;
    if (foodDays >= 1) unlocked++;
    if (foodDays >= 7) unlocked++;
    if (foodDays >= 30) unlocked++;
    if (foodDays >= 180) unlocked++;
    if (foodDays >= 365) unlocked++;

    // Study
    const hasBible = Object.values(bibleProgress || {}).some((b: any) => Object.values(b).includes(true));
    let bibleRead = 0, bibleTotal = 0;
    if (bibleProgress) {
      Object.values(bibleProgress).forEach((b: any) => {
        bibleTotal += Object.keys(b).length;
        bibleRead += Object.values(b).filter(Boolean).length;
      });
    }
    const biblePct = bibleTotal > 0 ? (bibleRead / bibleTotal) * 100 : 0;

    if (hasBible) unlocked++;
    if (bibleRead >= 10) unlocked++;
    if (bibleRead >= 50) unlocked++;
    if (bibleRead >= 100) unlocked++;
    if (biblePct >= 10) unlocked++;
    if (biblePct >= 25) unlocked++;
    if (biblePct >= 50) unlocked++;
    if (biblePct >= 100) unlocked++;

    // General / Levels
    if (lvl >= 5) unlocked++;
    if (lvl >= 10) unlocked++;
    if (lvl >= 25) unlocked++;
    if (lvl >= 50) unlocked++;
    if (lvl >= 75) unlocked++;
    if (lvl >= 100) unlocked++;
    if ((lastBackup || 0) > 0) unlocked++;

    const currentUser = {
      id: "current_user",
      name: cfg.name || "Tú (Usuario)",
      avatar: cfg.profilePic || "",
      totalXP: totalXP || 0,
      weeklyXP: myWeekly,
      trainingXP: myTraining,
      nutritionXP: myNutrition,
      habitsXP: myHabits,
      financeXP: myFinance,
      studyXP: myStudy,
      achievementsCount: unlocked,
      isCurrentUser: true
    };

    // Return only the real users (in this case, just the current user since it's a local app)
    // When a backend is connected, you can spread other fetched users here.
    return [currentUser];
  }, [mounted, cfg, totalXP, xpLog, calStates, habLogs, foodLogs, sales, bibleProgress, lastBackup]);

  const sortedUsers = useMemo(() => {
    const list = [...allUsers];
    if (activeTab === 'global') {
      list.sort((a, b) => b.totalXP - a.totalXP);
    } else if (activeTab === 'weekly') {
      list.sort((a, b) => b.weeklyXP - a.weeklyXP);
    } else if (activeTab === 'training') {
      list.sort((a, b) => b.trainingXP - a.trainingXP);
    } else if (activeTab === 'nutrition') {
      list.sort((a, b) => b.nutritionXP - a.nutritionXP);
    } else if (activeTab === 'habits') {
      list.sort((a, b) => b.habitsXP - a.habitsXP);
    } else if (activeTab === 'finance') {
      list.sort((a, b) => b.financeXP - a.financeXP);
    } else if (activeTab === 'study') {
      list.sort((a, b) => b.studyXP - a.studyXP);
    } else if (activeTab === 'achievements') {
      list.sort((a, b) => b.achievementsCount - a.achievementsCount);
    }
    return list;
  }, [allUsers, activeTab]);

  if (!mounted || !cfg) return <div className="section active"><div style={{ padding: '20px' }}>Cargando Social...</div></div>;

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">SOCIAL / RANKING</div>
      </div>

      <div className="tabs" style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg2)',
              color: activeTab === tab.id ? '#fff' : 'var(--text2)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              fontFamily: 'Inter',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className={`ti ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '40px' }}>
        {sortedUsers.length === 0 && (
           <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '20px' }}>
              No hay usuarios en esta categoría aún.
           </div>
        )}
        {sortedUsers.map((u, i) => {
          const { lvl } = getLvlInfo(u.totalXP);
          const rank = getRank(lvl);
          const isMe = u.isCurrentUser;
          
          let scoreValue = 0;
          let scoreLabel = "";
          
          if (activeTab === 'global') {
            scoreValue = u.totalXP;
            scoreLabel = "XP Total";
          } else if (activeTab === 'weekly') {
            scoreValue = u.weeklyXP;
            scoreLabel = "XP Semanal";
          } else if (activeTab === 'training') {
            scoreValue = u.trainingXP;
            scoreLabel = "XP Entreno";
          } else if (activeTab === 'nutrition') {
            scoreValue = u.nutritionXP;
            scoreLabel = "XP Nutrición";
          } else if (activeTab === 'habits') {
            scoreValue = u.habitsXP;
            scoreLabel = "XP Hábitos";
          } else if (activeTab === 'finance') {
            scoreValue = u.financeXP;
            scoreLabel = "XP Finanzas";
          } else if (activeTab === 'study') {
            scoreValue = u.studyXP;
            scoreLabel = "XP Estudio";
          } else if (activeTab === 'achievements') {
            scoreValue = u.achievementsCount;
            scoreLabel = "Logros Desbloqueados";
          }

          const posColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text2)";
          const scale = isMe ? 1.02 : 1;
          const bg = isMe ? `linear-gradient(90deg, var(--bg3) 0%, ${cfg.accentColor || 'var(--accent)'}22 100%)` : 'var(--bg2)';

          return (
            <div key={u.id} style={{
              display: 'flex',
              alignItems: 'center',
              background: bg,
              border: isMe ? `1px solid ${cfg.accentColor || 'var(--accent)'}` : '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px 20px',
              transform: `scale(${scale})`,
              transition: 'all 0.2s',
              boxShadow: isMe ? `0 4px 20px ${cfg.accentColor || 'var(--accent)'}22` : 'none',
              zIndex: isMe ? 10 : 1
            }}>
              <div style={{ width: '40px', fontWeight: 'bold', fontSize: i < 3 ? '20px' : '16px', color: posColor }}>
                #{i + 1}
              </div>
              
              <div style={{
                width: '45px', height: '45px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg3)', backgroundImage: u.avatar && !u.avatar.startsWith('http') && isMe ? `url(${u.avatar})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center', marginRight: '15px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${rank.color}`
              }}>
                {(u.avatar && u.avatar.startsWith('http')) ? (
                  <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (!u.avatar || (!u.avatar.startsWith('http') && !isMe)) && (
                  <i className="ti ti-user" style={{ color: 'var(--text2)' }}></i>
                )}
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: isMe ? 'var(--text)' : 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {u.name} {isMe && <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>TÚ</span>}
                </div>
                <div style={{ fontSize: '12px', color: rank.color, fontWeight: 600, marginTop: '2px' }}>
                  LVL {lvl} • {rank.name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>
                  {scoreValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {scoreLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
