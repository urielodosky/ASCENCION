"use client";

import { useState, useMemo } from "react";
import { useData } from "@/lib/db";
import { today, ds, p2, uid, fmtD } from "@/lib/utils";

const INC_CATS = ["Sueldo", "Negocio", "Inversiones", "Otros"];
const EXP_CATS = ["Supermercado", "Alquiler", "Servicios", "Transporte", "Ocio", "Otros"];
const MSHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Donut({ data, colors, title, subTitle, currency }: any) {
  const total = data.reduce((sum: number, d: any) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "10px" }}>{title}</div>
        <svg viewBox="0 0 100 100" style={{ width: "100px", height: "100px", margin: "10px auto", opacity: 0.2 }}>
           <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="15" />
        </svg>
        <div style={{ fontSize: "10px" }}>Sin datos</div>
      </div>
    );
  }

  let acc = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "10px", color: "var(--text)" }}>{title}</div>
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
          {data.map((d: any, i: number) => {
            const pct = d.value / total;
            const dashArray = `${pct * 251.2} 251.2`;
            const dashOffset = -(acc * 251.2);
            acc += pct;
            return (
              <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={colors[i % colors.length]} strokeWidth="15" strokeDasharray={dashArray} strokeDashoffset={dashOffset} style={{ transition: "all 0.5s ease" }}>
                <title>{d.label}: {currency} {d.value.toLocaleString()}</title>
              </circle>
            );
          })}
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: "12px", fontWeight: 800 }}>{subTitle}</span>
        </div>
      </div>
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        {data.map((d: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[i % colors.length] }}></div>
              <span style={{ color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90px" }}>{d.label}</span>
            </div>
            <span style={{ fontWeight: 600 }}>{Math.round((d.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [cfg] = useData<any>("cfg");
  const [rawIncomes, setIncomes] = useData<any[]>("incomes");
  const [rawExpenses, setExpenses] = useData<any[]>("expenses");
  
  const [isIncModalOpen, setIsIncModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  
  const [incForm, setIncForm] = useState({ cat: INC_CATS[0], desc: "", amount: "", date: today() });
  const [expForm, setExpForm] = useState({ cat: EXP_CATS[0], desc: "", amount: "", date: today() });
  
  const [chartRange, setChartRange] = useState<"1d" | "1w" | "1m" | "3m" | "6m" | "1y">("3m");
  const [donutMonthOffset, setDonutMonthOffset] = useState(0);

  const [arsRate, setArsRate] = useState<string>("");
  const [showArs, setShowArs] = useState(false);

  const rate = showArs && Number(arsRate) > 0 ? Number(arsRate) : 1;
  const currency = showArs ? "ARS" : "USD";

  const incomes = useMemo(() => (rawIncomes || []).map(x => ({ ...x, amount: Number(x.amount) * rate })), [rawIncomes, rate]);
  const expenses = useMemo(() => (rawExpenses || []).map(x => ({ ...x, amount: Number(x.amount) * rate })), [rawExpenses, rate]);

  const goalMonthly = (cfg?.goalMonthly || 500) * rate;

  const curMonthPrefix = today().substring(0, 7); // YYYY-MM
  
  const mInc = incomes.filter((x: any) => x.date.startsWith(curMonthPrefix)).reduce((a: number, b: any) => a + b.amount, 0);
  const mExp = expenses.filter((x: any) => x.date.startsWith(curMonthPrefix)).reduce((a: number, b: any) => a + b.amount, 0);
  
  const totalInc = incomes.reduce((a: number, b: any) => a + b.amount, 0);
  const totalExp = expenses.reduce((a: number, b: any) => a + b.amount, 0);
  const balance = totalInc - totalExp;

  const goalPct = Math.min(100, Math.round((mInc / (goalMonthly || 1)) * 100));

  const dDate = new Date();
  dDate.setMonth(dDate.getMonth() + donutMonthOffset);
  const donutPrefix = `${dDate.getFullYear()}-${p2(dDate.getMonth() + 1)}`;
  const donutTitle = `${MSHORT[dDate.getMonth()].toUpperCase()} ${dDate.getFullYear()}`;

  const dInc = incomes.filter((x: any) => x.date.startsWith(donutPrefix));
  const dExp = expenses.filter((x: any) => x.date.startsWith(donutPrefix));

  const incByCat: Record<string, number> = {};
  dInc.forEach((x: any) => incByCat[x.cat] = (incByCat[x.cat] || 0) + x.amount);
  
  const expByCat: Record<string, number> = {};
  dExp.forEach((x: any) => expByCat[x.cat] = (expByCat[x.cat] || 0) + x.amount);
  
  const dTotalInc = Object.values(incByCat).reduce((a, b) => a + b, 0);
  const dTotalExp = Object.values(expByCat).reduce((a, b) => a + b, 0);

  const incData = Object.entries(incByCat).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value);
  const expData = Object.entries(expByCat).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value);

  const greenColors = ["#00ff88", "#00cc6a", "#00994d", "#006633", "#00331a"];
  const redColors = ["#ff0040", "#cc0033", "#990026", "#66001a", "#33000d"];

  const compData = [];
  const compColors = [];
  if (dTotalInc > 0) { compData.push({ label: "Ingresos", value: dTotalInc }); compColors.push("#00ff88"); }
  if (dTotalExp > 0) { compData.push({ label: "Gastos", value: dTotalExp }); compColors.push("#ff0040"); }

  const allTxs = useMemo(() => {
    const list = [
      ...incomes.map((i: any) => ({ ...i, type: "inc" })),
      ...expenses.map((e: any) => ({ ...e, type: "exp" }))
    ];
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, expenses]);

  const saveInc = () => {
    if (!incForm.amount) return;
    const desc = incForm.desc.trim() || incForm.cat;
    const newInc = { id: uid(), ...incForm, desc, amount: Number(incForm.amount) / rate };
    setIncomes([...(rawIncomes || []), newInc]);
    setIsIncModalOpen(false);
    setIncForm({ cat: INC_CATS[0], desc: "", amount: "", date: today() });
  };

  const saveExp = () => {
    if (!expForm.amount) return;
    const desc = expForm.desc.trim() || expForm.cat;
    const newExp = { id: uid(), ...expForm, desc, amount: Number(expForm.amount) / rate };
    setExpenses([...(rawExpenses || []), newExp]);
    setIsExpModalOpen(false);
    setExpForm({ cat: EXP_CATS[0], desc: "", amount: "", date: today() });
  };

  const delTx = (id: string, type: string) => {
    if (type === "inc") {
      setIncomes((rawIncomes || []).filter((x: any) => x.id !== id));
    } else {
      setExpenses((rawExpenses || []).filter((x: any) => x.id !== id));
    }
  };

  const renderChart = () => {
    const W = 600;
    const H = 130;
    const now = new Date();
    const pts = [];

    if (chartRange === '1d' || chartRange === '1w' || chartRange === '1m') {
      const days = chartRange === '1d' ? 1 : chartRange === '1w' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
        const cInc = incomes.filter((x: any) => x.date === v).reduce((a: number, b: any) => a + b.amount, 0);
        const cExp = expenses.filter((x: any) => x.date === v).reduce((a: number, b: any) => a + b.amount, 0);
        pts.push({ label: `${d.getDate()}/${d.getMonth()+1}`, saldo: cInc - cExp });
      }
    } else {
      const months = chartRange === '3m' ? 3 : chartRange === '6m' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const v = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
        const cInc = incomes.filter((x: any) => x.date.startsWith(v)).reduce((a: number, b: any) => a + b.amount, 0);
        const cExp = expenses.filter((x: any) => x.date.startsWith(v)).reduce((a: number, b: any) => a + b.amount, 0);
        pts.push({ label: MSHORT[d.getMonth()], saldo: cInc - cExp });
      }
    }

    if (pts.every(p => p.saldo === 0)) {
      return <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px 0", fontSize: "12px", fontWeight: 600 }}>Sin datos aún</div>;
    }

    const maxV = Math.max(...pts.map(p => p.saldo), 10);
    const minV = Math.min(...pts.map(p => p.saldo), 0);
    const pad = 50;
    const usableW = W - pad * 2;
    const usableH = H - 50;
    
    const toX = (i: number) => pad + i * (usableW / (pts.length - 1 || 1));
    const toY = (v: number) => 25 + usableH * (1 - (v - minV) / (maxV - minV || 1));
    
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.saldo)}`).join(' ');
    const areaD = pathD + ` L${toX(pts.length - 1)},${H - 20} L${toX(0)},${H - 20} Z`;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="finG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.35 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#finG)" />
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => {
          const isMany = pts.length > 15;
          const showLabel = !isMany || i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0;
          const showValue = !isMany || i === 0 || i === pts.length - 1 || (p.saldo === maxV && p.saldo !== 0) || (p.saldo === minV && p.saldo !== 0);

          return (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(p.saldo)} r={isMany ? "3" : "4"} fill="var(--accent)" stroke="#000" strokeWidth="2">
              <title>{p.label}: {currency} {Math.round(p.saldo).toLocaleString()}</title>
            </circle>
            {showLabel && (
              <text x={toX(i)} y={H - 5} textAnchor="middle" fill="var(--text3)" fontSize="10" fontWeight="600">{p.label}</text>
            )}
            {showValue && (
              <text x={toX(i)} y={toY(p.saldo) - 8} textAnchor="middle" fill={p.saldo >= 0 ? "var(--green)" : "var(--red)"} fontSize="8" fontWeight="700">
                {currency} {Math.round(Math.abs(p.saldo)).toLocaleString()}
              </text>
            )}
          </g>
        )})}
      </svg>
    );
  };

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div className="sec-title">FINANZAS</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--bg3)", borderRadius: "6px", padding: "4px 8px" }}>
            <span style={{ fontSize: "10px", color: "var(--text2)", marginRight: "6px", fontWeight: 600 }}>TASA ARS:</span>
            <input type="number" placeholder="Ej. 1200" style={{ background: "transparent", border: "none", color: "var(--text)", width: "100px", fontSize: "12px", outline: "none" }} value={arsRate} onChange={(e) => setArsRate(e.target.value)} />
          </div>
          <button className={`btn btn-sm ${showArs ? "btn-primary" : "btn-secondary"}`} style={{ opacity: !arsRate ? 0.5 : 1, pointerEvents: !arsRate ? "none" : "auto" }} onClick={() => setShowArs(!showArs)}>
            <i className="ti ti-currency-dollar"></i> {showArs ? "A USD" : "A ARS"}
          </button>
        </div>
        <div className="sec-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setIsExpModalOpen(true)}>
            <i className="ti ti-minus"></i> Gasto
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsIncModalOpen(true)}>
            <i className="ti ti-plus"></i> Ingreso
          </button>
        </div>
      </div>

      <div className="g4">
        <div className="panel">
          <div className="panel-head">BALANCE TOTAL</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: balance >= 0 ? "var(--text)" : "var(--red)", marginTop: "4px" }}>
            {currency} {Math.round(balance).toLocaleString()}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">INGRESOS DEL MES</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--green)", marginTop: "8px" }}>
            + {currency} {Math.round(mInc).toLocaleString()}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">GASTOS DEL MES</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--red)", marginTop: "8px" }}>
            - {currency} {Math.round(mExp).toLocaleString()}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">META MENSUAL</div>
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>{goalPct}%</span>
            <span style={{ fontSize: "10px", color: "var(--text2)" }}>{currency} {Math.round(goalMonthly).toLocaleString()}</span>
          </div>
          <div className="xp-track" style={{ height: "4px", marginTop: "8px", background: "var(--bg3)", borderRadius: "2px" }}>
            <div className="xp-fill" style={{ width: `${goalPct}%`, background: "var(--green)", height: "100%", borderRadius: "2px" }}></div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>FLUJO DE CAJA (NETO)</span>
          <select className="form-control" style={{ width: "auto", padding: "2px 6px", fontSize: "10px", height: "auto" }} value={chartRange} onChange={(e: any) => setChartRange(e.target.value)}>
            <option value="1d">Hoy</option>
            <option value="1w">1 Semana</option>
            <option value="1m">1 Mes</option>
            <option value="3m">3 Meses</option>
            <option value="6m">6 Meses</option>
            <option value="1y">1 Año</option>
          </select>
        </div>
        <div style={{ padding: "10px 0" }}>
          {renderChart()}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">HISTORIAL DE MOVIMIENTOS</div>
        {allTxs.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-coin"></i>
            <p>No hay ingresos ni gastos registrados.</p>
          </div>
        ) : (
          <div>
            {allTxs.map((tx: any) => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.desc}</span>
                    <span className={`tag ${tx.type === "inc" ? "tag-green" : "tag-red"}`} style={{ fontSize: "9px" }}>{tx.cat}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text2)" }}>{fmtD(tx.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: tx.type === "inc" ? "var(--green)" : "var(--red)" }}>
                    {tx.type === "inc" ? "+" : "-"} {currency} {Math.round(tx.amount).toLocaleString()}
                  </div>
                </div>
                <button className="btn-icon" onClick={() => delTx(tx.id, tx.type)} title="Eliminar">
                  <i className="ti ti-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: "16px" }}>
        <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>ANÁLISIS POR MES</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDonutMonthOffset(prev => prev - 1)}>‹ Mes</button>
            <span style={{ fontSize: "10px", fontWeight: 700, minWidth: "60px", textAlign: "center" }}>{donutTitle}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setDonutMonthOffset(prev => prev + 1)} style={{ opacity: donutMonthOffset >= 0 ? 0.5 : 1, pointerEvents: donutMonthOffset >= 0 ? "none" : "auto" }}>Mes ›</button>
          </div>
        </div>
        <div className="g3" style={{ marginTop: "16px", alignItems: "start" }}>
          <div className="panel" style={{ background: "var(--bg3)", border: "none" }}>
            <Donut data={expData} colors={redColors} title="GASTOS" subTitle={`${currency} ${Math.round(dTotalExp).toLocaleString()}`} currency={currency} />
          </div>
          <div className="panel" style={{ background: "var(--bg3)", border: "none" }}>
            <Donut data={compData} colors={compColors} title="RESUMEN NETO" subTitle={dTotalInc - dTotalExp >= 0 ? `+${Math.round(dTotalInc - dTotalExp).toLocaleString()}` : `${Math.round(dTotalInc - dTotalExp).toLocaleString()}`} currency={currency} />
          </div>
          <div className="panel" style={{ background: "var(--bg3)", border: "none" }}>
            <Donut data={incData} colors={greenColors} title="INGRESOS" subTitle={`${currency} ${Math.round(dTotalInc).toLocaleString()}`} currency={currency} />
          </div>
        </div>
      </div>

      {isIncModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ width: "350px" }}>
            <div className="modal-title">REGISTRAR INGRESO</div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-control" value={incForm.cat} onChange={e => setIncForm({ ...incForm, cat: e.target.value })}>
                {INC_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-control" placeholder="Ej. Sueldo mensual" value={incForm.desc} onChange={e => setIncForm({ ...incForm, desc: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Monto ({currency})</label>
              <input type="number" className="form-control" placeholder="0" value={incForm.amount} onChange={e => setIncForm({ ...incForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" value={incForm.date} onChange={e => setIncForm({ ...incForm, date: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setIsIncModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={saveInc}>Guardar Ingreso</button>
            </div>
          </div>
        </div>
      )}

      {isExpModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ width: "350px" }}>
            <div className="modal-title">REGISTRAR GASTO</div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-control" value={expForm.cat} onChange={e => setExpForm({ ...expForm, cat: e.target.value })}>
                {EXP_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-control" placeholder="Ej. Compra supermercado" value={expForm.desc} onChange={e => setExpForm({ ...expForm, desc: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Monto ({currency})</label>
              <input type="number" className="form-control" placeholder="0" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setIsExpModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", background: "var(--red)" }} onClick={saveExp}>Registrar Gasto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
