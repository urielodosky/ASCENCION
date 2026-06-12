
// ── DATABASE ──────────────────────────────────────────────────────────
const DB = {
    get(k, d) { try { const v = localStorage.getItem('pa8_' + k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pa8_' + k, JSON.stringify(v)); flashSave(); } catch (e) { console.error(e); } }
};
function flashSave() { const el = document.getElementById('save-flash'); if (!el) return; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800); }
function showToast(msg, color = 'var(--green)') { const t = document.getElementById('toast'); t.textContent = msg; t.style.borderColor = color; t.style.color = color; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800); }

// ── STATE ──────────────────────────────────────────────────────────────
let cfg = DB.get('cfg', { name: '', age: 25, height: 175, sex: 'm', peso: 80, pesoGoal: 75, kcal: 2200, prot: 180, carb: 220, fat: 70, fiber: 30, activity: 1.55, goal: 'cut', e1: 'Empresa 1', e2: 'Empresa 2', e3: 'Empresa 3', goalMonthly: 5000, onboarded: false, currency: 'ARS', usdRate: 1000, accentColor: '#ff0040', darkMode: true, fontSize: 1, weightUnit: 'kg', appName: 'ASCENSION', defaultSections: 'Entrada en calor,Rutina principal,ABS' });
let routines = DB.get('routines', [{ id: 'r1', name: 'DÍA 1 — PUSH', cat: 'Hipertrofia', notes: '', exercises: [{ id: 'e1', n: 'Press Banca', sets: 4, reps: 8, weight: 80, rest: 90, notes: '' }, { id: 'e2', n: 'Press Inclinado', sets: 3, reps: 10, weight: 65, rest: 75, notes: '' }, { id: 'e3', n: 'Press Militar', sets: 4, reps: 8, weight: 50, rest: 90, notes: '' }, { id: 'e4', n: 'Fondos', sets: 3, reps: 12, weight: 0, rest: 60, notes: 'BW' }] }, { id: 'r2', name: 'DÍA 2 — PULL', cat: 'Fuerza', notes: '', exercises: [{ id: 'e5', n: 'Peso Muerto', sets: 4, reps: 5, weight: 120, rest: 120, notes: '' }, { id: 'e6', n: 'Dominadas', sets: 4, reps: 8, weight: 0, rest: 90, notes: '' }, { id: 'e7', n: 'Remo Barra', sets: 4, reps: 8, weight: 70, rest: 90, notes: '' }, { id: 'e8', n: 'Curl Barra', sets: 3, reps: 12, weight: 40, rest: 60, notes: '' }] }, { id: 'r3', name: 'DÍA 3 — PIERNAS', cat: 'Fuerza', notes: '', exercises: [{ id: 'e9', n: 'Sentadilla', sets: 5, reps: 5, weight: 100, rest: 120, notes: '' }, { id: 'e10', n: 'Prensa', sets: 4, reps: 10, weight: 160, rest: 90, notes: '' }, { id: 'e11', n: 'Curl Femoral', sets: 3, reps: 12, weight: 40, rest: 60, notes: '' }] }]);
let completedEx = DB.get('completedEx', {});
let calStates = DB.get('calStates', {});
let habCfg = DB.get('habCfg', [
    { id: 'h1', name: 'Sin alcohol', cat: 'Salud', color: '#ff0040', startDate: new Date().toISOString().slice(0, 10) },
    { id: 'h2', name: 'Sin comida basura', cat: 'Salud', color: '#00ff88', startDate: new Date().toISOString().slice(0, 10) },
    { id: 'h3', name: 'Dormí bien', cat: 'Salud', color: '#0088ff', startDate: new Date().toISOString().slice(0, 10) },
    { id: 'h4', name: 'Cumplí rutina', cat: 'Salud', color: '#ffaa00', startDate: new Date().toISOString().slice(0, 10) },
    { id: 'h5', name: 'Sin procrastinar', cat: 'Trabajo', color: '#cc00ff', startDate: new Date().toISOString().slice(0, 10) },
]);
let habLogs = DB.get('habLogs', {});
let foodLogs = DB.get('foodLogs', {});
let foodFavs = DB.get('foodFavs', []);
let weightLogs = DB.get('weightLogs', []);
let incomes = DB.get('incomes', []);
let expenses = DB.get('expenses', []);
let sales = DB.get('sales', []);
let weightHist = DB.get('weightHist', []);
let xpLog = DB.get('xpLog', []);
let totalXP = DB.get('totalXP', 0);
let notes = DB.get('notes', []);
let reminders = DB.get('reminders', []);
let lastBackup = DB.get('lastBackup', 0);
let bibleProgress = DB.get('bibleProgress', {});
let subjects = DB.get('subjects', []);
let grades = DB.get('grades', {});
let schedule = DB.get('schedule', {});
let studyEvents = DB.get('studyEvents', []);
let weeklyShown = DB.get('weeklyShown', 0);

let activeRoutine = 0, calMonth = new Date().getMonth(), calYear = new Date().getFullYear();
let habWeekOffset = 0, nutDate = ds(new Date()), activeMealTab = 'Desayuno';
let editExIdx2 = null, statFilter = 'month', currentSection = 'dashboard', finChartRange = '1m', onbStep = 0;
let selectedReminderDays = [], selectedSubjDays = [], selectedMuscles = [];

// ── HELPERS ────────────────────────────────────────────────────────────
function ds(d) { return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; }
function p2(n) { return String(n).padStart(2, '0'); }
function today() { return ds(new Date()); }
function pd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtD(s) { return pd(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }); }
function uid() { return '_' + Math.random().toString(36).slice(2); }
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MSHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DMIN = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const XP_PER_LEVEL = 200;
function fmtMoney(n) { return Number(n).toLocaleString('es-AR'); }
function fmtUSD(n) { const r = cfg.usdRate || 1000; return (n / r).toFixed(0); }
function moneyLabel() { return cfg.currency || 'ARS'; }
function dualMoney(n) { return `${moneyLabel()} ${fmtMoney(n)} <span style="color:var(--green);font-size:9px">≈ USD ${fmtUSD(n)}</span>`; }

// ── PERSONALIZACIÓN ──────────────────────────────────────────────────
const ACCENT_COLORS = ['#ff0040', '#0088ff', '#00ff88', '#ffaa00', '#cc00ff', '#00ccff', '#ff6600', '#ff69b4'];
function setAccent(color, el) { cfg.accentColor = color; DB.set('cfg', cfg); applyAccent(color); document.querySelectorAll('.accent-swatch').forEach(s => s.classList.toggle('active', s.style.background === color || s.style.backgroundColor === color)); }
function applyAccent(color) {
    const r = document.documentElement;
    r.style.setProperty('--accent', color);
    r.style.setProperty('--red', color);
    // Compute rgba variants
    const hex = color.replace('#', '');
    const rc = parseInt(hex.slice(0, 2), 16), gc = parseInt(hex.slice(2, 4), 16), bc = parseInt(hex.slice(4, 6), 16);
    r.style.setProperty('--accent2', `rgba(${rc},${gc},${bc},0.15)`);
    r.style.setProperty('--accent3', `rgba(${rc},${gc},${bc},0.08)`);
    r.style.setProperty('--red2', `rgba(${rc},${gc},${bc},0.15)`);
    r.style.setProperty('--red3', `rgba(${rc},${gc},${bc},0.08)`);
    r.style.setProperty('--border', `rgba(${rc},${gc},${bc},0.5)`);
    r.style.setProperty('--border2', `rgba(${rc},${gc},${bc},0.25)`);
    r.style.setProperty('--border3', `rgba(${rc},${gc},${bc},0.1)`);
}
function toggleTheme(btn) { cfg.darkMode = !cfg.darkMode; DB.set('cfg', cfg); applyTheme(); btn.textContent = cfg.darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'; }
function applyTheme() { document.body.classList.toggle('light', !cfg.darkMode); }
function setFontSize(v, btn) { cfg.fontSize = v; DB.set('cfg', cfg); document.documentElement.style.setProperty('--font-scale', v); document.querySelectorAll('.font-size-btns .tab').forEach(t => t.classList.remove('active')); btn && btn.classList.add('active'); }
function saveAppName() { const n = document.getElementById('cfg-appname')?.value.trim() || 'ASCENSION'; cfg.appName = n; DB.set('cfg', cfg); document.getElementById('app-logo-title') && (document.getElementById('app-logo-title').textContent = n); document.title = n; showToast('✓ Nombre actualizado'); }
function applyVisualSettings() {
    applyAccent(cfg.accentColor || '#ff0040');
    applyTheme();
    document.documentElement.style.setProperty('--font-scale', cfg.fontSize || 1);
    if (cfg.appName) { document.getElementById('app-logo-title') && (document.getElementById('app-logo-title').textContent = cfg.appName); document.title = cfg.appName; }
    // Mark active swatch
    document.querySelectorAll('.accent-swatch').forEach(s => {
        const sc = s.style.backgroundColor || s.style.background;
        // compare hex
        s.classList.toggle('active', s.getAttribute('onclick')?.includes(cfg.accentColor || '#ff0040'));
    });
    const btn = document.getElementById('toggle-theme');
    if (btn) btn.textContent = cfg.darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
}

// ── VERSÍCULOS BÍBLICOS (30 frases) ───────────────────────────────────
const VERSES = [
    { t: 'Filipenses 4:13', v: '"Todo lo puedo en Cristo que me fortalece."' },
    { t: 'Josué 1:9', v: '"Sé fuerte y valiente. No tengas miedo."' },
    { t: 'Proverbios 13:4', v: '"El alma del diligente quedará bien satisfecha."' },
    { t: 'Romanos 8:28', v: '"Todas las cosas cooperan para bien de los que aman a Dios."' },
    { t: 'Isaías 40:31', v: '"Los que esperan en Jehová obtendrán nuevas fuerzas."' },
    { t: 'Proverbios 16:3', v: '"Encomienda tus obras a Jehová y tus pensamientos se consolidarán."' },
    { t: 'Mateo 7:7', v: '"Pidan y se les dará; busquen y encontrarán."' },
    { t: 'Hebreos 11:1', v: '"La fe es la certeza de lo que se espera, la evidencia de lo que no se ve."' },
    { t: '1 Corintios 9:27', v: '"Disciplino mi cuerpo y lo domino completamente."' },
    { t: 'Proverbios 3:5-6', v: '"Confía en Jehová con todo tu corazón y no te apoyes en tu propio entendimiento."' },
    { t: 'Salmo 37:4', v: '"Deléitate en Jehová y Él te concederá lo que tu corazón desea."' },
    { t: 'Proverbios 12:24', v: '"La mano de los diligentes gobernará."' },
    { t: 'Gálatas 6:9', v: '"No nos cansemos de hacer el bien, porque a su debido tiempo cosecharemos."' },
    { t: '2 Timoteo 1:7', v: '"Dios no nos dio espíritu de cobardía, sino de poder, amor y dominio propio."' },
    { t: 'Mateo 6:33', v: '"Busquen primero el reino de Dios y su justicia, y todo lo demás se les dará."' },
    { t: 'Proverbios 21:5', v: '"Los planes del diligente llevan a la abundancia."' },
    { t: 'Romanos 12:2', v: '"No se amolden al mundo, sino transfórmense por la renovación de su mente."' },
    { t: 'Salmo 1:3', v: '"Es como árbol plantado junto a corrientes de aguas que da su fruto en su tiempo."' },
    { t: '1 Corintios 15:58', v: '"Manténganse firmes, siempre dedicados completamente a la obra del Señor."' },
    { t: 'Proverbios 4:23', v: '"Sobre todo lo que debes guardar, guarda tu corazón, porque de él mana la vida."' },
    { t: 'Santiago 1:4', v: '"Y que la constancia complete plenamente su obra para que sean perfectos e íntegros."' },
    { t: 'Isaías 41:10', v: '"No temas, porque yo estoy contigo. Yo te fortaleceré y te ayudaré."' },
    { t: 'Efesios 6:10', v: '"Fortalézcanse en el Señor y en el poder de su fuerza."' },
    { t: 'Mateo 5:6', v: '"Felices los que tienen hambre y sed de justicia, porque serán saciados."' },
    { t: 'Habacuc 2:2', v: '"Escribe la visión claramente para que el que la lea pueda correr."' },
    { t: 'Proverbios 6:6', v: '"Ve a la hormiga, mira sus caminos y sé sabio."' },
    { t: 'Lucas 16:10', v: '"El que es fiel en lo pequeño también es fiel en lo grande."' },
    { t: 'Salmo 23:1', v: '"Jehová es mi pastor; nada me faltará."' },
    { t: 'Colosenses 3:23', v: '"Hagan lo que hagan, trabajen de corazón como para el Señor."' },
    { t: 'Miqueas 6:8', v: '"Actuar con justicia, amar la bondad y andar humildemente con tu Dios."' },
];

// ── RANKS ──────────────────────────────────────────────────────────────
const RANKS = [
    { min: 1, max: 5, name: 'RECLUTA', color: '#888' },
    { min: 6, max: 10, name: 'SOLDADO', color: '#aaa' },
    { min: 11, max: 20, name: 'GUERRERO', color: '#00ccff' },
    { min: 21, max: 35, name: 'ÉLITE', color: '#0088ff' },
    { min: 36, max: 50, name: 'MAESTRO', color: '#cc00ff' },
    { min: 51, max: 75, name: 'LEYENDA', color: '#ffaa00' },
    { min: 76, max: 99, name: 'ASCENDIDO', color: '#ff0040' },
    { min: 100, max: 9999, name: 'ASCENSION', color: '#ffdd00' },
];
function getRank(lvl) { return RANKS.find(r => lvl >= r.min && lvl <= r.max) || RANKS[0]; }

const XP_RULES = { habit: 5, train: 40, food: 3, weight: 8, income: 3, sale: 15 };
function addXP(amount, label) { totalXP += amount; xpLog.unshift({ ts: Date.now(), label, amount }); if (xpLog.length > 300) xpLog.pop(); DB.set('totalXP', totalXP); DB.set('xpLog', xpLog); updateXPBar(); }
function getLvl() { return Math.floor(totalXP / XP_PER_LEVEL) + 1; }
function getLvlPct() { return ((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100).toFixed(1); }
function updateXPBar() {
    const lvl = getLvl(); const rank = getRank(lvl);
    const lbl = document.getElementById('xp-label'); if (lbl) lbl.textContent = `${totalXP % XP_PER_LEVEL} / ${XP_PER_LEVEL} XP`;
    const lv = document.getElementById('xp-level'); if (lv) lv.textContent = `LVL ${lvl}`;
    const rk = document.getElementById('xp-rank'); if (rk) rk.textContent = rank.name;
    const fill = document.getElementById('xp-fill'); if (fill) fill.style.width = getLvlPct() + '%';
    const dt = document.getElementById('dash-lvl-tag'); if (dt) dt.textContent = `${rank.name} LVL${lvl}`;
}

// ── BADGES ─────────────────────────────────────────────────────────────
const BADGES = [
    { id: 'first_habit', icon: '🎯', name: 'Primer hábito', check: () => Object.values(habLogs).some(l => Object.values(l).includes(1)) },
    { id: 'streak7', icon: '🔥', name: '7 días', check: () => calcHabStreak() >= 7 },
    { id: 'streak30', icon: '💎', name: '30 días', check: () => calcHabStreak() >= 30 },
    { id: 'streak100', icon: '🌟', name: '100 días', check: () => calcHabStreak() >= 100 },
    { id: 'first_train', icon: '💪', name: 'Primer entreno', check: () => Object.values(calStates).includes('done') },
    { id: 'train10', icon: '🏋️', name: '10 entrenos', check: () => Object.values(calStates).filter(v => v === 'done').length >= 10 },
    { id: 'train50', icon: '🏆', name: '50 entrenos', check: () => Object.values(calStates).filter(v => v === 'done').length >= 50 },
    { id: 'first_sale', icon: '💰', name: 'Primera venta', check: () => sales.length > 0 },
    { id: 'sales10', icon: '💵', name: '10 ventas', check: () => sales.length >= 10 },
    { id: 'perfect_week', icon: '✨', name: 'Semana perfecta', check: () => calcPerfectDays(getWeekDates(0)) === 7 },
    { id: 'lvl5', icon: '🚀', name: 'Nivel 5', check: () => getLvl() >= 5 },
    { id: 'lvl10', icon: '🌙', name: 'Nivel 10', check: () => getLvl() >= 10 },
    { id: 'lvl50', icon: '🔱', name: 'Nivel 50', check: () => getLvl() >= 50 },
    { id: 'lvl100', icon: '🏅', name: 'ASCENSION 100', check: () => getLvl() >= 100 },
    { id: 'food_logger', icon: '🍽️', name: 'Nutricionista', check: () => Object.keys(foodLogs).length >= 30 },
    { id: 'bible_start', icon: '📖', name: 'Estudiante bíblico', check: () => Object.values(bibleProgress).some(b => Object.values(b).includes(true)) },
    { id: 'bible_50', icon: '📜', name: '50% Biblia', check: () => calcBibleGlobalPct() >= 50 },
    { id: 'backup_hero', icon: '💾', name: 'Backup Hero', check: () => lastBackup > 0 },
];

// ── ONBOARDING ─────────────────────────────────────────────────────────
function checkOnboarding() { if (!cfg.onboarded) { document.getElementById('onboarding').classList.add('open'); renderOnbProgress(); } }
function renderOnbProgress() { const el = document.getElementById('onb-progress'); el.innerHTML = ''; for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.className = 'onb-dot' + (i <= onbStep ? ' done' : ''); el.appendChild(d); } }
function onbNext() { document.getElementById(`onb-${onbStep}`).classList.remove('active'); onbStep++; document.getElementById(`onb-${onbStep}`).classList.add('active'); renderOnbProgress(); }
function onbPrev() { document.getElementById(`onb-${onbStep}`).classList.remove('active'); onbStep--; document.getElementById(`onb-${onbStep}`).classList.add('active'); renderOnbProgress(); }
function onbFinish() {
    const name = document.getElementById('onb-name').value || 'Usuario'; const age = parseInt(document.getElementById('onb-age').value) || 25; const sex = document.getElementById('onb-sex').value;
    const height = parseInt(document.getElementById('onb-height').value) || 175; const weight = parseFloat(document.getElementById('onb-weight').value) || 80; const goalWeight = parseFloat(document.getElementById('onb-goal-weight').value) || 75;
    const activity = parseFloat(document.getElementById('onb-activity').value) || 1.55; const goal = document.getElementById('onb-goal').value;
    let bmr = sex === 'm' ? 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age) : 447.6 + (9.25 * weight) + (3.1 * height) - (4.33 * age);
    let tdee = Math.round(bmr * activity); let kcal = goal === 'cut' ? tdee - 500 : goal === 'bulk' ? tdee + 300 : tdee;
    let prot = Math.round(weight * 2.2); let fat = Math.round(weight * 0.9); let carb = Math.round((kcal - prot * 4 - fat * 9) / 4);
    cfg = { ...cfg, name, age, sex, height, peso: weight, pesoGoal: goalWeight, activity, goal, kcal, prot, carb: Math.max(carb, 50), fat, fiber: 30, e1: document.getElementById('onb-e1').value || 'Empresa 1', e2: document.getElementById('onb-e2').value || 'Empresa 2', e3: document.getElementById('onb-e3').value || 'Empresa 3', goalMonthly: parseFloat(document.getElementById('onb-goal-money').value) || 5000, onboarded: true };
    DB.set('cfg', cfg); document.getElementById('onboarding').classList.remove('open');
    addXP(50, 'Perfil configurado'); showToast('¡Perfil configurado! +50 XP 🚀'); renderDashboard();
}

// ── BACKUP ─────────────────────────────────────────────────────────────
function checkBackup() {
    const now = Date.now(); const days = Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24));
    const snooze = DB.get('backupSnooze', 0);
    if (lastBackup === 0 || days >= 7) {
        if (now > snooze) {
            document.getElementById('backup-days').textContent = lastBackup === 0 ? 'muchos' : days;
            document.getElementById('last-backup-date').textContent = lastBackup === 0 ? 'nunca' : new Date(lastBackup).toLocaleDateString('es-AR');
            document.getElementById('backup-modal').classList.add('open');
        }
    }
}
function backupAndClose() { exportData(); lastBackup = Date.now(); DB.set('lastBackup', lastBackup); document.getElementById('backup-modal').classList.remove('open'); showToast('✓ Backup exportado — guardalo en Drive!', 'var(--green)'); }
function snoozeBackup() { DB.set('backupSnooze', Date.now() + (2 * 24 * 60 * 60 * 1000)); document.getElementById('backup-modal').classList.remove('open'); }

// ── WEEKLY ANIMATION ───────────────────────────────────────────────────
function checkWeeklyAnimation() {
    const now = new Date(); const week = `${now.getFullYear()}-W${Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86400000))}`;
    if (weeklyShown === week) return;
    const pWeek = getPrevWeekStr();
    const trainCount = Object.entries(calStates).filter(([k, v]) => v === 'done' && isInWeek(k, pWeek)).length;
    const habPct = calcWeekHabPctForWeek(pWeek);
    if (trainCount === 0 && habPct === 0) return;
    weeklyShown = week; DB.set('weeklyShown', weeklyShown);
    const emojis = ['🔥', '⚡', '💪', '🚀', '🏆'];
    const msgs = [`Entrenaste <strong style="color:var(--red)">${trainCount} veces</strong> la semana pasada.`, `Cumpliste tus hábitos el <strong style="color:var(--green)">${habPct}%</strong> de los días.`];
    if (trainCount >= 5) msgs.push(`<strong style="color:var(--amber)">¡5+ sesiones!</strong> Sos una máquina. 🦾`);
    if (habPct === 100) msgs.push(`<strong style="color:var(--green)">Semana perfecta en hábitos.</strong> Imparable. ✨`);
    msgs.push(`Seguí así. Cada semana te hace más fuerte. <strong style="color:var(--text)">No pares.</strong>`);
    document.getElementById('weekly-emoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
    document.getElementById('weekly-title').textContent = 'RESUMEN SEMANA PASADA';
    document.getElementById('weekly-body').innerHTML = msgs.join('<br>');
    setTimeout(() => document.getElementById('weekly-modal').classList.add('open'), 1500);
}
function closeWeeklyModal() { document.getElementById('weekly-modal').classList.remove('open'); }
function getPrevWeekStr() { const d = new Date(); d.setDate(d.getDate() - 7); return `${d.getFullYear()}-W${Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 86400000))}`; }
function isInWeek(dateStr, weekStr) { const d = pd(dateStr); const wn = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 86400000)); return `${d.getFullYear()}-W${wn}` === weekStr; }
function calcWeekHabPctForWeek(weekStr) { let tot = 0, done = 0; Object.entries(habLogs).forEach(([k, log]) => { if (!isInWeek(k, weekStr)) return; habCfg.forEach(h => { const v = log[h.id]; if (v !== undefined) { tot++; if (v === 1) done++; } }); }); return tot ? Math.round(done / tot * 100) : 0; }

// ── NAV ────────────────────────────────────────────────────────────────
function nav(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');
    el.classList.add('active');
    currentSection = id;
    ({ dashboard: renderDashboard, training: renderTraining, calendar: renderCalendar, habits: renderHabits, nutrition: renderNutrition, finance: renderFinance, crm: renderCRM, notes: renderNotes, bible: renderBible, study: renderStudy, stats: renderStats, achievements: renderAchievements, config: loadConfig })[id]?.();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
function renderDashboard() {
    const now = new Date(); const hour = now.getHours();
    const greeting = hour < 12 ? 'BUENOS DÍAS' : hour < 18 ? 'BUENAS TARDES' : 'BUENAS NOCHES';
    document.getElementById('dash-greeting').textContent = cfg.name ? `${greeting}, ${cfg.name.toUpperCase()}` : greeting;
    document.getElementById('dash-date').textContent = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    // Versículo
    const verse = VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];
    document.getElementById('dash-bible-verse').innerHTML = `<span style="color:var(--amber);font-size:9px;font-weight:700;letter-spacing:1px">${verse.t}</span><br>${verse.v}`;
    // Backup alert
    const days = Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24));
    const snooze = DB.get('backupSnooze', 0);
    const showBackup = (lastBackup === 0 || days >= 7) && Date.now() > snooze;
    const alertEl = document.getElementById('dash-backup-alert');
    if (alertEl) { alertEl.style.display = showBackup ? 'block' : 'none'; if (showBackup) { const dd = document.getElementById('dash-backup-days'); if (dd) dd.textContent = lastBackup === 0 ? 'muchos' : days; } }
    const streak = calcHabStreak();
    document.getElementById('dash-streak-tag').textContent = `🔥 ${streak} días`;
    const lvl = getLvl(); const rank = getRank(lvl); document.getElementById('dash-lvl-tag').textContent = `${rank.name} LVL${lvl}`;
    const todayFood = foodLogs[today()] || []; const kcalToday = todayFood.reduce((a, b) => a + b.kcal, 0);
    const lastW = weightLogs.length ? weightLogs[weightLogs.length - 1] : null;
    const nowM = now.getMonth(), nowY = now.getFullYear(); const pre = `${nowY}-${p2(nowM + 1)}-`;
    const monthTrain = Object.entries(calStates).filter(([k, v]) => k.startsWith(pre) && v === 'done').length;
    const monthInc = incomes.filter(i => i.date.startsWith(`${nowY}-${p2(nowM + 1)}`)).reduce((a, b) => a + b.amount, 0);
    const monthExp = expenses.filter(e => e.date.startsWith(`${nowY}-${p2(nowM + 1)}`)).reduce((a, b) => a + b.amount, 0);
    const saldo = monthInc - monthExp;
    document.getElementById('dash-kpis').innerHTML = `
    <div class="stat-card c-amber"><div class="stat-label">Calorías hoy</div><div class="stat-value c-amber">${kcalToday}</div><div class="stat-diff ${kcalToday <= cfg.kcal ? 'up' : 'down'}">${kcalToday <= cfg.kcal ? '↓' : '↑'} ${Math.abs(cfg.kcal - kcalToday)} kcal</div></div>
    <div class="stat-card c-green"><div class="stat-label">Racha hábitos</div><div class="stat-value c-green">${streak}<span style="font-size:16px">d</span></div><div class="stat-diff up">🔥 días seguidos</div></div>
    <div class="stat-card"><div class="stat-label">Peso actual</div><div class="stat-value">${lastW ? lastW.weight : '--'}<span style="font-size:16px">kg</span></div><div class="stat-diff ${lastW && lastW.weight <= cfg.pesoGoal ? 'up' : 'down'}">Obj: ${cfg.pesoGoal}kg</div></div>
    <div class="stat-card ${saldo >= 0 ? 'c-green' : ''}"><div class="stat-label">Saldo mes</div><div class="stat-value ${saldo >= 0 ? 'c-green' : 'c-red'}" style="font-size:26px">$${saldo.toLocaleString()}</div><div class="stat-diff ${saldo >= 0 ? 'up' : 'down'}">${monthTrain} entrenos este mes</div></div>`;
    const last7 = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last7.push({ d, kcal: (foodLogs[ds(d)] || []).reduce((a, b) => a + b.kcal, 0) }); }
    const maxK = Math.max(...last7.map(x => x.kcal), cfg.kcal, 1);
    document.getElementById('dash-cal-bars').innerHTML = last7.map((x, i) => `<div class="sparkbar" style="height:${Math.max(4, Math.round(x.kcal / maxK * 66))}px;background:${i === 6 ? 'var(--red)' : 'rgba(255,0,64,0.3)'}"></div>`).join('');
    document.getElementById('dash-cal-lbls').innerHTML = last7.map(x => `<div class="sparklabel">${DMIN[(x.d.getDay() + 6) % 7]}</div>`).join('');
    const dow = (now.getDay() + 6) % 7; const r = routines[Math.min(dow, routines.length - 1)] || routines[0]; const comp = completedEx[today()] || {}; const done = r ? r.exercises.filter((_, i) => comp[r.id + i]).length : 0;
    document.getElementById('dash-day-name').textContent = r ? r.name : '--';
    document.getElementById('dash-workout-preview').innerHTML = r ? `${r.exercises.slice(0, 4).map((ex, i) => `<div class="ex-item"><div class="ex-chk${comp[r.id + i] ? ' done' : ''}"><i class="ti ti-check"></i></div><div class="ex-name">${ex.n}</div><div class="ex-meta">${ex.sets}×${ex.reps}</div><div class="ex-wt">${ex.weight ? ex.weight + 'kg' : 'BW'}</div></div>`).join('')}<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center"><span class="tag ${done === r.exercises.length && r.exercises.length > 0 ? 'tag-green' : done > 0 ? 'tag-amber' : 'tag-red'}">${done}/${r.exercises.length}</span><button class="btn btn-secondary btn-sm" onclick="nav('training',document.querySelectorAll('.nav-item')[1])">Ver →</button></div>` : '<div class="empty-state"><i class="ti ti-barbell"></i><p>Sin rutinas</p></div>';
    document.getElementById('dash-weekly').innerHTML = [
        { l: 'Calorías hoy', v: kcalToday, m: cfg.kcal, c: 'var(--amber)', s: ' kcal' },
        { l: 'Hábitos semana', v: calcWeekHabPct(), m: 100, c: 'var(--green)', s: '%' },
        { l: 'Entrenos mes', v: monthTrain, m: 25, c: 'var(--red)', s: '' },
        { l: 'Balance mes', v: Math.max(0, saldo), m: Math.max(monthInc, 1), c: 'var(--blue)', s: '' },
    ].map(i => `<div class="bar-row"><div class="bar-label" style="width:120px;flex-shrink:0">${i.l}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Math.round(i.v / i.m * 100))}%;background:${i.c}"></div></div><div class="bar-val">${i.v.toLocaleString()}${i.s}</div></div>`).join('');
    const todayLog = habLogs[today()] || {};
    document.getElementById('dash-habits-today').innerHTML = habCfg.slice(0, 5).map(h => { const v = todayLog[h.id] ?? -1; return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #111"><div class="hab-circle${v === 1 ? ' done' : v === 0 ? ' fail' : ' empty'}" style="${v === 1 ? `background:${h.color};border-color:${h.color}` : `border-color:${h.color}`}" onclick="quickToggleHab('${h.id}','${today()}')">${v === 1 ? '✓' : v === 0 ? '✗' : ''}</div><div style="flex:1;font-size:12px;font-weight:500">${h.name}</div></div>`; }).join('');
    // Recordatorios de hoy
    const todayDow = (new Date().getDay() + 6) % 7;
    const todayRems = reminders.filter(r => r.days.includes(todayDow));
    document.getElementById('dash-reminders-today').innerHTML = todayRems.length ? todayRems.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #111"><span style="font-size:14px">${r.type === 'facultad' ? '🎓' : '🔔'}</span><div style="flex:1"><div style="font-size:11px;font-weight:600;color:${r.type === 'facultad' ? 'var(--blue)' : 'var(--amber)'}">${r.text}</div>${r.time ? `<div style="font-size:9px;color:var(--text2)">${r.time}</div>` : ''}</div></div>`).join('') : '<div style="font-size:11px;color:var(--text2);padding:8px 0">Sin recordatorios para hoy.</div>';
    // Eventos de facultad
    const todayStr = today(); const upcomingEvents = studyEvents.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    const studyEl = document.getElementById('dash-study-today');
    if (upcomingEvents.length) {
        studyEl.innerHTML = `<div class="panel" style="margin-bottom:0"><div class="panel-head">Próximos eventos de facultad 🎓</div>${upcomingEvents.map(e => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #111"><span style="font-family:'Orbitron',monospace;font-size:10px;font-weight:700;color:${e.type === 'exam' ? 'var(--red)' : e.type === 'task' ? 'var(--amber)' : 'var(--blue)'};min-width:50px">${fmtD(e.date)}</span><div style="flex:1;font-size:11px">${e.desc}${e.subject ? ` <span style="color:var(--text2)">· ${e.subject}</span>` : ''}</div><span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;color:#000;background:${e.type === 'exam' ? 'var(--red)' : e.type === 'task' ? 'var(--amber)' : 'var(--blue)'}">${e.type === 'exam' ? 'PARCIAL' : e.type === 'task' ? 'ENTREGA' : 'CLASE'}</span></div>`).join('')}</div>`;
    } else studyEl.innerHTML = '';
}
function quickToggleHab(hid, date) { if (!habLogs[date]) habLogs[date] = {}; const cur = habLogs[date][hid] ?? -1; const next = cur === 1 ? 0 : cur === 0 ? -1 : 1; if (next === -1) delete habLogs[date][hid]; else habLogs[date][hid] = next; DB.set('habLogs', habLogs); if (next === 1) addXP(XP_RULES.habit, 'Hábito cumplido'); renderDashboard(); }

// ── TRAINING ──────────────────────────────────────────────────────────
function renderTraining() {
    document.getElementById('routine-tabs').innerHTML = routines.map((r, i) => `<button class="tab${i === activeRoutine ? ' active' : ''}" onclick="switchRoutine(${i},this)">${r.name.length > 18 ? r.name.slice(0, 18) + '…' : r.name}</button>`).join('');
    const doneTotal = Object.values(calStates).filter(v => v === 'done').length;
    document.getElementById('train-kpis').innerHTML = `<div class="stat-card c-green"><div class="stat-label">Días entrenados</div><div class="stat-value c-green">${doneTotal}</div><div class="stat-diff up">histórico</div></div><div class="stat-card"><div class="stat-label">Volumen total</div><div class="stat-value" style="font-size:22px">${calcTotalVolume().toLocaleString()}</div><div class="stat-diff up">kg × reps</div></div><div class="stat-card c-amber"><div class="stat-label">Rutinas</div><div class="stat-value c-amber">${routines.length}</div><div class="stat-diff up">activas</div></div>`;
    renderRoutineContent(); renderWeightHist(); populateHistSel(); renderVolumeChart();
}
function switchRoutine(i, btn) { activeRoutine = i; document.querySelectorAll('#routine-tabs .tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderRoutineContent(); }
function renderRoutineContent() {
    if (!routines.length) { document.getElementById('train-content').innerHTML = '<div class="empty-state"><i class="ti ti-barbell"></i><p>No hay rutinas. Creá una.</p></div>'; return; }
    const r = routines[activeRoutine]; const tc = completedEx[today()] || {}; const doneCount = r.exercises.filter((_, i) => tc[r.id + i]).length; const pct = r.exercises.length ? Math.round(doneCount / r.exercises.length * 100) : 0;
    const catColor = r.cat === 'Fuerza' ? 'tag-red' : r.cat === 'Hipertrofia' ? 'tag-amber' : 'tag-blue';
    document.getElementById('train-prog-badge').textContent = pct + '% completado';
    const wu = cfg.weightUnit || 'kg';
    document.getElementById('train-content').innerHTML = `<div class="panel"><div class="panel-head">${r.name} <span class="tag ${catColor}">${r.cat}</span><div class="panel-actions"><button class="btn btn-secondary btn-sm" onclick="duplicateRoutine(${activeRoutine})">Duplicar</button>${routines.length > 1 ? `<button class="btn-icon" onclick="deleteRoutine(${activeRoutine})"><i class="ti ti-trash"></i></button>` : ''}</div></div>
  <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr style="color:var(--text2);font-size:9px;letter-spacing:1px">${['', 'Ejercicio', 'Series', 'Reps', 'Tiempo', 'Banda', 'Descanso', wu, ''].map(h => `<th style="padding:4px 6px;text-align:left;font-weight:600">${h}</th>`).join('')}</tr></thead>
    <tbody>${r.exercises.map((ex, i) => `<tr style="border-bottom:1px solid #111;opacity:${tc[r.id + i] ? 0.5 : 1}">
      <td style="padding:4px"><div class="ex-chk${tc[r.id + i] ? ' done' : ''}" onclick="toggleEx(${i},this)" style="width:20px;height:20px;border-radius:4px;border:1px solid #333;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;${tc[r.id + i] ? 'background:var(--accent);border-color:var(--accent)' : ''}"><i class="ti ti-check" style="font-size:11px;opacity:${tc[r.id + i] ? 1 : 0}"></i></div></td>
      <td style="padding:4px 6px;font-weight:600;color:${tc[r.id + i] ? 'var(--text2)' : 'var(--text)'}">${ex.n}${ex.muscles?.length ? `<div style="font-size:8px;color:var(--accent);margin-top:1px">${ex.muscles.join(', ')}</div>` : ''}</td>
      <td style="padding:4px 6px;color:var(--accent);font-weight:700">${ex.sets}</td>
      <td style="padding:4px 6px;color:var(--text3)">${ex.reps}</td>
      <td style="padding:4px 6px;color:var(--text3)">${ex.time ? ex.time + 's' : '—'}</td>
      <td style="padding:4px 6px;color:var(--text3)">${ex.band || '—'}</td>
      <td style="padding:4px 6px;color:var(--text3)">${ex.rest ? ex.rest + 's' : '—'}</td>
      <td style="padding:4px 6px;color:var(--text3)">${ex.weight ? ex.weight + wu : 'BW'}</td>
      <td style="padding:4px"><div style="display:flex;gap:4px"><button class="btn-icon" onclick="editEx(${i})"><i class="ti ti-edit"></i></button><button class="btn-icon" onclick="deleteEx(${i})"><i class="ti ti-trash"></i></button></div></td>
    </tr>`).join('')}
    </tbody></table></div>
  ${!r.exercises.length ? '<div class="empty-state" style="padding:16px"><p>Agregá ejercicios</p></div>' : ''}
  <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" onclick="openModal('modal-exercise')"><i class="ti ti-plus"></i> Ejercicio</button><button class="btn btn-primary" onclick="markRoutineComplete()"><i class="ti ti-check"></i> Marcar día completo</button></div></div>`;
    renderMuscleMap(); renderIsraetelPanel();
}

// ── ISRAETEL MEV/MAV/MRV ──────────────────────────────────────────────
const ISRAETEL = { pecho: { mev: 8, mav: 16, mrv: 22 }, espalda: { mev: 10, mav: 18, mrv: 25 }, hombros: { mev: 6, mav: 14, mrv: 22 }, biceps: { mev: 6, mav: 14, mrv: 20 }, triceps: { mev: 4, mav: 12, mrv: 18 }, cuadriceps: { mev: 8, mav: 16, mrv: 22 }, femoral: { mev: 6, mav: 12, mrv: 20 }, gluteos: { mev: 4, mav: 12, mrv: 20 }, gemelos: { mev: 8, mav: 16, mrv: 22 }, abs: { mev: 8, mav: 16, mrv: 24 }, trapecios: { mev: 4, mav: 10, mrv: 16 }, antebrazos: { mev: 4, mav: 10, mrv: 16 } };
function calcWeekSetsForMuscle(muscle) { let sets = 0; const days = 7; for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - i); const dc = completedEx[ds(d)] || {}; routines.forEach(r => { r.exercises.forEach((ex, ei) => { if (dc[r.id + ei] && (ex.muscles || []).includes(muscle)) sets += ex.sets; }); }); } return sets; }
function renderMuscleMap() {
    const el = document.getElementById('muscle-map-svg'); if (!el) return;
    const todayMuscles = new Set(); const r = routines[activeRoutine]; if (r) { const tc = completedEx[today()] || {}; r.exercises.forEach((ex, i) => { if (tc[r.id + i]) (ex.muscles || []).forEach(m => todayMuscles.add(m)); }); }
    // Weekly volume per muscle
    const weekVol = {}; Object.keys(ISRAETEL).forEach(m => { weekVol[m] = calcWeekSetsForMuscle(m); });
    const musclePathMap = {
        pecho: 'M 30 42 Q 40 38 48 45 Q 40 55 30 58 Z M 62 42 Q 52 38 44 45 Q 52 55 62 58 Z',
        hombros: 'M 20 35 Q 22 28 30 30 Q 28 40 24 42 Z M 72 35 Q 70 28 62 30 Q 64 40 68 42 Z',
        biceps: 'M 18 45 Q 15 55 17 65 Q 22 62 24 52 Z M 74 45 Q 77 55 75 65 Q 70 62 68 52 Z',
        triceps: 'M 22 45 Q 19 55 21 65 Q 26 60 27 50 Z M 70 45 Q 73 55 71 65 Q 66 60 65 50 Z',
        espalda: 'M 32 42 Q 46 38 60 42 Q 62 60 46 65 Q 30 60 32 42 Z',
        trapecios: 'M 34 28 Q 46 24 58 28 Q 56 36 46 38 Q 36 36 34 28 Z',
        abs: 'M 37 66 Q 46 63 55 66 L 56 90 Q 46 93 36 90 Z',
        cuadriceps: 'M 33 95 Q 38 120 36 140 Q 30 140 28 120 Z M 59 95 Q 54 120 56 140 Q 62 140 64 120 Z',
        femoral: 'M 34 95 Q 40 120 38 140 Q 44 140 44 120 Q 44 100 40 95 Z M 58 95 Q 52 120 54 140 Q 48 140 48 120 Q 48 100 52 95 Z',
        gluteos: 'M 33 85 Q 46 82 59 85 Q 60 95 46 98 Q 32 95 33 85 Z',
        gemelos: 'M 32 142 Q 34 162 33 175 Q 28 173 27 155 Z M 60 142 Q 58 162 59 175 Q 64 173 65 155 Z',
        antebrazos: 'M 16 65 Q 14 78 15 88 Q 19 85 20 72 Z M 76 65 Q 78 78 77 88 Q 73 85 72 72 Z'
    };
    const svgParts = Object.entries(musclePathMap).map(([muscle, path]) => {
        let cls = 'muscle-part';
        if (todayMuscles.has(muscle)) cls += ' muscle-active';
        else if (weekVol[muscle] >= ISRAETEL[muscle]?.mav) cls += ' muscle-vol3';
        else if (weekVol[muscle] >= ISRAETEL[muscle]?.mev) cls += ' muscle-vol2';
        else if (weekVol[muscle] > 0) cls += ' muscle-vol1';
        return `<path d="${path}" class="${cls}" title="${muscle}: ${weekVol[muscle]} series/semana"/>`;
    }).join('');
    el.innerHTML = `
    <svg viewBox="0 0 92 180" width="92" height="180" xmlns="http://www.w3.org/2000/svg">
      <!-- Body outline -->
      <ellipse cx="46" cy="15" rx="12" ry="14" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/><!-- Head -->
      <rect x="32" y="28" width="28" height="62" rx="6" fill="#111" stroke="#222" stroke-width="0.5"/><!-- Torso -->
      <rect x="14" y="30" width="16" height="58" rx="5" fill="#111" stroke="#222" stroke-width="0.5"/><!-- Left arm -->
      <rect x="62" y="30" width="16" height="58" rx="5" fill="#111" stroke="#222" stroke-width="0.5"/><!-- Right arm -->
      <rect x="28" y="90" width="16" height="88" rx="6" fill="#111" stroke="#222" stroke-width="0.5"/><!-- Left leg -->
      <rect x="48" y="90" width="16" height="88" rx="6" fill="#111" stroke="#222" stroke-width="0.5"/><!-- Right leg -->
      ${svgParts}
    </svg>`;
}
function renderIsraetelPanel() {
    const el = document.getElementById('israetel-panel'); if (!el) return;
    const allMuscles = Object.keys(ISRAETEL); const active = allMuscles.filter(m => { const sets = calcWeekSetsForMuscle(m); return sets > 0 || routines[activeRoutine]?.exercises.some(ex => (ex.muscles || []).includes(m)); });
    if (!active.length) { el.innerHTML = '<div style="font-size:11px;color:var(--text2);padding:8px 0">Asigná músculos a los ejercicios para ver el análisis Israetel.</div>'; return; }
    el.innerHTML = active.map(m => {
        const sets = calcWeekSetsForMuscle(m); const I = ISRAETEL[m]; const max = I.mrv;
        let badge = '', badgeCls = '', color = 'var(--blue)';
        if (sets === 0) { badge = 'Sin volumen'; badgeCls = 'ibadge-low'; color = 'var(--blue)'; }
        else if (sets < I.mev) { badge = 'Bajo MEV'; badgeCls = 'ibadge-low'; color = 'var(--blue)'; }
        else if (sets <= I.mav) { badge = '✓ Óptimo'; badgeCls = 'ibadge-ok'; color = 'var(--green)'; }
        else if (sets <= I.mrv) { badge = 'Alto'; badgeCls = 'ibadge-high'; color = 'var(--amber)'; }
        else { badge = '⚠ MRV'; badgeCls = 'ibadge-over'; color = 'var(--red)'; }
        const pct = Math.min(100, Math.round(sets / max * 100));
        return `<div class="israetel-row"><div class="israetel-muscle">${m.charAt(0).toUpperCase() + m.slice(1)}</div><div class="israetel-bar"><div class="israetel-fill" style="width:${pct}%;background:${color}"></div></div><div class="israetel-sets">${sets} series</div><div class="israetel-badge ${badgeCls}">${badge}</div><div style="font-size:8px;color:var(--text2);margin-left:6px">MEV:${I.mev} MAV:${I.mav} MRV:${I.mrv}</div></div>`;
    }).join('');
}
function toggleEx(idx, el) { const r = routines[activeRoutine]; const t = today(); if (!completedEx[t]) completedEx[t] = {}; completedEx[t][r.id + idx] = !completedEx[t][r.id + idx]; DB.set('completedEx', completedEx); el.classList.toggle('done'); const ex = r.exercises[idx]; if (completedEx[t][r.id + idx] && ex.weight) { weightHist.push({ date: t, exercise: ex.n, weight: ex.weight }); DB.set('weightHist', weightHist); } if (completedEx[t][r.id + idx]) addXP(2, 'Ejercicio: ' + ex.n); const dC = r.exercises.filter((_, i) => completedEx[t][r.id + i]).length; document.getElementById('train-prog-badge').textContent = Math.round(dC / r.exercises.length * 100) + '% completado'; }
function markRoutineComplete() { const r = routines[activeRoutine]; const t = today(); if (!completedEx[t]) completedEx[t] = {}; r.exercises.forEach((_, i) => completedEx[t][r.id + i] = true); DB.set('completedEx', completedEx); calStates[t] = 'done'; DB.set('calStates', calStates); addXP(XP_RULES.train, 'Entrenamiento completo'); showToast('💪 Entrenamiento completado! +40 XP'); renderRoutineContent(); }
function calcTotalVolume() { let v = 0; Object.values(completedEx).forEach(day => { routines.forEach(r => { r.exercises.forEach((ex, i) => { if (day[r.id + i]) v += ex.sets * ex.reps * (ex.weight || 1); }); }); }); return v; }
function populateHistSel() { const names = [...new Set([...weightHist.map(h => h.exercise), ...routines.flatMap(r => r.exercises.map(e => e.n))])]; document.getElementById('hist-ex-sel').innerHTML = names.map(n => `<option>${n}</option>`).join(''); }
function renderWeightHist() { const name = document.getElementById('hist-ex-sel')?.value; const hist = weightHist.filter(h => h.exercise === name).slice(-10); const el = document.getElementById('weight-hist-bars'); const lb = document.getElementById('weight-hist-lbls'); if (!hist.length) { el.innerHTML = `<div style="color:var(--text2);font-size:10px;padding:16px 0">Sin historial para este ejercicio.</div>`; lb.innerHTML = ''; return; } const maxW = Math.max(...hist.map(h => h.weight)); const minW = Math.min(...hist.map(h => h.weight)) * 0.95; el.innerHTML = hist.map((h, i) => `<div class="sparkbar" style="height:${Math.max(8, Math.round((h.weight - minW) / (maxW - minW || 1) * 84))}px;background:${i === hist.length - 1 ? 'var(--red)' : 'rgba(255,0,64,0.3)'};position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:2px"><span style="font-size:7px;color:var(--text)">${h.weight}</span></div>`).join(''); lb.innerHTML = hist.map(h => `<div class="sparklabel">${fmtD(h.date)}</div>`).join(''); }
function renderVolumeChart() { const el = document.getElementById('volume-chart'); const last7 = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dstr = ds(d); const dc = completedEx[dstr] || {}; let vol = 0; routines.forEach(r => { r.exercises.forEach((ex, ei) => { if (dc[r.id + ei]) vol += ex.sets * ex.reps * (ex.weight || 1); }); }); last7.push({ d, vol }); } const maxV = Math.max(...last7.map(x => x.vol), 1); el.innerHTML = last7.map((x) => `<div class="bar-row"><div class="bar-label" style="width:26px">${DMIN[(x.d.getDay() + 6) % 7]}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(x.vol / maxV * 100)}%;background:var(--red)"></div></div><div class="bar-val">${x.vol.toLocaleString()}</div></div>`).join(''); }
function saveRoutine() { const n = document.getElementById('m-rtn-name').value.trim(); if (!n) return; routines.push({ id: uid(), name: n, cat: document.getElementById('m-rtn-cat').value, notes: document.getElementById('m-rtn-notes').value, exercises: [] }); DB.set('routines', routines); activeRoutine = routines.length - 1; closeModal('modal-routine'); renderTraining(); }
function duplicateRoutine(i) { const r = JSON.parse(JSON.stringify(routines[i])); r.id = uid(); r.name += ' (copia)'; routines.push(r); DB.set('routines', routines); activeRoutine = routines.length - 1; renderTraining(); }
function deleteRoutine(i) { if (!confirm('¿Eliminar rutina?')) return; routines.splice(i, 1); activeRoutine = Math.max(0, activeRoutine - 1); DB.set('routines', routines); renderTraining(); }
function editEx(i) { editExIdx2 = i; const ex = routines[activeRoutine].exercises[i]; document.getElementById('m-ex-name').value = ex.n; document.getElementById('m-ex-sets').value = ex.sets; document.getElementById('m-ex-reps').value = ex.reps; document.getElementById('m-ex-weight').value = ex.weight; document.getElementById('m-ex-rest').value = ex.rest; document.getElementById('m-ex-notes').value = ex.notes; document.getElementById('m-ex-time').value = ex.time || ''; document.getElementById('m-ex-band').value = ex.band || ''; selectedMuscles = (ex.muscles || []).slice(); document.querySelectorAll('#muscle-selector .tab').forEach(b => { const m = b.getAttribute('onclick')?.match(/'(\w+)'/)?.[1]; b.classList.toggle('active', selectedMuscles.includes(m)); }); openModal('modal-exercise'); }
function saveExercise() { const n = document.getElementById('m-ex-name').value.trim(); if (!n) return; const ex = { id: uid(), n, sets: +document.getElementById('m-ex-sets').value || 3, reps: +document.getElementById('m-ex-reps').value || 10, weight: +document.getElementById('m-ex-weight').value || 0, time: +document.getElementById('m-ex-time').value || 0, band: document.getElementById('m-ex-band').value || '', rest: +document.getElementById('m-ex-rest').value || 90, notes: document.getElementById('m-ex-notes').value, muscles: selectedMuscles.slice() }; if (editExIdx2 !== null) routines[activeRoutine].exercises[editExIdx2] = ex; else routines[activeRoutine].exercises.push(ex); DB.set('routines', routines); closeModal('modal-exercise'); editExIdx2 = null; selectedMuscles = []; document.querySelectorAll('#muscle-selector .tab').forEach(b => b.classList.remove('active')); renderRoutineContent(); renderMuscleMap(); renderIsraetelPanel(); populateHistSel(); }
function toggleMuscleSel(m, btn) { if (selectedMuscles.includes(m)) selectedMuscles = selectedMuscles.filter(x => x !== m); else selectedMuscles.push(m); btn.classList.toggle('active', selectedMuscles.includes(m)); }
function deleteEx(i) { if (!confirm('¿Eliminar?')) return; routines[activeRoutine].exercises.splice(i, 1); DB.set('routines', routines); renderRoutineContent(); }

// ── CALENDAR ──────────────────────────────────────────────────────────
function renderCalendar() {
    document.getElementById('cal-month-lbl').textContent = `${MONTHS[calMonth]} ${calYear}`;
    const pre = `${calYear}-${p2(calMonth + 1)}-`; const vals = Object.entries(calStates).filter(([k]) => k.startsWith(pre));
    const done = vals.filter(([, v]) => v === 'done').length; const total = vals.filter(([, v]) => v !== '').length; const streak = calcCalStreak();
    document.getElementById('cal-stats-row').innerHTML = `<div class="stat-card c-green"><div class="stat-label">Entrenamientos</div><div class="stat-value c-green">${done}</div><div class="stat-diff up">este mes</div></div><div class="stat-card c-amber"><div class="stat-label">Cumplimiento</div><div class="stat-value c-amber">${total ? Math.round(done / total * 100) : 0}%</div></div><div class="stat-card"><div class="stat-label">Racha</div><div class="stat-value">${streak}<span style="font-size:14px">d</span></div></div>`;
    const now = new Date(); const first = new Date(calYear, calMonth, 1); const offset = (first.getDay() + 6) % 7; const days = new Date(calYear, calMonth + 1, 0).getDate();
    let html = DMIN.map(d => `<div class="cal-mini-hdr">${d}</div>`).join('');
    for (let i = 0; i < offset; i++)html += `<div class="cal-mini-cell c-empty"></div>`;
    for (let d = 1; d <= days; d++) { const key = `${calYear}-${p2(calMonth + 1)}-${p2(d)}`; const st = calStates[key] || ''; const isToday = now.getDate() === d && now.getMonth() === calMonth && now.getFullYear() === calYear; const restTitle = st === 'rest' ? 'Día de descanso' : ''; html += `<div class="cal-mini-cell${st ? ' c-' + st : ''}${isToday ? ' c-today' : ''}" onclick="cycleCalDay('${key}')" title="${restTitle}">${d}</div>`; }
    document.getElementById('cal-view').innerHTML = `<div class="cal-mini-grid">${html}</div>`;
    const entries = Object.entries(calStates).sort(([a], [b]) => b.localeCompare(a)).slice(0, 15);
    document.getElementById('cal-agenda').innerHTML = entries.length ? entries.map(([k, v]) => `<div class="tx-row"><div class="tx-icon" style="color:${v === 'done' ? 'var(--green)' : v === 'rest' ? 'var(--blue)' : v === 'missed' ? 'var(--red)' : 'var(--amber)'};border-color:${v === 'done' ? 'rgba(0,255,136,0.4)' : v === 'rest' ? 'rgba(0,136,255,0.4)' : v === 'missed' ? 'rgba(255,0,64,0.4)' : 'rgba(255,170,0,0.4)'};">${v === 'done' ? '✓' : v === 'rest' ? '↓' : v === 'missed' ? '✗' : '~'}</div><div class="tx-info"><div class="tx-desc">${fmtD(k)}</div><div class="tx-meta">${v === 'done' ? 'Entrenado' : v === 'rest' ? 'Descanso programado' : v === 'missed' ? 'Fallido' : 'Parcial'}</div></div></div>`).join('') : '<div class="empty-state"><i class="ti ti-calendar"></i><p>Sin registros aún</p></div>';
}
// CICLO con descanso: vacío→done→partial→missed→rest→vacío
// El día "rest" NO cuenta como fallido
function cycleCalDay(key) { const states = ['', 'done', 'partial', 'missed', 'rest']; calStates[key] = states[(states.indexOf(calStates[key] || '') + 1) % 5]; DB.set('calStates', calStates); if (calStates[key] === 'done') addXP(XP_RULES.train, 'Día entrenado'); renderCalendar(); }
function changeCalMonth(d) { calMonth += d; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calcCalStreak() { let s = 0, d = new Date(); while (calStates[ds(d)] === 'done' || calStates[ds(d)] === 'rest') { if (calStates[ds(d)] === 'done') s++; d.setDate(d.getDate() - 1); } return s; }

// ── HABITS ────────────────────────────────────────────────────────────
function getWeekDates(offset = 0) { const d = new Date(); const dow = (d.getDay() + 6) % 7; const mon = new Date(d); mon.setDate(d.getDate() - dow + offset * 7); return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; }); }
function renderHabits() {
    const dates = getWeekDates(habWeekOffset); document.getElementById('hab-week-lbl').textContent = `${fmtD(ds(dates[0]))} – ${fmtD(ds(dates[6]))}`;
    const streak = calcHabStreak(); const pct = calcWeekHabPct(); const best = calcBestHabStreak(); const perfect = calcPerfectDays(dates);
    document.getElementById('hab-kpis').innerHTML = `<div class="stat-card c-green"><div class="stat-label">Racha actual</div><div class="stat-value c-green">${streak}<span style="font-size:14px">d</span></div><div class="stat-diff up">🔥</div></div><div class="stat-card c-amber"><div class="stat-label">Mejor racha</div><div class="stat-value c-amber">${best}<span style="font-size:14px">d</span></div></div><div class="stat-card"><div class="stat-label">Semana</div><div class="stat-value">${pct}%</div></div><div class="stat-card c-blue"><div class="stat-label">Días perfectos</div><div class="stat-value c-blue">${perfect}</div></div>`;
    const thead = `<tr><th style="text-align:left;padding-bottom:8px;min-width:140px">Hábito</th>${dates.map((d, i) => { const isT = ds(d) === today(); return `<th style="${isT ? 'color:var(--red)' : ''};font-size:9px">${DAYS_FULL[i].slice(0, 3).toUpperCase()}<br><span style="font-size:8px;color:var(--text2)">${d.getDate()}</span></th>`; }).join('')}<th style="font-size:9px;color:var(--text2)">30d</th><th></th></tr>`;
    const tbody = habCfg.map(h => {
        const pct30 = calcHabPct30(h.id); const cells = dates.map(d => {
            const dstr = ds(d);
            // Si la fecha es anterior al startDate del hábito, mostrar celda inactiva
            if (h.startDate && dstr < h.startDate) return `<td><div class="hab-circle inactive" title="Hábito no iniciado aún"></div></td>`;
            const v = (habLogs[dstr] || {})[h.id] ?? -1; const style = v === 1 ? `background:${h.color};border-color:${h.color}` : v === 0 ? `border-color:${h.color};opacity:0.3` : `border-color:#222`;
            return `<td><div class="hab-circle${v === 1 ? ' done' : v === 0 ? ' fail' : ' empty'}" style="${style}" onclick="toggleHabDay2('${h.id}','${dstr}','${v}')">${v === 1 ? '✓' : v === 0 ? '✗' : ''}</div></td>`;
        }).join('');
        return `<tr><td class="hab-name-cell"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${h.color};margin-right:7px"></span>${h.emoji ? `<span style="margin-right:5px">${h.emoji}</span>` : ''}${h.name}${h.startDate ? `<div style="font-size:8px;color:var(--text2)">desde ${fmtD(h.startDate)}</div>` : ''}</td>${cells}<td style="text-align:center;font-family:Orbitron;font-size:11px;font-weight:700;color:${h.color}">${pct30}%</td><td><button class="btn-icon btn-sm" onclick="deleteHab('${h.id}')"><i class="ti ti-trash"></i></button></td></tr>`;
    }).join('');
    document.getElementById('hab-table').innerHTML = `<thead>${thead}</thead><tbody>${tbody || '<tr><td colspan="10"><div class="empty-state" style="padding:16px"><i class="ti ti-checks"></i><p>Creá tu primer hábito</p></div></td></tr>'}</tbody>`;
    document.getElementById('hab-bars').innerHTML = habCfg.map(h => { const p = calcHabPct30(h.id); return `<div class="bar-row"><div class="bar-label" style="width:110px;flex-shrink:0">${h.name}</div><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${h.color}"></div></div><div class="bar-val">${p}%</div></div>`; }).join('') || '<div class="empty-state" style="padding:14px">Sin hábitos</div>';
    renderHeatmap(); renderHabMonthly();
}
function renderHabMonthly() {
    // Últimos 12 meses — barra por mes con % cumplimiento total
    const now = new Date(); const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const prefix = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; let tot = 0, done = 0;
        Object.entries(habLogs).filter(([k]) => k.startsWith(prefix)).forEach(([, log]) => { habCfg.forEach(h => { const v = log[h.id]; if (v !== undefined) { tot++; if (v === 1) done++; } }); });
        months.push({ label: MSHORT[d.getMonth()], pct: tot ? Math.round(done / tot * 100) : 0, tot });
    }
    const maxPct = Math.max(...months.map(m => m.pct), 1);
    const bars = months.map(m => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:8px;color:${m.pct >= 80 ? 'var(--green)' : m.pct >= 50 ? 'var(--amber)' : 'var(--red)'};font-weight:700">${m.pct > 0 ? m.pct + '%' : ''}</div><div style="width:100%;border-radius:3px 3px 0 0;background:${m.pct >= 80 ? 'var(--green)' : m.pct >= 50 ? 'var(--amber)' : 'var(--red)'};opacity:0.85;min-height:3px;height:${Math.max(3, Math.round(m.pct / maxPct * 60))}px"></div></div>`).join('');
    const lbls = months.map(m => `<div style="flex:1;font-size:8px;color:var(--text2);text-align:center">${m.label}</div>`).join('');
    document.getElementById('hab-monthly-chart').innerHTML = `<div style="display:flex;align-items:flex-end;gap:3px;height:70px;margin-bottom:4px">${bars}</div><div style="display:flex;gap:3px">${lbls}</div>`;
}
function toggleHabDay2(hid, date, curVal) { const cur = parseInt(curVal); const next = cur === 1 ? 0 : cur === 0 ? -1 : 1; if (!habLogs[date]) habLogs[date] = {}; if (next === -1) delete habLogs[date][hid]; else habLogs[date][hid] = next; DB.set('habLogs', habLogs); if (next === 1) addXP(XP_RULES.habit, 'Hábito cumplido'); renderHabits(); }
function changeHabWeek(d) { habWeekOffset += d; renderHabits(); }
function saveHabit() { const n = document.getElementById('m-hab-name').value.trim(); if (!n) return; const startDate = document.getElementById('m-hab-start').value || today(); const emoji = document.getElementById('m-hab-emoji').value || ''; habCfg.push({ id: 'h' + uid(), name: n, cat: document.getElementById('m-hab-cat').value, color: document.getElementById('m-hab-color').value, emoji, startDate }); DB.set('habCfg', habCfg); closeModal('modal-habit'); renderHabits(); }
function deleteHab(id) { if (!confirm('¿Eliminar hábito?')) return; habCfg = habCfg.filter(h => h.id !== id); DB.set('habCfg', habCfg); renderHabits(); }
function calcHabStreak() { let s = 0, d = new Date(); while (true) { const dstr = ds(d); const log = habLogs[dstr] || {}; const active = habCfg.filter(h => !h.startDate || dstr >= h.startDate); const ok = active.length > 0 && active.every(h => (log[h.id] || 0) === 1); if (ok) { s++; d.setDate(d.getDate() - 1); } else break; } return s; }
function calcBestHabStreak() { let best = 0, cur = 0, d = new Date(); for (let i = 0; i < 365; i++) { const dstr = ds(d); const log = habLogs[dstr] || {}; const active = habCfg.filter(h => !h.startDate || dstr >= h.startDate); const ok = active.length > 0 && active.every(h => (log[h.id] || 0) === 1); if (ok) { cur++; best = Math.max(best, cur); } else cur = 0; d.setDate(d.getDate() - 1); } return best; }
function calcWeekHabPct() { const dates = getWeekDates(habWeekOffset); let tot = 0, done = 0; dates.forEach(d => { const dstr = ds(d); const log = habLogs[dstr] || {}; habCfg.filter(h => !h.startDate || dstr >= h.startDate).forEach(h => { const v = log[h.id] ?? -1; if (v !== -1) { tot++; if (v === 1) done++; } }); }); return tot ? Math.round(done / tot * 100) : 0; }
function calcPerfectDays(dates) { return dates.filter(d => { const dstr = ds(d); const log = habLogs[dstr] || {}; const active = habCfg.filter(h => !h.startDate || dstr >= h.startDate); return active.length > 0 && active.every(h => (log[h.id] || 0) === 1); }).length; }
function calcHabPct30(hid) { const results = []; const d = new Date(); const h = habCfg.find(x => x.id === hid); for (let i = 0; i < 30; i++) { const dstr = ds(d); if (h && h.startDate && dstr < h.startDate) { d.setDate(d.getDate() - 1); continue; } const v = (habLogs[dstr] || {})[hid]; if (v !== undefined) results.push(v); d.setDate(d.getDate() - 1); } return results.length ? Math.round(results.filter(v => v === 1).length / results.length * 100) : 0; }
function calcGlobalHabPct() { let tot = 0, done = 0; Object.entries(habLogs).forEach(([date, log]) => { habCfg.filter(h => !h.startDate || date >= h.startDate).forEach(h => { const v = log[h.id]; if (v !== undefined) { tot++; if (v === 1) done++; } }); }); return tot ? Math.round(done / tot * 100) : 0; }
function renderHeatmap() { const el = document.getElementById('hab-heatmap'); if (!el) return; const cells = []; for (let i = 179; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dstr = ds(d); const log = habLogs[dstr] || {}; const active = habCfg.filter(h => !h.startDate || dstr >= h.startDate); const done = active.filter(h => (log[h.id] || 0) === 1).length; const pct = active.length ? done / active.length : 0; const lvl = pct === 0 ? '' : pct < 0.34 ? 'l1' : pct < 0.67 ? 'l2' : pct < 1 ? 'l3' : 'l4'; cells.push(`<div class="hmap-cell ${lvl}" title="${fmtD(dstr)}: ${Math.round(pct * 100)}%"></div>`); } el.innerHTML = cells.join(''); }

// ── NUTRITION ─────────────────────────────────────────────────────────
const FOOD = { huevo: { kcal: 78, p: 6.3, c: 0.6, g: 5.3, f: 0 }, tostada: { kcal: 80, p: 3, c: 15, g: 1, f: 1.5 }, pan: { kcal: 265, p: 9, c: 49, g: 3.2, f: 2.7 }, pechuga: { kcal: 165, p: 31, c: 0, g: 3.6, f: 0 }, pollo: { kcal: 165, p: 31, c: 0, g: 3.6, f: 0 }, arroz: { kcal: 130, p: 2.7, c: 28, g: 0.3, f: 0.4 }, pasta: { kcal: 131, p: 5, c: 25, g: 1.1, f: 1.8 }, fideos: { kcal: 131, p: 5, c: 25, g: 1.1, f: 1.8 }, carne: { kcal: 250, p: 26, c: 0, g: 15, f: 0 }, milanesa: { kcal: 280, p: 22, c: 12, g: 16, f: 0.5 }, bife: { kcal: 250, p: 26, c: 0, g: 15, f: 0 }, leche: { kcal: 61, p: 3.2, c: 4.8, g: 3.3, f: 0 }, yogur: { kcal: 100, p: 9, c: 12, g: 2, f: 0 }, queso: { kcal: 400, p: 25, c: 1.3, g: 33, f: 0 }, manzana: { kcal: 52, p: 0.3, c: 14, g: 0.2, f: 2.4 }, banana: { kcal: 89, p: 1.1, c: 23, g: 0.3, f: 2.6 }, naranja: { kcal: 47, p: 0.9, c: 12, g: 0.1, f: 2.4 }, atun: { kcal: 132, p: 28, c: 0, g: 1, f: 0 }, salmon: { kcal: 208, p: 20, c: 0, g: 13, f: 0 }, brocoli: { kcal: 34, p: 2.8, c: 6.6, g: 0.4, f: 2.6 }, ensalada: { kcal: 20, p: 1.4, c: 3.7, g: 0.2, f: 2 }, papa: { kcal: 77, p: 2, c: 17, g: 0.1, f: 2.2 }, batata: { kcal: 86, p: 1.6, c: 20, g: 0.1, f: 3 }, avena: { kcal: 389, p: 17, c: 66, g: 7, f: 10.6 }, almendra: { kcal: 579, p: 21, c: 22, g: 50, f: 12.5 }, nuez: { kcal: 654, p: 15, c: 14, g: 65, f: 6.7 }, mani: { kcal: 567, p: 26, c: 16, g: 49, f: 8.5 }, aceite: { kcal: 884, p: 0, c: 0, g: 100, f: 0 }, proteina: { kcal: 400, p: 80, c: 8, g: 4, f: 0 }, whey: { kcal: 400, p: 80, c: 8, g: 4, f: 0 }, cafe: { kcal: 5, p: 0.3, c: 0.7, g: 0, f: 0 }, chocolate: { kcal: 546, p: 5, c: 60, g: 31, f: 7 }, pizza: { kcal: 266, p: 11, c: 33, g: 10, f: 2.3 }, manteca: { kcal: 717, p: 0.9, c: 0.1, g: 81, f: 0 }, jamon: { kcal: 145, p: 18, c: 1, g: 7, f: 0 }, tomate: { kcal: 18, p: 0.9, c: 3.9, g: 0.2, f: 1.2 }, zanahoria: { kcal: 41, p: 0.9, c: 10, g: 0.2, f: 2.8 }, lechuga: { kcal: 15, p: 1.4, c: 2.9, g: 0.2, f: 1.8 }, pepino: { kcal: 16, p: 0.7, c: 3.6, g: 0.1, f: 0.5 } };
const AI_RECOMMENDATIONS = [{ title: '💧 Hidratación', msg: 'Tomá al menos 2.5L de agua hoy. Si entrenaste, sumá 500ml extra.' }, { title: '🥚 Proteína temprana', msg: 'Desayunar con proteína (huevos, queso, yogur) reduce el hambre y preserva músculo.' }, { title: '🌾 Carbos post-entreno', msg: 'Los mejores momentos para carbos son pre-entreno y dentro de las 2h post-entrenamiento.' }, { title: '🥗 Fibra & saciedad', msg: 'Comé verduras antes de la proteína y carbos. Te vas a saciar antes.' }, { title: '⏰ Timing de comidas', msg: 'Intentá comer cada 3-4hs. Omitir comidas no acelera la pérdida de grasa y puede costarte músculo.' }, { title: '🍳 Preparación semanal', msg: 'Cocinás arroz, pollo y verduras el domingo → comidas listas toda la semana.' }, { title: '📊 Déficit sostenible', msg: 'Un déficit de 300-500 kcal/día es lo ideal. Más de eso te quita energía y músculo.' },];
function setMealTab(tab, btn) { activeMealTab = tab; document.querySelectorAll('#meal-tabs .tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderFoodLog(); }
function renderNutrition() {
    const isToday = nutDate === today(); document.getElementById('nut-date-lbl').textContent = isToday ? 'HOY' : fmtD(nutDate).toUpperCase();
    const logs = foodLogs[nutDate] || []; const tot = { kcal: 0, p: 0, c: 0, g: 0, f: 0 }; logs.forEach(l => { tot.kcal += l.kcal; tot.p += l.p; tot.c += l.c; tot.g += l.g; tot.f += l.f; });
    const deficit = cfg.kcal - tot.kcal;
    document.getElementById('nut-macro-cards').innerHTML = `<div class="stat-card c-red"><div class="stat-label">Calorías consumidas</div><div class="stat-value c-red">${tot.kcal}</div><div class="stat-diff ${deficit >= 0 ? 'up' : 'down'}">${deficit >= 0 ? '↓ Déficit' : '↑ Excedido'} ${Math.abs(deficit)} kcal</div></div><div class="stat-card c-blue"><div class="stat-label">Proteína</div><div class="stat-value c-blue">${tot.p}<span style="font-size:16px">g</span></div><div class="stat-diff up">de ${cfg.prot}g</div></div><div class="stat-card c-amber"><div class="stat-label">Carbohidratos</div><div class="stat-value c-amber">${tot.c}<span style="font-size:16px">g</span></div><div class="stat-diff up">de ${cfg.carb}g</div></div><div class="stat-card c-green"><div class="stat-label">Objetivo diario</div><div class="stat-value c-green">${cfg.kcal}</div><div class="stat-diff up">${cfg.goal === 'cut' ? 'Déficit' : cfg.goal === 'bulk' ? 'Superávit' : 'Mantenimiento'}</div></div>`;
    const pct = Math.min(1, tot.kcal / cfg.kcal); document.getElementById('kcal-ring').setAttribute('stroke-dashoffset', Math.round(289 * (1 - pct))); document.getElementById('kcal-ring-val').textContent = tot.kcal;
    document.getElementById('prot-info').textContent = `${tot.p}/${cfg.prot}g`; document.getElementById('prot-bar').style.width = Math.min(100, Math.round(tot.p / cfg.prot * 100)) + '%';
    document.getElementById('carb-info').textContent = `${tot.c}/${cfg.carb}g`; document.getElementById('carb-bar').style.width = Math.min(100, Math.round(tot.c / cfg.carb * 100)) + '%';
    document.getElementById('fat-info').textContent = `${tot.g}/${cfg.fat}g`; document.getElementById('fat-bar').style.width = Math.min(100, Math.round(tot.g / cfg.fat * 100)) + '%';
    document.getElementById('fiber-info').textContent = `${tot.f}/${cfg.fiber || 30}g`; document.getElementById('fiber-bar').style.width = Math.min(100, Math.round(tot.f / (cfg.fiber || 30) * 100)) + '%';
    const lastW = weightLogs.length ? weightLogs[weightLogs.length - 1] : null; const firstW = weightLogs.length ? weightLogs[0] : null;
    document.getElementById('nut-weight-display').textContent = lastW ? lastW.weight + '' : '--';
    if (lastW && firstW) { const diff = (lastW.weight - firstW.weight).toFixed(1); document.getElementById('nut-weight-diff').textContent = `kg · ${diff > 0 ? '+' : ''}${diff} desde inicio`; }
    document.getElementById('nut-goal-display').textContent = cfg.pesoGoal + 'kg';
    if (lastW) { const rem = (lastW.weight - cfg.pesoGoal).toFixed(1); document.getElementById('nut-remaining').textContent = rem > 0 ? `Faltan ${rem}kg` : '¡Meta!'; }
    if (firstW && lastW) { const total = Math.abs(firstW.weight - cfg.pesoGoal); const done = Math.abs(firstW.weight - lastW.weight); const p = Math.min(100, Math.round(done / total * 100)); document.getElementById('nut-start-w').textContent = `Inicio: ${firstW.weight}kg`; document.getElementById('nut-prog-pct').textContent = p + '%'; document.getElementById('nut-weight-bar').style.width = p + '%'; }
    document.getElementById('weight-log-list').innerHTML = weightLogs.slice(-4).reverse().map(w => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #0d0d0d;font-size:11px"><span style="font-weight:600">${w.weight} kg</span><span style="color:var(--text2)">${fmtD(w.date)}</span></div>`).join('') || '<div style="font-size:10px;color:var(--text2);padding:6px 0">Sin registros aún.</div>';
    renderFoodLog(); renderNutCalendar(); renderNutProjection(); renderAIRec();
    // Favoritos rápidos
    const favWrap = document.getElementById('food-favs-quick');
    if (favWrap) { favWrap.innerHTML = foodFavs.map(f => `<button class="food-fav-btn" onclick="logFoodFav('${f.id}')" title="${f.kcal} kcal · P:${f.p}g C:${f.c}g G:${f.g}g">${f.name}</button>`).join('') + `<button class="food-fav-btn" style="border-color:var(--accent);color:var(--accent)" onclick="openModal('modal-food-fav')">＋ Fav</button>`; }
}
function saveFoodFav() { const n = document.getElementById('m-fav-name').value.trim(); if (!n) return; foodFavs.push({ id: uid(), name: n, kcal: +document.getElementById('m-fav-kcal').value || 0, p: +document.getElementById('m-fav-p').value || 0, c: +document.getElementById('m-fav-c').value || 0, g: +document.getElementById('m-fav-g').value || 0, f: +document.getElementById('m-fav-f').value || 0 }); DB.set('foodFavs', foodFavs); closeModal('modal-food-fav');['m-fav-name', 'm-fav-kcal', 'm-fav-p', 'm-fav-c', 'm-fav-g', 'm-fav-f'].forEach(id => document.getElementById(id).value = ''); renderNutrition(); }
function logFoodFav(id) { const f = foodFavs.find(x => x.id === id); if (!f) return; if (!foodLogs[nutDate]) foodLogs[nutDate] = []; foodLogs[nutDate].push({ name: f.name, meal: activeMealTab, kcal: f.kcal, p: f.p, c: f.c, g: f.g, f: f.f, ts: Date.now() }); DB.set('foodLogs', foodLogs); addXP(XP_RULES.food, 'Fav registrado'); showToast(`✓ ${f.name} registrado`); renderNutrition(); }
function renderFoodLog() { const logs = (foodLogs[nutDate] || []).filter(l => l.meal === activeMealTab); document.getElementById('food-log-list').innerHTML = logs.length ? logs.map(f => `<div class="food-item"><div class="food-name">${f.name}</div><div class="food-kcal">${f.kcal} kcal</div><div class="food-macros">P:${f.p}g C:${f.c}g G:${f.g}g</div><div class="food-del" onclick="deleteFoodItem('${nutDate}',${(foodLogs[nutDate] || []).indexOf(f)})">×</div></div>`).join('') : `<div class="empty-state" style="padding:16px"><i class="ti ti-soup"></i><p>Sin registros en ${activeMealTab}</p></div>`; }
function deleteFoodItem(date, idx) { foodLogs[date].splice(idx, 1); if (!foodLogs[date].length) delete foodLogs[date]; DB.set('foodLogs', foodLogs); renderNutrition(); }
function changeNutDay(d) { const x = pd(nutDate); x.setDate(x.getDate() + d); nutDate = ds(x); renderNutrition(); }
function logWeight() { const val = parseFloat(document.getElementById('weight-inp').value); if (isNaN(val) || val < 20 || val > 400) return; const t = today(); const ex = weightLogs.findIndex(w => w.date === t); if (ex >= 0) weightLogs[ex].weight = val; else weightLogs.push({ date: t, weight: val }); DB.set('weightLogs', weightLogs); addXP(XP_RULES.weight, 'Peso registrado'); showToast('⚖️ Peso registrado +8 XP'); document.getElementById('weight-inp').value = ''; renderNutrition(); }
function renderNutCalendar() { const now = new Date(); const m = now.getMonth(); const y = now.getFullYear(); document.getElementById('nut-cal-headers').innerHTML = DMIN.map(d => `<div style="font-size:8px;color:var(--text2);text-align:center;font-weight:700">${d}</div>`).join(''); const first = new Date(y, m, 1); const offset = (first.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate(); let html = ''; for (let i = 0; i < offset; i++)html += `<div></div>`; for (let d = 1; d <= days; d++) { const key = `${y}-${p2(m + 1)}-${p2(d)}`; const fl = foodLogs[key] || []; const kcalDay = fl.reduce((a, b) => a + b.kcal, 0); const isToday = now.getDate() === d; let cls = ''; if (fl.length > 0) { cls = kcalDay >= cfg.kcal * 0.85 && kcalDay <= cfg.kcal * 1.1 ? 'c-green' : kcalDay > cfg.kcal * 1.1 ? 'c-red' : 'c-amber'; } html += `<div class="nut-cal-cell${cls ? ' ' + cls : ''}${isToday ? ' c-today' : ''}" title="${kcalDay} kcal">${d}${fl.length ? `<span style="font-size:7px;display:block">${kcalDay}</span>` : ''}</div>`; } document.getElementById('nut-cal-grid').innerHTML = html; }
function renderNutProjection() { const el = document.getElementById('nut-projection-card'); if (weightLogs.length < 2) { el.innerHTML = '<div style="font-size:11px;color:var(--text2)">Registrá tu peso 2+ veces para ver la proyección.</div>'; return; } const rate = (weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight) / weightLogs.length; const remaining = weightLogs[weightLogs.length - 1].weight - cfg.pesoGoal; if (remaining <= 0) { el.innerHTML = `<div style="color:var(--green);font-size:13px;font-weight:700">🎉 ¡Objetivo alcanzado! Seguí así.</div>`; } else if (rate < 0) { const days = Math.ceil(remaining / Math.abs(rate)); const goal = new Date(); goal.setDate(goal.getDate() + days); el.innerHTML = `<div style="font-size:12px;color:var(--text2)">A este ritmo llegás a <strong style="color:var(--green)">${cfg.pesoGoal}kg</strong> el <strong style="color:var(--text)">${fmtD(ds(goal))}</strong></div><div style="font-size:10px;color:var(--text2);margin-top:4px">~${(Math.abs(rate) * 30).toFixed(1)}kg/mes</div>`; } else { el.innerHTML = `<div style="font-size:12px;color:var(--amber)">⚠️ Tendencia al alza. Revisá tu plan.</div>`; } }
function renderAIRec() { const rec = AI_RECOMMENDATIONS[Math.floor(Date.now() / 86400000) % AI_RECOMMENDATIONS.length]; document.getElementById('ai-recommendations').innerHTML = `<div style="background:#0a0a0a;border:1px solid rgba(255,0,64,0.2);border-radius:6px;padding:10px;margin-bottom:10px"><div style="font-size:9px;color:var(--red);font-weight:700;letter-spacing:1px;margin-bottom:4px">${rec.title}</div><div style="font-size:11px;color:var(--text2);line-height:1.5">${rec.msg}</div></div>`; }
function sendChat() {
    const inp = document.getElementById('chat-inp'); const box = document.getElementById('chat-box'); const msg = inp.value.trim(); if (!msg) return;
    const um = document.createElement('div'); um.className = 'msg-user'; um.textContent = msg; box.appendChild(um); inp.value = '';
    setTimeout(() => {
        let found = [], totK = 0, totP = 0, totC = 0, totG = 0, totF = 0;
        const norm = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const [food, m2] of Object.entries(FOOD)) { if (norm.includes(food)) { const re = new RegExp(`(\\d+)\\s*(?:g|gr|gramos)?\\s*(?:de\\s+)?${food}`, 'i'); const match = norm.match(re); let qty = 1; if (match) { qty = +match[1]; if (/\d+\s*g/.test(match[0])) qty = qty / 100; } found.push(food); totK += Math.round(m2.kcal * qty); totP += Math.round(m2.p * qty); totC += Math.round(m2.c * qty); totG += Math.round(m2.g * qty); totF += Math.round(m2.f * qty); } }
        const am = document.createElement('div'); am.className = 'msg-ai';
        if (found.length) { if (!foodLogs[nutDate]) foodLogs[nutDate] = []; foodLogs[nutDate].push({ name: msg.slice(0, 60), meal: activeMealTab, kcal: totK, p: totP, c: totC, g: totG, f: totF, ts: Date.now() }); DB.set('foodLogs', foodLogs); addXP(XP_RULES.food, 'Comida registrada'); const remaining = cfg.kcal - (foodLogs[nutDate] || []).reduce((a, b) => a + b.kcal, 0); const protRem = cfg.prot - (foodLogs[nutDate] || []).reduce((a, b) => a + b.p, 0); am.innerHTML = `<div class="ai-tag">⬡ ASCENSION AI</div>✓ <strong style="color:var(--red)">${found.join(', ')}</strong><br>🔥 <strong>${totK} kcal</strong> · P: <strong>${totP}g</strong> · C: ${totC}g · G: ${totG}g<br><br>📊 Resto del día: ${Math.max(0, remaining)} kcal · ${Math.max(0, Math.round(protRem))}g prot<br><span style="color:${remaining < 0 ? 'var(--red)' : 'var(--green)'}">→ ${remaining < 0 ? 'Excediste por ' + Math.abs(remaining) + ' kcal' : 'Podés comer ' + remaining + ' kcal más'}</span>`; renderNutrition(); }
        else { am.innerHTML = `<div class="ai-tag">⬡ ASCENSION AI</div>No reconocí alimentos. Usá palabras clave:<br><span style="color:var(--text2)">huevo, pollo, arroz, carne, atun, avena, papa, brocoli, pan, queso, leche, banana, proteina, salmon, fideos, batata</span>`; }
        box.appendChild(am); box.scrollTop = box.scrollHeight;
    }, 400); box.scrollTop = box.scrollHeight;
}

// ── FINANCE ───────────────────────────────────────────────────────────
function initMonthSels() { const now = new Date(); let html = ''; for (let i = 5; i >= -6; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; html += `<option value="${v}">${MSHORT[d.getMonth()]} ${d.getFullYear()}</option>`; } ['fin-month-sel', 'crm-month-sel'].forEach(id => { document.getElementById(id).innerHTML = html; }); const cur = `${now.getFullYear()}-${p2(now.getMonth() + 1)}`; document.getElementById('fin-month-sel').value = cur; document.getElementById('crm-month-sel').value = cur; }
function setFinChart(r, btn) { finChartRange = r; document.querySelectorAll('[id^=fin-tab-]').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderFinChart(); }
function renderFinance() {
    const filter = document.getElementById('fin-month-sel')?.value || ''; document.getElementById('fin-month-lbl').textContent = filter.toUpperCase();
    const fInc = incomes.filter(i => filter ? i.date.startsWith(filter) : true); const fExp = expenses.filter(e => filter ? e.date.startsWith(filter) : true);
    const totInc = fInc.reduce((a, b) => a + b.amount, 0); const totExp = fExp.reduce((a, b) => a + b.amount, 0); const saldo = totInc - totExp;
    const prevM = getPrevMonth(filter); const prevInc = incomes.filter(i => i.date.startsWith(prevM)).reduce((a, b) => a + b.amount, 0); const diffPct = prevInc ? Math.round((totInc - prevInc) / prevInc * 100) : 0;
    const cur = moneyLabel();
    document.getElementById('fin-big-cards').innerHTML = `
    <div class="stat-card c-green"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:28px;color:var(--green)">↑</span><div class="stat-label">INGRESOS</div></div><div class="stat-value c-green" style="font-size:32px">${cur} ${fmtMoney(totInc)}</div><div style="font-size:10px;color:var(--green);margin-top:2px">≈ USD ${fmtUSD(totInc)}</div><div class="stat-diff ${diffPct >= 0 ? 'up' : 'down'}">${diffPct >= 0 ? '+' : ''}${diffPct}% vs mes anterior</div></div>
    <div class="stat-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:28px;color:var(--accent)">↓</span><div class="stat-label">GASTOS</div></div><div class="stat-value c-red" style="font-size:32px">${cur} ${fmtMoney(totExp)}</div><div style="font-size:10px;color:var(--text2);margin-top:2px">≈ USD ${fmtUSD(totExp)}</div><div style="font-size:11px;color:var(--text2);margin-top:4px">${fExp.length} transacciones</div></div>
    <div class="stat-card ${saldo >= 0 ? 'c-blue' : ''}"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="font-size:28px;color:${saldo >= 0 ? 'var(--blue)' : 'var(--accent)'}">↗</span><div class="stat-label">BALANCE</div></div><div class="stat-value" style="font-size:32px;color:${saldo >= 0 ? 'var(--blue)' : 'var(--accent)'}">${cur} ${fmtMoney(saldo)}</div><div style="font-size:10px;color:${saldo >= 0 ? 'var(--blue)' : 'var(--text2)'};margin-top:2px">≈ USD ${fmtUSD(Math.abs(saldo))}</div><div class="stat-diff ${saldo >= 0 ? 'up' : 'down'}">${saldo >= 0 ? 'Superávit' : 'Déficit'}</div></div>`;
    renderFinChart(); renderDonut(fExp);
    const allTx = [...fInc.map(i => ({ ...i, type: 'inc' })), ...fExp.map(e => ({ ...e, type: 'exp' }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    document.getElementById('fin-recent-list').innerHTML = allTx.length ? allTx.map(tx => `<div class="tx-row"><div class="tx-icon" style="color:${tx.type === 'inc' ? 'var(--green)' : 'var(--accent)'};border-color:${tx.type === 'inc' ? 'rgba(0,255,136,0.3)' : 'rgba(255,0,64,0.3)'};">${tx.type === 'inc' ? '+' : '–'}</div><div class="tx-info"><div class="tx-desc">${tx.desc || tx.cat}</div><div class="tx-meta">${tx.cat} · ${fmtD(tx.date)}</div></div><div style="text-align:right"><div class="tx-amt" style="color:${tx.type === 'inc' ? 'var(--green)' : 'var(--accent)'};">${tx.type === 'inc' ? '+' : '-'}${cur} ${fmtMoney(tx.amount)}</div><div style="font-size:9px;color:var(--text2)">≈ USD ${fmtUSD(tx.amount)}</div></div><span class="tx-del" onclick="${tx.type === 'inc' ? `deleteInc('${tx.id}')` : `deleteExp('${tx.id}')`}">×</span></div>`).join('') : '<div class="empty-state" style="padding:20px"><p>Sin transacciones este mes</p></div>';
}
function renderDonut(fExp) { const cats = {}; fExp.forEach(e => { cats[e.cat] = (cats[e.cat] || 0) + e.amount; }); const total = Object.values(cats).reduce((a, b) => a + b, 0); if (!total) { document.getElementById('donut-svg').innerHTML = '<text x="70" y="74" text-anchor="middle" fill="#333" font-family="Inter" font-size="11">Sin datos</text>'; document.getElementById('donut-legend').innerHTML = ''; return; } const colors = ['#ff0040', '#00ff88', '#0088ff', '#ffaa00', '#cc00ff', '#00ccff', '#ff6600', '#ff69b4']; const entries = Object.entries(cats).sort(([, a], [, b]) => b - a); let startAngle = -Math.PI / 2; const cx = 70, cy = 70, r = 52, ir = 32; let paths = ''; entries.forEach(([cat, val], i) => { const angle = (val / total) * 2 * Math.PI; const endAngle = startAngle + angle; const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle); const x2 = cx + r * Math.cos(endAngle); const y2 = cy + r * Math.sin(endAngle); const xi1 = cx + ir * Math.cos(startAngle); const yi1 = cy + ir * Math.sin(startAngle); const xi2 = cx + ir * Math.cos(endAngle); const yi2 = cy + ir * Math.sin(endAngle); const lg = angle > Math.PI ? 1 : 0; const pct = Math.round(val / total * 100); const mx = cx + (r + 8) * Math.cos(startAngle + angle / 2); const my = cy + (r + 8) * Math.sin(startAngle + angle / 2); paths += `<path d="M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${xi2},${yi2} A${ir},${ir} 0 ${lg},0 ${xi1},${yi1}" fill="${colors[i % colors.length]}" opacity="0.9"/>`; if (pct > 5) paths += `<text x="${mx}" y="${my}" text-anchor="middle" fill="#fff" font-family="Inter" font-size="9" font-weight="700">${pct}%</text>`; startAngle = endAngle; }); document.getElementById('donut-svg').innerHTML = paths + `<circle cx="${cx}" cy="${cy}" r="${ir}" fill="#000"/>`; document.getElementById('donut-legend').innerHTML = entries.map(([cat, val], i) => `<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${colors[i % colors.length]}"></div><span style="flex:1">${cat}</span><span style="font-weight:700;color:${colors[i % colors.length]}">$${val.toLocaleString()}</span></div>`).join(''); }
function renderFinChart() { const svg = document.getElementById('fin-chart-svg'); const W = svg.parentElement.offsetWidth || 600; const H = 130; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); const months = finChartRange === '1m' ? 1 : finChartRange === '3m' ? 3 : 6; const now = new Date(); const pts = []; for (let i = months - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; const mInc = incomes.filter(x => x.date.startsWith(v)).reduce((a, b) => a + b.amount, 0); const mExp = expenses.filter(x => x.date.startsWith(v)).reduce((a, b) => a + b.amount, 0); pts.push({ label: MSHORT[d.getMonth()], saldo: mInc - mExp }); } if (pts.every(p => p.saldo === 0)) { svg.innerHTML = `<text x="${W / 2}" y="65" text-anchor="middle" fill="#333" font-family="Inter" font-size="12">Sin datos aún</text>`; return; } const maxV = Math.max(...pts.map(p => Math.abs(p.saldo)), 1); const minV = Math.min(...pts.map(p => p.saldo)); const pad = 50; const usableW = W - pad * 2; const usableH = H - 30; const toX = (i) => pad + i * (usableW / (pts.length - 1 || 1)); const toY = (v) => 8 + usableH * (1 - (v - minV) / (maxV - minV + 1)); const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.saldo)}`).join(' '); const areaD = pathD + ` L${toX(pts.length - 1)},${H - 20} L${toX(0)},${H - 20} Z`; const dots = pts.map((p, i) => `<circle cx="${toX(i)}" cy="${toY(p.saldo)}" r="4" fill="var(--red)" stroke="#000" stroke-width="2"><title>$${p.saldo.toLocaleString()}</title></circle>`).join(''); const labels = pts.map((p, i) => `<text x="${toX(i)}" y="${H - 5}" text-anchor="middle" fill="#555" font-family="Inter" font-size="10">${p.label}</text>`).join(''); const vLabels = pts.map((p, i) => `<text x="${toX(i)}" y="${toY(p.saldo) - 8}" text-anchor="middle" fill="${p.saldo >= 0 ? 'var(--green)' : 'var(--red)'}" font-family="Orbitron" font-size="8" font-weight="700">$${Math.abs(p.saldo).toLocaleString()}</text>`).join(''); svg.innerHTML = `<defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--red);stop-opacity:0.35"/><stop offset="100%" style="stop-color:var(--red);stop-opacity:0"/></linearGradient></defs><path d="${areaD}" fill="url(#aG)"/><path d="${pathD}" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}${vLabels}`; }
function getPrevMonth(filter) { const [y, m] = filter.split('-').map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; }
function saveIncome() { const amt = parseFloat(document.getElementById('m-inc-amt').value); if (!amt || isNaN(amt)) return; incomes.push({ id: uid(), cat: document.getElementById('m-inc-cat').value, desc: document.getElementById('m-inc-desc').value, amount: amt, date: document.getElementById('m-inc-date').value || today() }); DB.set('incomes', incomes); addXP(XP_RULES.income, 'Ingreso registrado'); showToast('💰 Ingreso registrado'); closeModal('modal-income'); renderFinance(); }
function deleteInc(id) { if (!confirm('¿Eliminar?')) return; incomes = incomes.filter(i => i.id !== id); DB.set('incomes', incomes); renderFinance(); }
function saveExpense() { const amt = parseFloat(document.getElementById('m-exp-amt').value); if (!amt || isNaN(amt)) return; expenses.push({ id: uid(), cat: document.getElementById('m-exp-cat').value, desc: document.getElementById('m-exp-desc').value, amount: amt, date: document.getElementById('m-exp-date').value || today() }); DB.set('expenses', expenses); closeModal('modal-expense'); renderFinance(); }
function deleteExp(id) { if (!confirm('¿Eliminar?')) return; expenses = expenses.filter(e => e.id !== id); DB.set('expenses', expenses); renderFinance(); }

// ── CRM ───────────────────────────────────────────────────────────────
function updateSalePreview() {
    const price = parseFloat(document.getElementById('m-sale-price').value) || 0;
    const cost = parseFloat(document.getElementById('m-sale-cost').value) || 0;
    const mycut = parseFloat(document.getElementById('m-sale-mycut').value) || 0;
    const cur = moneyLabel();
    document.getElementById('sale-preview').innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px"><span>Precio: <strong>${cur} ${fmtMoney(price)}</strong></span><span>Costo: <strong style="color:var(--accent)">${cur} ${fmtMoney(cost)}</strong></span><span>Ganancia bruta: <strong>${cur} ${fmtMoney(price - cost)}</strong></span><span>Mi ganancia: <strong style="color:var(--green)">${cur} ${fmtMoney(mycut)} <span style="color:var(--text2)">≈ USD ${fmtUSD(mycut)}</span></strong></span></div>`;
}
['m-sale-price', 'm-sale-cost', 'm-sale-mycut'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', updateSalePreview); });
function renderCRM() {
    const filter = document.getElementById('crm-month-sel')?.value || ''; document.getElementById('crm-month-lbl').textContent = filter.toUpperCase();
    const cur = moneyLabel();
    const fSales = sales.filter(s => filter ? s.date.startsWith(filter) : true);
    const totRev = fSales.reduce((a, b) => a + b.price, 0); const totProfit = fSales.reduce((a, b) => a + (b.mycut || 0), 0);
    const avgTicket = fSales.length ? Math.round(totRev / fSales.length) : 0; const goalPct = cfg.goalMonthly ? Math.min(100, Math.round(totProfit / cfg.goalMonthly * 100)) : 0;
    const yrProfit = sales.filter(s => s.date.startsWith(String(new Date().getFullYear()))).reduce((a, b) => a + (b.mycut || 0), 0);
    document.getElementById('crm-kpis').innerHTML = `
    <div class="stat-card c-green"><div class="stat-label">Mi ganancia este mes</div><div class="stat-value c-green" style="font-size:26px">${cur} ${fmtMoney(totProfit)}</div><div style="font-size:10px;color:var(--green)">≈ USD ${fmtUSD(totProfit)}</div><div class="stat-diff ${totProfit >= cfg.goalMonthly ? 'up' : 'down'}">${fSales.length} ventas</div></div>
    <div class="stat-card c-blue"><div class="stat-label">Facturado mes</div><div class="stat-value c-blue" style="font-size:26px">${cur} ${fmtMoney(totRev)}</div><div style="font-size:10px;color:var(--text2)">≈ USD ${fmtUSD(totRev)}</div></div>
    <div class="stat-card c-amber"><div class="stat-label">Ticket promedio</div><div class="stat-value c-amber">${cur} ${fmtMoney(avgTicket)}</div></div>
    <div class="stat-card"><div class="stat-label">Mi ganancia año</div><div class="stat-value" style="font-size:22px">${cur} ${fmtMoney(yrProfit)}</div><div style="font-size:9px;color:var(--text2)">≈ USD ${fmtUSD(yrProfit)}</div></div>`;
    document.getElementById('crm-global-goal').innerHTML = `<div style="display:flex;align-items:center;gap:20px"><div style="font-family:'Orbitron',monospace;font-size:56px;font-weight:900;color:${goalPct >= 100 ? 'var(--green)' : 'var(--accent)'};text-shadow:0 0 30px ${goalPct >= 100 ? 'rgba(0,255,136,0.4)' : 'rgba(255,0,64,0.4)'};">${goalPct}%</div><div style="flex:1"><div style="font-size:12px;color:var(--text2);margin-bottom:8px">Obj: <strong style="color:var(--text)">${cur} ${fmtMoney(cfg.goalMonthly || 0)}</strong> <span style="color:var(--text2)">≈ USD ${fmtUSD(cfg.goalMonthly || 0)}</span> · Logrado: <strong style="color:${goalPct >= 100 ? 'var(--green)' : 'var(--text)'}">${cur} ${fmtMoney(totProfit)}</strong></div><div style="height:10px;background:var(--bg3);border-radius:5px;overflow:hidden;border:1px solid var(--border)"><div style="height:100%;width:${goalPct}%;background:linear-gradient(90deg,var(--accent),${goalPct >= 100 ? 'var(--green)' : 'var(--accent)'});border-radius:5px;transition:width 0.8s"></div></div><div style="font-size:11px;color:var(--text2);margin-top:6px">Restante: <strong style="color:var(--amber)">${cur} ${fmtMoney(Math.max(0, (cfg.goalMonthly || 0) - totProfit))}</strong></div></div></div>`;
    const cos = [{ n: cfg.e1, c: 'var(--blue)' }, { n: cfg.e2, c: 'var(--amber)' }, { n: cfg.e3, c: 'var(--accent)' }];
    document.getElementById('crm-companies').innerHTML = cos.map(co => {
        const cSales = fSales.filter(s => s.company === co.n);
        const cRev = cSales.reduce((a, b) => a + b.price, 0);
        const cProfit = cSales.reduce((a, b) => a + (b.mycut || 0), 0);
        const rows = cSales.slice().reverse().map(s => `<tr><td>${fmtD(s.date)}</td><td>${s.client || '—'}</td><td>${s.product || '—'}</td><td>${cur} ${fmtMoney(s.price)}</td><td style="color:var(--text2)">${cur} ${fmtMoney(s.cost || 0)}</td><td style="color:var(--green);font-weight:700">${cur} ${fmtMoney(s.mycut || 0)}<div style="font-size:8px;color:var(--text2)">≈ USD ${fmtUSD(s.mycut || 0)}</div></td><td><span class="tx-del" onclick="deleteSale('${s.id}')">×</span></td></tr>`).join('');
        return `<div class="panel" style="border-color:${co.c.replace('var(--', 'rgba(').replace(')', ',0.4)')}"><div class="panel-head" style="color:${co.c}">${co.n}<div class="panel-actions"><span style="font-family:'Orbitron',monospace;font-size:12px;color:var(--green)">${cur} ${fmtMoney(cProfit)}</span><span style="font-size:9px;color:var(--text2);margin-left:4px">mi ganancia</span></div></div>${cSales.length ? `<div style="overflow-x:auto"><table class="co-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Precio</th><th>Costo</th><th>Mi ganancia</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div style="display:flex;justify-content:space-between;padding:10px 0 0;border-top:1px solid #111;margin-top:8px"><span style="font-size:11px;color:var(--text2)">${cSales.length} ventas · Facturado: ${cur} ${fmtMoney(cRev)}</span><span style="font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:var(--green)">+${cur} ${fmtMoney(cProfit)}</span></div>` : '<div class="empty-state" style="padding:14px"><p>Sin ventas este mes</p></div>'}</div>`;
    }).join('');
}
function saveSale() { const price = parseFloat(document.getElementById('m-sale-price').value) || 0; const cost = parseFloat(document.getElementById('m-sale-cost').value) || 0; const mycut = parseFloat(document.getElementById('m-sale-mycut').value) || 0; if (!price) return; sales.push({ id: uid(), company: document.getElementById('m-sale-co').value, client: document.getElementById('m-sale-client').value, product: document.getElementById('m-sale-product').value, price, cost, mycut, date: document.getElementById('m-sale-date').value || today() }); DB.set('sales', sales); addXP(XP_RULES.sale, 'Venta registrada'); showToast(`💰 Venta: +${moneyLabel()} ${fmtMoney(mycut)} (${fmtUSD(mycut)} USD)`); closeModal('modal-sale'); renderCRM(); }
function deleteSale(id) { if (!confirm('¿Eliminar venta?')) return; sales = sales.filter(s => s.id !== id); DB.set('sales', sales); renderCRM(); }

// ── NOTES & REMINDERS ─────────────────────────────────────────────────
function renderNotes() {
    const notesList = document.getElementById('notes-list'); const notesEmpty = document.getElementById('notes-empty');
    if (notes.length === 0) { notesList.innerHTML = ''; notesEmpty.style.display = 'block'; }
    else { notesEmpty.style.display = 'none'; notesList.innerHTML = notes.slice().reverse().map(n => `<div class="note-card" onclick="editNote('${n.id}')"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="note-title">${n.title || 'Sin título'}</div><button class="btn-icon btn-sm" onclick="event.stopPropagation();deleteNote('${n.id}')"><i class="ti ti-trash"></i></button></div><div class="note-preview">${n.content.slice(0, 100)}${n.content.length > 100 ? '...' : ''}</div><div class="note-date">${fmtD(n.date)} · ${n.time || ''}</div></div>`).join(''); }
    const remsEl = document.getElementById('reminders-list'); const remsEmpty = document.getElementById('reminders-empty');
    if (reminders.length === 0) { remsEl.innerHTML = ''; remsEmpty.style.display = 'block'; }
    else { remsEmpty.style.display = 'none'; remsEl.innerHTML = reminders.map(r => `<div class="reminder-card"><div style="display:flex;flex-direction:column;gap:2px">${(r.days || []).map(d => `<span class="reminder-day">${DAYS_FULL[d]?.slice(0, 3) || ''}</span>`).join('')}</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:${r.type === 'facultad' ? 'var(--blue)' : 'var(--amber)'}">${r.text}</div>${r.time ? `<div style="font-size:9px;color:var(--text2)">${r.time}</div>` : ''}</div><button class="btn-icon btn-sm" onclick="deleteReminder('${r.id}')"><i class="ti ti-trash"></i></button></div>`).join(''); }
    const today_dow = (new Date().getDay() + 6) % 7; const weekEl = document.getElementById('week-reminders');
    const todayRems = reminders.filter(r => r.days && r.days.includes(today_dow));
    weekEl.innerHTML = todayRems.length ? todayRems.map(r => `<div style="padding:10px;border:1px solid rgba(255,170,0,0.4);border-radius:6px;margin-bottom:6px;font-size:12px;color:var(--amber)">🔔 ${r.text}${r.time ? ' · ' + r.time : ''}</div>`).join('') : '<div style="font-size:11px;color:var(--text2)">Sin recordatorios para hoy.</div>';
}
function saveNote() { const title = document.getElementById('m-note-title').value.trim(); const content = document.getElementById('m-note-content').value.trim(); if (!content) return; const now = new Date(); notes.push({ id: uid(), title, content, date: ds(now), time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }); DB.set('notes', notes); addXP(2, 'Nota creada'); closeModal('modal-note'); document.getElementById('m-note-title').value = ''; document.getElementById('m-note-content').value = ''; renderNotes(); }
function editNote(id) { const n = notes.find(x => x.id === id); if (!n) return; document.getElementById('m-note-title').value = n.title || ''; document.getElementById('m-note-content').value = n.content; openModal('modal-note'); const btn = document.querySelector('#modal-note .btn-primary'); btn.onclick = () => { n.title = document.getElementById('m-note-title').value; n.content = document.getElementById('m-note-content').value; DB.set('notes', notes); closeModal('modal-note'); renderNotes(); }; }
function deleteNote(id) { if (!confirm('¿Eliminar nota?')) return; notes = notes.filter(n => n.id !== id); DB.set('notes', notes); renderNotes(); }
function renderReminderDaysSel() { selectedReminderDays = []; const el = document.getElementById('rem-days-sel'); el.innerHTML = DAYS_FULL.map((d, i) => `<button type="button" class="tab" style="padding:5px 10px;font-size:10px" onclick="toggleReminderDay(${i},this)">${d.slice(0, 3)}</button>`).join(''); }
function toggleReminderDay(i, btn) { if (selectedReminderDays.includes(i)) { selectedReminderDays = selectedReminderDays.filter(d => d !== i); btn.classList.remove('active'); } else { selectedReminderDays.push(i); btn.classList.add('active'); } }
function saveReminder() { const text = document.getElementById('m-rem-text').value.trim(); if (!text || !selectedReminderDays.length) return; reminders.push({ id: uid(), text, days: selectedReminderDays, time: document.getElementById('m-rem-time').value, type: document.getElementById('m-rem-type').value }); DB.set('reminders', reminders); closeModal('modal-reminder'); renderNotes(); }
function deleteReminder(id) { if (!confirm('¿Eliminar recordatorio?')) return; reminders = reminders.filter(r => r.id !== id); DB.set('reminders', reminders); renderNotes(); }

// ── BIBLE ─────────────────────────────────────────────────────────────
const BIBLE_BOOKS = [
    // Escrituras Hebreoarameas
    { id: 'gen', n: 'Génesis', ch: 50, ot: true }, { id: 'exo', n: 'Éxodo', ch: 40, ot: true }, { id: 'lev', n: 'Levítico', ch: 27, ot: true }, { id: 'num', n: 'Números', ch: 36, ot: true }, { id: 'deu', n: 'Deuteronomio', ch: 34, ot: true }, { id: 'jos', n: 'Josué', ch: 24, ot: true }, { id: 'jue', n: 'Jueces', ch: 21, ot: true }, { id: 'rut', n: 'Rut', ch: 4, ot: true }, { id: '1sa', n: '1 Samuel', ch: 31, ot: true }, { id: '2sa', n: '2 Samuel', ch: 24, ot: true }, { id: '1re', n: '1 Reyes', ch: 22, ot: true }, { id: '2re', n: '2 Reyes', ch: 25, ot: true }, { id: '1cr', n: '1 Crónicas', ch: 29, ot: true }, { id: '2cr', n: '2 Crónicas', ch: 36, ot: true }, { id: 'esd', n: 'Esdras', ch: 10, ot: true }, { id: 'neh', n: 'Nehemías', ch: 13, ot: true }, { id: 'est', n: 'Ester', ch: 10, ot: true }, { id: 'job', n: 'Job', ch: 42, ot: true }, { id: 'sal', n: 'Salmos', ch: 150, ot: true }, { id: 'pro', n: 'Proverbios', ch: 31, ot: true }, { id: 'ecl', n: 'Eclesiastés', ch: 12, ot: true }, { id: 'can', n: 'Cantares', ch: 8, ot: true }, { id: 'isa', n: 'Isaías', ch: 66, ot: true }, { id: 'jer', n: 'Jeremías', ch: 52, ot: true }, { id: 'lam', n: 'Lamentaciones', ch: 5, ot: true }, { id: 'eze', n: 'Ezequiel', ch: 48, ot: true }, { id: 'dan', n: 'Daniel', ch: 12, ot: true }, { id: 'ose', n: 'Oseas', ch: 14, ot: true }, { id: 'joe', n: 'Joel', ch: 3, ot: true }, { id: 'amo', n: 'Amós', ch: 9, ot: true }, { id: 'abd', n: 'Abdías', ch: 1, ot: true }, { id: 'jon', n: 'Jonás', ch: 4, ot: true }, { id: 'miq', n: 'Miqueas', ch: 7, ot: true }, { id: 'nah', n: 'Nahúm', ch: 3, ot: true }, { id: 'hab', n: 'Habacuc', ch: 3, ot: true }, { id: 'sof', n: 'Sofonías', ch: 3, ot: true }, { id: 'hag', n: 'Hageo', ch: 2, ot: true }, { id: 'zac', n: 'Zacarías', ch: 14, ot: true }, { id: 'mal', n: 'Malaquías', ch: 4, ot: true },
    // Escrituras Griegas Cristianas
    { id: 'mat', n: 'Mateo', ch: 28, ot: false }, { id: 'mar', n: 'Marcos', ch: 16, ot: false }, { id: 'luc', n: 'Lucas', ch: 24, ot: false }, { id: 'jua', n: 'Juan', ch: 21, ot: false }, { id: 'hch', n: 'Hechos', ch: 28, ot: false }, { id: 'rom', n: 'Romanos', ch: 16, ot: false }, { id: '1co', n: '1 Corintios', ch: 16, ot: false }, { id: '2co', n: '2 Corintios', ch: 13, ot: false }, { id: 'gal', n: 'Gálatas', ch: 6, ot: false }, { id: 'efe', n: 'Efesios', ch: 6, ot: false }, { id: 'fil', n: 'Filipenses', ch: 4, ot: false }, { id: 'col', n: 'Colosenses', ch: 4, ot: false }, { id: '1ts', n: '1 Tesalonicenses', ch: 5, ot: false }, { id: '2ts', n: '2 Tesalonicenses', ch: 3, ot: false }, { id: '1ti', n: '1 Timoteo', ch: 6, ot: false }, { id: '2ti', n: '2 Timoteo', ch: 4, ot: false }, { id: 'tit', n: 'Tito', ch: 3, ot: false }, { id: 'flm', n: 'Filemón', ch: 1, ot: false }, { id: 'heb', n: 'Hebreos', ch: 13, ot: false }, { id: 'san', n: 'Santiago', ch: 5, ot: false }, { id: '1pe', n: '1 Pedro', ch: 5, ot: false }, { id: '2pe', n: '2 Pedro', ch: 3, ot: false }, { id: '1jn', n: '1 Juan', ch: 5, ot: false }, { id: '2jn', n: '2 Juan', ch: 1, ot: false }, { id: '3jn', n: '3 Juan', ch: 1, ot: false }, { id: 'jud', n: 'Judas', ch: 1, ot: false }, { id: 'apo', n: 'Apocalipsis', ch: 22, ot: false },
];
function calcBibleGlobalPct() { const total = BIBLE_BOOKS.reduce((a, b) => a + b.ch, 0); let read = 0; BIBLE_BOOKS.forEach(book => { const prog = bibleProgress[book.id] || {}; for (let c = 1; c <= book.ch; c++) { if (prog[c]) read++; } }); return total ? Math.round(read / total * 100) : 0; }
function renderBible() {
    const totalCh = BIBLE_BOOKS.reduce((a, b) => a + b.ch, 0); let readCh = 0, completedBooks = 0; BIBLE_BOOKS.forEach(book => { const prog = bibleProgress[book.id] || {}; let bc = 0; for (let c = 1; c <= book.ch; c++) { if (prog[c]) { readCh++; bc++; } } if (bc === book.ch) completedBooks++; });
    const pct = Math.round(readCh / totalCh * 100); document.getElementById('bible-global-prog').textContent = pct + '%';
    document.getElementById('bible-kpis').innerHTML = `<div class="stat-card c-green"><div class="stat-label">Capítulos leídos</div><div class="stat-value c-green">${readCh}</div><div class="stat-diff up">de ${totalCh} total</div></div><div class="stat-card c-amber"><div class="stat-label">Libros completos</div><div class="stat-value c-amber">${completedBooks}</div><div class="stat-diff up">de ${BIBLE_BOOKS.length}</div></div><div class="stat-card c-blue"><div class="stat-label">Progreso global</div><div class="stat-value c-blue">${pct}%</div></div><div class="stat-card"><div class="stat-label">Por leer</div><div class="stat-value">${totalCh - readCh}</div></div>`;
    function renderSection(books, containerId) {
        document.getElementById(containerId).innerHTML = `<div class="g4">${books.map(book => { const prog = bibleProgress[book.id] || {}; let done = 0; for (let c = 1; c <= book.ch; c++) { if (prog[c]) done++; } const bookPct = Math.round(done / book.ch * 100); const completed = done === book.ch; return `<div class="bible-book" style="border-color:${completed ? 'rgba(0,255,136,0.5)' : done > 0 ? 'rgba(255,0,64,0.3)' : 'var(--border2)'}"><div class="bible-book-header"><div class="bible-book-name">${book.n}</div><div class="bible-book-prog" style="color:${completed ? 'var(--green)' : done > 0 ? 'var(--amber)' : 'var(--text2)'}">${done}/${book.ch}</div></div><div style="height:4px;background:#111;border-radius:2px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:${bookPct}%;background:${completed ? 'var(--green)' : done > 0 ? 'var(--amber)' : 'var(--red)'};border-radius:2px;transition:width 0.4s"></div></div><div class="bible-chapters">${Array.from({ length: book.ch }, (_, i) => { const c = i + 1; const isRead = prog[c] || false; return `<div class="bible-ch${isRead ? ' read' : ''}" onclick="toggleBibleCh('${book.id}',${c})">${c}</div>`; }).join('')}</div></div>`; }).join('')}</div>`;
    }
    renderSection(BIBLE_BOOKS.filter(b => b.ot), 'bible-ot');
    renderSection(BIBLE_BOOKS.filter(b => !b.ot), 'bible-nt');
}
function toggleBibleCh(bookId, ch) { if (!bibleProgress[bookId]) bibleProgress[bookId] = {}; bibleProgress[bookId][ch] = !bibleProgress[bookId][ch]; DB.set('bibleProgress', bibleProgress); if (bibleProgress[bookId][ch]) addXP(2, 'Capítulo bíblico leído'); renderBible(); }
function resetBible() { if (!confirm('¿Resetear todo el progreso bíblico?')) return; bibleProgress = {}; DB.set('bibleProgress', bibleProgress); renderBible(); }

// ── STUDY / FACULTAD ──────────────────────────────────────────────────
const HOUR_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

function renderStudy() {
    // KPIs
    const upcoming = studyEvents.filter(e => e.date >= today()).length;
    const exams = studyEvents.filter(e => e.type === 'exam' && e.date >= today()).length;
    document.getElementById('study-kpis').innerHTML = `<div class="stat-card c-red"><div class="stat-label">Parciales próximos</div><div class="stat-value c-red">${exams}</div></div><div class="stat-card c-amber"><div class="stat-label">Eventos próximos</div><div class="stat-value c-amber">${upcoming}</div></div><div class="stat-card c-blue"><div class="stat-label">Materias</div><div class="stat-value c-blue">${subjects.length}</div></div><div class="stat-card c-green"><div class="stat-label">Promedio general</div><div class="stat-value c-green">${calcGeneralAvg()}</div></div>`;
    renderScheduleGrid(); renderStudyEvents(); renderGradesTable(); renderStudyAverages();
}

function renderScheduleGrid() {
    if (!subjects.length) { document.getElementById('schedule-grid').innerHTML = '<div class="empty-state" style="padding:16px"><i class="ti ti-school"></i><p>Agregá materias para ver el horario</p></div>'; return; }
    const headers = `<div class="sch-header">Hora</div>${DAYS_FULL.map(d => `<div class="sch-header">${d.slice(0, 3).toUpperCase()}</div>`).join('')}`;
    const rows = HOUR_SLOTS.map(hour => { const cells = DAYS_FULL.map((_, dow) => { const cell = schedule[`${dow}-${hour}`]; const subj = cell ? subjects.find(s => s.id === cell.subjId) : null; return `<div class="sch-cell${subj ? ' has-class' : ''}" onclick="toggleScheduleCell(${dow},'${hour}')" style="${subj ? `border-color:${subj.color};` : ''}"><div class="sch-cell-text" style="color:${subj ? subj.color : 'var(--text2)'}">${subj ? subj.name : ''}</div></div>`; }).join(''); return `<div class="sch-time">${hour}</div>${cells}`; }).join('');
    document.getElementById('schedule-grid').innerHTML = `<div class="schedule-grid">${headers}${rows}</div>`;
}
function toggleScheduleCell(dow, hour) { const key = `${dow}-${hour}`; if (!subjects.length) { showToast('Primero agregá materias', 'var(--amber)'); return; } if (schedule[key]) { delete schedule[key]; } else { const idx = Object.keys(schedule).length % subjects.length; schedule[key] = { subjId: subjects[idx].id }; } DB.set('schedule', schedule); renderScheduleGrid(); }

// Modal para asignar materia a celda
function renderStudyEvents() {
    const sorted = studyEvents.sort((a, b) => a.date.localeCompare(b.date));
    const evColors = { exam: 'var(--red)', class: 'var(--blue)', task: 'var(--amber)', other: 'var(--text2)' };
    const evLabels = { exam: 'PARCIAL', class: 'CLASE', task: 'ENTREGA', other: 'EVENTO' };
    document.getElementById('study-events-list').innerHTML = sorted.length ? sorted.map(e => `<div class="study-event ev-${e.type}" style="border-color:${evColors[e.type]?.replace('var(--', 'rgba(').replace(')', ')') || 'rgba(255,255,255,0.2)'}"><div class="study-event-date" style="color:${evColors[e.type] || 'var(--text2)'}">${fmtD(e.date)}</div><div class="study-event-text">${e.desc}${e.subject ? ` <span style="color:var(--text2);font-size:10px">· ${e.subject}</span>` : ''}</div><span class="study-event-type" style="background:${evColors[e.type]?.replace('var(--', 'rgba(').replace(')', ',0.15)') || '#111'};color:${evColors[e.type] || 'var(--text2)'};border:1px solid ${evColors[e.type]?.replace('var(--', 'rgba(').replace(')', ',0.4)') || '#333'}">${evLabels[e.type] || 'EVENTO'}</span><button class="btn-icon btn-sm" onclick="deleteStudyEvent('${e.id}')"><i class="ti ti-trash"></i></button></div>`).join('') : '<div class="empty-state" style="padding:16px"><i class="ti ti-calendar"></i><p>Sin eventos registrados</p></div>';
}

function renderGradesTable() {
    if (!subjects.length) { document.getElementById('grades-table-wrap').innerHTML = '<div class="empty-state" style="padding:16px"><p>Agregá materias primero</p></div>'; return; }
    const rows = subjects.map(s => { const g = grades[s.id] || {}; const p1 = g.p1 || ''; const p2 = g.p2 || ''; const fin = g.fin || ''; return `<tr><td style="font-weight:600;color:${s.color || 'var(--text)'}">${s.name}</td><td><input class="grade-input" type="number" step="0.1" min="0" max="10" value="${p1}" placeholder="—" onchange="saveGrade('${s.id}','p1',this.value)" style="border-color:${s.color || 'var(--border2)'}"/></td><td><input class="grade-input" type="number" step="0.1" min="0" max="10" value="${p2}" placeholder="—" onchange="saveGrade('${s.id}','p2',this.value)" style="border-color:${s.color || 'var(--border2)'}"/></td><td><input class="grade-input" type="number" step="0.1" min="0" max="10" value="${fin}" placeholder="—" onchange="saveGrade('${s.id}','fin',this.value)" style="border-color:${s.color || 'var(--border2)'}"/></td><td><button class="btn-icon btn-sm" onclick="deleteSubject('${s.id}')"><i class="ti ti-trash"></i></button></td></tr>`; }).join('');
    document.getElementById('grades-table-wrap').innerHTML = `<table class="grade-table"><thead><tr><th>Materia</th><th>1er Parcial</th><th>2do Parcial</th><th>Final</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderStudyAverages() {
    const g1 = [], g2 = [], gFin = []; subjects.forEach(s => { const g = grades[s.id] || {}; if (g.p1 !== '' && g.p1 !== undefined) g1.push(parseFloat(g.p1)); if (g.p2 !== '' && g.p2 !== undefined) g2.push(parseFloat(g.p2)); if (g.fin !== '' && g.fin !== undefined) gFin.push(parseFloat(g.fin)); });
    const avg = (arr) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
    const a1 = avg(g1), a2 = avg(g2), aFin = avg(gFin);
    const color = (v) => v === null ? 'var(--text2)' : v >= 7 ? 'var(--green)' : v >= 5 ? 'var(--amber)' : 'var(--red)';
    document.getElementById('study-averages').innerHTML = `<div class="g3">
    <div style="text-align:center;padding:16px"><div style="font-size:9px;color:var(--text2);letter-spacing:2px;margin-bottom:8px">PRIMEROS PARCIALES</div><div style="font-family:'Orbitron',monospace;font-size:36px;font-weight:900;color:${color(a1)}">${a1 !== null ? a1 : '--'}</div></div>
    <div style="text-align:center;padding:16px"><div style="font-size:9px;color:var(--text2);letter-spacing:2px;margin-bottom:8px">SEGUNDOS PARCIALES</div><div style="font-family:'Orbitron',monospace;font-size:36px;font-weight:900;color:${color(a2)}">${a2 !== null ? a2 : '--'}</div></div>
    <div style="text-align:center;padding:16px"><div style="font-size:9px;color:var(--text2);letter-spacing:2px;margin-bottom:8px">FINALES</div><div style="font-family:'Orbitron',monospace;font-size:36px;font-weight:900;color:${color(aFin)}">${aFin !== null ? aFin : '--'}</div></div>
  </div>`;
}

function calcGeneralAvg() { const all = []; subjects.forEach(s => { const g = grades[s.id] || {}; if (g.p1 !== '' && g.p1 !== undefined) all.push(parseFloat(g.p1)); if (g.p2 !== '' && g.p2 !== undefined) all.push(parseFloat(g.p2)); if (g.fin !== '' && g.fin !== undefined) all.push(parseFloat(g.fin)); }); return all.length ? parseFloat((all.reduce((a, b) => a + b, 0) / all.length).toFixed(2)).toString() : '--'; }

function saveGrade(subjId, type, val) { if (!grades[subjId]) grades[subjId] = {}; grades[subjId][type] = val; DB.set('grades', grades); renderStudyAverages(); }
function saveSubject() {
    const name = document.getElementById('m-subj-name').value.trim(); if (!name) return; const days = selectedSubjDays.slice(); const hourStart = document.getElementById('m-subj-hour-start').value; const hourEnd = document.getElementById('m-subj-hour-end').value; const color = document.getElementById('m-subj-color').value; const id = 's' + uid(); subjects.push({ id, name, color, days, hourStart, hourEnd }); DB.set('subjects', subjects);
    // Auto-fill schedule
    days.forEach(dow => { if (hourStart) schedule[`${dow}-${hourStart}`] = { subjId: id }; }); DB.set('schedule', schedule);
    closeModal('modal-subject'); renderStudy();
}
function deleteSubject(id) { if (!confirm('¿Eliminar materia?')) return; subjects = subjects.filter(s => s.id !== id); delete grades[id]; DB.set('subjects', subjects); DB.set('grades', grades); renderStudy(); }
function saveStudyEvent() { const desc = document.getElementById('m-sev-desc').value.trim(); const date = document.getElementById('m-sev-date').value; if (!desc || !date) return; studyEvents.push({ id: uid(), desc, date, type: document.getElementById('m-sev-type').value, subject: document.getElementById('m-sev-subj').value }); DB.set('studyEvents', studyEvents); closeModal('modal-study-event'); renderStudy(); }
function deleteStudyEvent(id) { if (!confirm('¿Eliminar?')) return; studyEvents = studyEvents.filter(e => e.id !== id); DB.set('studyEvents', studyEvents); renderStudy(); }
function renderSubjDaysSel() { selectedSubjDays = []; const el = document.getElementById('subj-days-sel'); if (!el) return; el.innerHTML = DAYS_FULL.map((d, i) => `<button type="button" class="tab" style="padding:4px 8px;font-size:9px" onclick="toggleSubjDay(${i},this)">${d.slice(0, 3)}</button>`).join(''); }
function toggleSubjDay(i, btn) { if (selectedSubjDays.includes(i)) { selectedSubjDays = selectedSubjDays.filter(d => d !== i); btn.classList.remove('active'); } else { selectedSubjDays.push(i); btn.classList.add('active'); } }

// ── STATS ─────────────────────────────────────────────────────────────
function setStatFilter(f, btn) { statFilter = f; document.querySelectorAll('#sec-stats .sec-actions .tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); renderStats(); }
function renderStats() {
    const now = new Date(); const months = statFilter === 'month' ? 1 : statFilter === 'quarter' ? 3 : 12;
    const sinceDate = new Date(now); sinceDate.setMonth(now.getMonth() - months + 1); sinceDate.setDate(1); const preMin = ds(sinceDate).slice(0, 7);
    const trainCount = Object.entries(calStates).filter(([k, v]) => v === 'done' && k >= preMin + '-01').length;
    const allKcal = Object.entries(foodLogs).filter(([k]) => k >= preMin + '-01').map(([, fl]) => fl.reduce((a, b) => a + b.kcal, 0)).filter(k => k > 0);
    const avgKcal = allKcal.length ? Math.round(allKcal.reduce((a, b) => a + b, 0) / allKcal.length) : 0;
    const totInc = incomes.filter(i => i.date >= preMin + '-01').reduce((a, b) => a + b.amount, 0);
    const totExp = expenses.filter(e => e.date >= preMin + '-01').reduce((a, b) => a + b.amount, 0);
    document.getElementById('stats-kpis').innerHTML = `<div class="stat-card"><div class="stat-label">Entrenamientos</div><div class="stat-value">${trainCount}</div></div><div class="stat-card c-green"><div class="stat-label">Hábitos</div><div class="stat-value c-green">${calcGlobalHabPct()}%</div></div><div class="stat-card c-amber"><div class="stat-label">Kcal promedio</div><div class="stat-value c-amber">${avgKcal}</div></div><div class="stat-card c-blue"><div class="stat-label">Balance</div><div class="stat-value c-blue" style="font-size:24px">$${(totInc - totExp).toLocaleString()}</div></div>`;
    const wl = weightLogs.slice(-12);
    if (wl.length > 1) { const maxW = Math.max(...wl.map(w => w.weight)); const minW = Math.min(...wl.map(w => w.weight)); document.getElementById('stats-weight-chart').innerHTML = wl.map((w, i) => `<div class="sparkbar" style="height:${Math.max(6, Math.round((w.weight - minW * 0.97) / (maxW - minW * 0.97 + 0.5) * 84))}px;background:${i === wl.length - 1 ? 'var(--green)' : 'rgba(0,255,136,0.25)'};position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:2px"><span style="font-size:7px;color:var(--text)">${w.weight}</span></div>`).join(''); document.getElementById('stats-weight-lbls').innerHTML = wl.map(w => `<div class="sparklabel">${fmtD(w.date).slice(0, 5)}</div>`).join(''); }
    else document.getElementById('stats-weight-chart').innerHTML = '<div style="color:var(--text2);font-size:10px;padding:14px">Sin datos de peso</div>';
    const tMonths = Array.from({ length: Math.min(months, 12) }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1); const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; const cnt = Object.entries(calStates).filter(([k, st]) => k.startsWith(v) && st === 'done').length; return { label: MSHORT[d.getMonth()], cnt }; });
    const maxT = Math.max(...tMonths.map(m => m.cnt), 1); document.getElementById('stats-train-monthly').innerHTML = tMonths.map(m => `<div class="bar-row"><div class="bar-label" style="width:30px">${m.label}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(m.cnt / maxT * 100)}%;background:var(--red)"></div></div><div class="bar-val">${m.cnt}</div></div>`).join('');
    document.getElementById('stats-habits-bars').innerHTML = habCfg.map(h => { const p = calcHabPct30(h.id); return `<div class="bar-row"><div class="bar-label" style="width:110px;flex-shrink:0">${h.name}</div><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${h.color}"></div></div><div class="bar-val">${p}%</div></div>`; }).join('') || '<div class="empty-state" style="padding:12px">Sin hábitos</div>';
    const fMonths = Array.from({ length: Math.min(months, 12) }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1); const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; const mInc = incomes.filter(x => x.date.startsWith(v)).reduce((a, b) => a + b.amount, 0); const mExp = expenses.filter(x => x.date.startsWith(v)).reduce((a, b) => a + b.amount, 0); return { label: MSHORT[d.getMonth()], mInc, mExp }; });
    const maxF = Math.max(...fMonths.map(m => Math.max(m.mInc, m.mExp)), 1); document.getElementById('stats-finance-bars').innerHTML = fMonths.map(m => `<div class="bar-row"><div class="bar-label" style="width:30px">${m.label}</div><div style="flex:1;display:flex;flex-direction:column;gap:3px"><div class="bar-track"><div class="bar-fill" style="width:${Math.round(m.mInc / maxF * 100)}%;background:var(--green)"></div></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(m.mExp / maxF * 100)}%;background:var(--red)"></div></div></div><div class="bar-val" style="min-width:65px;font-size:9px">$${m.mInc.toLocaleString()}<br><span style="color:var(--red)">$${m.mExp.toLocaleString()}</span></div></div>`).join('');
}

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────
function renderAchievements() {
    const lvl = getLvl(); const pct = getLvlPct(); const rank = getRank(lvl);
    document.getElementById('ach-level-sub').textContent = `NIVEL ${lvl} — ${totalXP} XP`;
    document.getElementById('ach-level-big').textContent = lvl;
    document.getElementById('ach-rank-name').textContent = rank.name; document.getElementById('ach-rank-name').style.color = rank.color;
    document.getElementById('ach-xp-cur').textContent = totalXP % XP_PER_LEVEL; document.getElementById('ach-xp-next').textContent = XP_PER_LEVEL; document.getElementById('ach-xp-bar').style.width = pct + '%';
    document.getElementById('ach-total-xp').textContent = totalXP.toLocaleString();
    const earned = BADGES.filter(b => b.check()).length;
    document.getElementById('ach-mini-stats').innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><div style="flex:1;background:#0a0a0a;border:1px solid var(--border);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:900;color:var(--green)">${earned}</div><div style="font-size:9px;color:var(--text2);margin-top:3px">badges</div></div><div style="flex:1;background:#0a0a0a;border:1px solid var(--border);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:900;color:var(--blue)">${Object.values(calStates).filter(v => v === 'done').length}</div><div style="font-size:9px;color:var(--text2);margin-top:3px">entrenos</div></div><div style="flex:1;background:#0a0a0a;border:1px solid var(--border);border-radius:6px;padding:12px;text-align:center"><div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:900;color:var(--red)">${calcHabStreak()}</div><div style="font-size:9px;color:var(--text2);margin-top:3px">racha</div></div></div>`;
    document.getElementById('badge-grid').innerHTML = BADGES.map(b => `<div class="badge ${b.check() ? 'earned' : ''}"><span class="badge-icon">${b.icon}</span><div class="badge-name">${b.name}</div></div>`).join('');
    document.getElementById('xp-log-list').innerHTML = xpLog.slice(0, 30).map(x => `<div class="tx-row"><div class="tx-icon" style="color:var(--amber);border-color:rgba(255,170,0,0.3);font-size:10px;font-weight:700">XP</div><div class="tx-info"><div class="tx-desc">${x.label}</div><div class="tx-meta">${new Date(x.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div><div class="tx-amt" style="color:var(--amber)">+${x.amount}</div></div>`).join('') || '<div class="empty-state" style="padding:18px"><p>Usá la app para ganar XP</p></div>';
}

// ── CONFIG ────────────────────────────────────────────────────────────
function loadConfig() {
    ['name', 'age', 'height', 'peso', 'kcal', 'prot', 'carb', 'fat', 'fiber', 'e1', 'e2', 'e3'].forEach(f => { const el = document.getElementById('cfg-' + f); if (el) el.value = cfg[f] || ''; });
    const el = document.getElementById('cfg-peso-goal'); if (el) el.value = cfg.pesoGoal || '';
    document.getElementById('cfg-sex').value = cfg.sex || 'm';
    document.getElementById('cfg-activity').value = cfg.activity || 1.55;
    document.getElementById('cfg-goal-monthly').value = cfg.goalMonthly || '';
    const curEl = document.getElementById('cfg-currency'); if (curEl) curEl.value = cfg.currency || 'ARS';
    const usdEl = document.getElementById('cfg-usd-rate'); if (usdEl) usdEl.value = cfg.usdRate || 1000;
    const anEl = document.getElementById('cfg-appname'); if (anEl) anEl.value = cfg.appName || 'ASCENSION';
    const wuEl = document.getElementById('cfg-weight-unit'); if (wuEl) wuEl.value = cfg.weightUnit || 'kg';
    const dsEl = document.getElementById('cfg-default-sections'); if (dsEl) dsEl.value = cfg.defaultSections || 'Entrada en calor,Rutina principal,ABS';
    // Mark active accent swatch
    document.querySelectorAll('.accent-swatch').forEach(s => { s.classList.toggle('active', s.getAttribute('onclick')?.includes(cfg.accentColor || '#ff0040')); });
    const themeBtn = document.getElementById('toggle-theme'); if (themeBtn) themeBtn.textContent = cfg.darkMode !== false ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    document.getElementById('cfg-last-backup').textContent = lastBackup ? new Date(lastBackup).toLocaleDateString('es-AR') : 'Nunca — ¡exportá ahora!';
    const bmr = cfg.sex === 'm' ? 88.36 + (13.4 * (cfg.peso || 80)) + (4.8 * (cfg.height || 175)) - (5.7 * (cfg.age || 25)) : 447.6 + (9.25 * (cfg.peso || 80)) + (3.1 * (cfg.height || 175)) - (4.33 * (cfg.age || 25));
    const tdee = Math.round(bmr * (cfg.activity || 1.55));
    document.getElementById('cfg-plan-display').innerHTML = `<div style="display:flex;flex-direction:column;gap:8px"><div class="bar-row"><div class="bar-label" style="width:60px">TMB</div><div style="flex:1;font-family:'Orbitron',monospace;font-size:12px;color:var(--text)">${Math.round(bmr)} kcal</div></div><div class="bar-row"><div class="bar-label" style="width:60px">TDEE</div><div style="flex:1;font-family:'Orbitron',monospace;font-size:12px;color:var(--amber)">${tdee} kcal</div></div><div class="bar-row"><div class="bar-label" style="width:60px">Objetivo</div><div style="flex:1;font-family:'Orbitron',monospace;font-size:12px;color:var(--accent)">${cfg.kcal} kcal/día</div></div><div style="font-size:10px;color:var(--text2);margin-top:6px;padding-top:8px;border-top:1px solid #111">P: ${cfg.prot}g · C: ${cfg.carb}g · G: ${cfg.fat}g · F: ${cfg.fiber}g</div></div>`;
}
function saveConfig() {
    cfg = {
        ...cfg,
        name: document.getElementById('cfg-name').value || 'Usuario',
        age: parseInt(document.getElementById('cfg-age').value) || 25,
        height: parseInt(document.getElementById('cfg-height').value) || 175,
        sex: document.getElementById('cfg-sex').value,
        peso: parseFloat(document.getElementById('cfg-peso').value) || 80,
        pesoGoal: parseFloat(document.getElementById('cfg-peso-goal').value) || 75,
        kcal: parseInt(document.getElementById('cfg-kcal').value) || 2200,
        prot: parseInt(document.getElementById('cfg-prot').value) || 180,
        carb: parseInt(document.getElementById('cfg-carb').value) || 220,
        fat: parseInt(document.getElementById('cfg-fat').value) || 70,
        fiber: parseInt(document.getElementById('cfg-fiber').value) || 30,
        activity: parseFloat(document.getElementById('cfg-activity').value) || 1.55,
        e1: document.getElementById('cfg-e1').value || 'Empresa 1',
        e2: document.getElementById('cfg-e2').value || 'Empresa 2',
        e3: document.getElementById('cfg-e3').value || 'Empresa 3',
        goalMonthly: parseFloat(document.getElementById('cfg-goal-monthly').value) || 5000,
        currency: document.getElementById('cfg-currency').value || 'ARS',
        usdRate: parseFloat(document.getElementById('cfg-usd-rate').value) || 1000,
        weightUnit: document.getElementById('cfg-weight-unit').value || 'kg',
        defaultSections: document.getElementById('cfg-default-sections').value || 'Entrada en calor,Rutina principal,ABS',
        onboarded: true
    };
    DB.set('cfg', cfg); showToast('✓ Configuración guardada');
}
function exportData() { const data = { cfg, routines, completedEx, calStates, habCfg, habLogs, foodLogs, foodFavs, weightLogs, incomes, expenses, sales, weightHist, xpLog, totalXP, notes, reminders, bibleProgress, subjects, grades, schedule, studyEvents, weeklyShown, exportedAt: new Date().toISOString(), version: '8.0' }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ascension-v8-${today()}.json`; a.click(); lastBackup = Date.now(); DB.set('lastBackup', lastBackup); showToast('✓ Exportado — guardalo en Drive! 💾'); }
function importData(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { try { const d = JSON.parse(ev.target.result);['cfg', 'routines', 'completedEx', 'calStates', 'habCfg', 'habLogs', 'foodLogs', 'foodFavs', 'weightLogs', 'incomes', 'expenses', 'sales', 'weightHist', 'xpLog', 'totalXP', 'notes', 'reminders', 'bibleProgress', 'subjects', 'grades', 'schedule', 'studyEvents', 'weeklyShown'].forEach(k => { if (d[k] !== undefined) DB.set(k, d[k]); }); alert('✓ Datos importados. Recargando...'); location.reload(); } catch { alert('Error al importar. Asegurate de usar el archivo correcto.'); } }; reader.readAsText(file); }
function confirmReset() { if (confirm('¿Borrar TODOS los datos de ASCENSION?') && confirm('CONFIRMACIÓN FINAL. No hay vuelta atrás.')) { Object.keys(localStorage).filter(k => k.startsWith('pa8_')).forEach(k => localStorage.removeItem(k)); location.reload(); } }

// ── MODALS ────────────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('open');
    if (id === 'modal-income') document.getElementById('m-inc-date').value = today();
    if (id === 'modal-expense') document.getElementById('m-exp-date').value = today();
    if (id === 'modal-sale') { document.getElementById('m-sale-date').value = today(); document.getElementById('m-sale-co').innerHTML = `<option>${cfg.e1}</option><option>${cfg.e2}</option><option>${cfg.e3}</option>`; updateSalePreview(); }
    if (id === 'modal-habit') document.getElementById('m-hab-start').value = today();
    if (id === 'modal-reminder') renderReminderDaysSel();
    if (id === 'modal-subject') renderSubjDaysSel();
    if (id === 'modal-study-event') document.getElementById('m-sev-date').value = today();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); editExIdx2 = null; }
document.querySelectorAll('.overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

// ── CLOCK & INIT ──────────────────────────────────────────────────────
function updateClock() { const el = document.getElementById('clock'); if (el) el.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
function init() {
    applyVisualSettings();
    updateXPBar(); initMonthSels();
    ['m-inc-date', 'm-exp-date', 'm-sale-date'].forEach(id => { const el = document.getElementById(id); if (el) el.value = today(); });
    checkOnboarding();
    if (cfg.onboarded) { renderDashboard(); renderTraining(); setTimeout(checkBackup, 2000); setTimeout(checkWeeklyAnimation, 3500); }
    updateClock(); setInterval(updateClock, 1000);
    setInterval(() => { if (currentSection === 'dashboard') renderDashboard(); }, 60000);
    // Aviso backup al cerrar
    window.addEventListener('beforeunload', e => {
        const days = Math.floor((Date.now() - lastBackup) / 86400000);
        if (lastBackup === 0 || days >= 2) {
            const msg = '⚠️ ¿Exportaste el backup hoy? Acordate de guardar el JSON en Google Drive.';
            e.preventDefault(); e.returnValue = msg; return msg;
        }
    });
}
init();

