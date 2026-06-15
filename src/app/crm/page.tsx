"use client";

import { useState, useMemo, useEffect } from "react";
import { useData } from "@/lib/db";
import { today, uid, fmtD, p2, MSHORT } from "@/lib/utils";

export default function CrmPage() {
  const [cfg] = useData<any>("cfg");
  const [rawSales, setSales] = useData<any[]>("sales");

  const [arsRate, setArsRate] = useState<string>("");
  const [showArs, setShowArs] = useState(false);

  const [filterMonth, setFilterMonth] = useState(today().substring(0, 7));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({ company: "", client: "", product: "", price: "", cost: "", mycut: "", date: today() });

  // Update default company once cfg is loaded
  useEffect(() => {
    if (cfg?.e1 && !form.company) {
      setForm(f => ({ ...f, company: cfg.e1 }));
    }
  }, [cfg]);

  const rate = showArs && Number(arsRate) > 0 ? Number(arsRate) : 1;
  const currency = showArs ? "ARS" : "USD";

  const sales = useMemo(() => (rawSales || []).map(x => ({ 
    ...x, 
    price: Number(x.price || 0) * rate,
    cost: Number(x.cost || 0) * rate,
    mycut: Number(x.mycut || 0) * rate
  })), [rawSales, rate]);

  const goalMonthly = (cfg?.goalMonthly || 500) * rate;

  const fSales = sales.filter(s => filterMonth ? s.date.startsWith(filterMonth) : true);
  const totRev = fSales.reduce((a, b) => a + b.price, 0);
  const totProfit = fSales.reduce((a, b) => a + (b.mycut || 0), 0);
  const avgTicket = fSales.length ? Math.round(totRev / fSales.length) : 0;
  const goalPct = goalMonthly > 0 ? Math.min(100, Math.round((totProfit / goalMonthly) * 100)) : 0;
  
  const yrProfit = sales.filter(s => s.date.startsWith(String(new Date().getFullYear()))).reduce((a, b) => a + (b.mycut || 0), 0);

  const cos = [
    { n: cfg?.e1, c: 'var(--blue)' },
    { n: cfg?.e2, c: 'var(--amber)' },
    { n: cfg?.e3, c: 'var(--accent)' }
  ].filter(x => x.n && x.n.trim() !== "");

  const saveSale = () => {
    if (!form.price && !form.mycut) {
      alert("Debes ingresar el Precio Cobrado o tu Ganancia Libre para registrar la venta.");
      return;
    }
    const newSale = {
      id: uid(),
      company: form.company || cos[0]?.n || "",
      client: form.client,
      product: form.product,
      price: Number(form.price) / rate,
      cost: Number(form.cost) / rate,
      mycut: Number(form.mycut) / rate,
      date: form.date || today()
    };
    setSales([...(rawSales || []), newSale]);
    setIsModalOpen(false);
    setForm({ company: cfg?.e1 || "", client: "", product: "", price: "", cost: "", mycut: "", date: today() });
  };

  const deleteSale = (id: string) => {
    if (!confirm('¿Eliminar venta?')) return;
    setSales((rawSales || []).filter((s: any) => s.id !== id));
  };

  // Build month options for filter
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
    const label = `${MSHORT[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
    monthOptions.push({ val, label });
  }

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div className="sec-title">CRM EMPRESAS</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto" }}>
          <select className="form-control" style={{ width: "auto", padding: "2px 6px", fontSize: "10px", height: "auto" }} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">Todos los meses</option>
            {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", background: "var(--bg3)", borderRadius: "6px", padding: "4px 8px" }}>
            <span style={{ fontSize: "10px", color: "var(--text2)", marginRight: "6px", fontWeight: 600 }}>TASA ARS:</span>
            <input type="number" placeholder="Ej. 1200" style={{ background: "transparent", border: "none", color: "var(--text)", width: "100px", fontSize: "12px", outline: "none" }} value={arsRate} onChange={(e) => setArsRate(e.target.value)} />
          </div>
          <button className={`btn btn-sm ${showArs ? "btn-primary" : "btn-secondary"}`} style={{ opacity: !arsRate ? 0.5 : 1, pointerEvents: !arsRate ? "none" : "auto" }} onClick={() => setShowArs(!showArs)}>
            <i className="ti ti-currency-dollar"></i> {showArs ? "A USD" : "A ARS"}
          </button>
        </div>
        <div className="sec-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            <i className="ti ti-plus"></i> Nueva Venta
          </button>
        </div>
      </div>

      <div className="g4">
        <div className="panel" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
          <div className="panel-head" style={{ color: "var(--green)" }}>MI GANANCIA ESTE MES</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--green)", marginTop: "4px" }}>
            {currency} {Math.round(totProfit).toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", opacity: 0.8 }}>
            {fSales.length} ventas completadas
          </div>
        </div>
        <div className="panel" style={{ borderColor: "rgba(0,136,255,0.2)" }}>
          <div className="panel-head" style={{ color: "var(--blue)" }}>FACTURADO MES</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--blue)", marginTop: "4px" }}>
            {currency} {Math.round(totRev).toLocaleString()}
          </div>
        </div>
        <div className="panel" style={{ borderColor: "rgba(255,170,0,0.2)" }}>
          <div className="panel-head" style={{ color: "var(--amber)" }}>TICKET PROMEDIO</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--amber)", marginTop: "4px" }}>
            {currency} {Math.round(avgTicket).toLocaleString()}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">MI GANANCIA AÑO</div>
          <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "8px" }}>
            {currency} {Math.round(yrProfit).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "16px" }}>
        <div className="panel-head">META MENSUAL GLOBAL</div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "10px" }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "56px",
            fontWeight: 900,
            color: goalPct >= 100 ? "var(--green)" : "var(--accent)",
            textShadow: `0 0 30px ${goalPct >= 100 ? 'rgba(0,255,136,0.4)' : 'rgba(255,0,64,0.4)'}`
          }}>
            {goalPct}%
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "8px" }}>
              Obj: <strong style={{ color: "var(--text)" }}>{currency} {Math.round(goalMonthly).toLocaleString()}</strong> · Logrado: <strong style={{ color: goalPct >= 100 ? "var(--green)" : "var(--text)" }}>{currency} {Math.round(totProfit).toLocaleString()}</strong>
            </div>
            <div style={{ height: "10px", background: "var(--bg3)", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ height: "100%", width: `${goalPct}%`, background: `linear-gradient(90deg, var(--accent), ${goalPct >= 100 ? 'var(--green)' : 'var(--accent)'})`, borderRadius: "5px", transition: "width 0.8s" }}></div>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "6px" }}>
              Restante: <strong style={{ color: "var(--amber)" }}>{currency} {Math.max(0, Math.round(goalMonthly - totProfit)).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        {cos.map((co, i) => {
          const cSales = fSales.filter(s => s.company === co.n);
          const cRev = cSales.reduce((a, b) => a + b.price, 0);
          const cProfit = cSales.reduce((a, b) => a + (b.mycut || 0), 0);

          return (
            <div className="panel" key={i} style={{ borderColor: co.c.replace('var(--', 'rgba(').replace(')', ',0.4)'), marginBottom: "16px" }}>
              <div className="panel-head" style={{ color: co.c }}>
                {co.n}
                <div className="panel-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "12px", color: "var(--green)", fontWeight: 700 }}>
                    {currency} {Math.round(cProfit).toLocaleString()}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--text2)", marginLeft: "4px" }}>mi ganancia</span>
                </div>
              </div>
              
              {cSales.length > 0 ? (
                <>
                  <div style={{ overflowX: "auto", marginTop: "10px" }}>
                    <table style={{ width: "100%", textAlign: "left", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ color: "var(--text2)", borderBottom: "1px solid var(--bg3)" }}>
                          <th style={{ padding: "8px 4px" }}>Fecha</th>
                          <th style={{ padding: "8px 4px" }}>Cliente</th>
                          <th style={{ padding: "8px 4px" }}>Producto</th>
                          <th style={{ padding: "8px 4px" }}>Precio</th>
                          <th style={{ padding: "8px 4px" }}>Costo</th>
                          <th style={{ padding: "8px 4px" }}>Ganancia</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cSales.slice().reverse().map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--bg3)" }}>
                            <td style={{ padding: "8px 4px" }}>{fmtD(s.date)}</td>
                            <td style={{ padding: "8px 4px" }}>{s.client || '—'}</td>
                            <td style={{ padding: "8px 4px", color: "var(--text2)" }}>{s.product || '—'}</td>
                            <td style={{ padding: "8px 4px" }}>{currency} {Math.round(s.price).toLocaleString()}</td>
                            <td style={{ padding: "8px 4px", color: "var(--text2)" }}>{currency} {Math.round(s.cost).toLocaleString()}</td>
                            <td style={{ padding: "8px 4px", color: "var(--green)", fontWeight: 700 }}>{currency} {Math.round(s.mycut).toLocaleString()}</td>
                            <td style={{ padding: "8px 4px", textAlign: "right" }}>
                              <button className="btn-icon" onClick={() => deleteSale(s.id)} title="Eliminar">
                                <i className="ti ti-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", borderTop: "1px solid #111", marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text2)" }}>{cSales.length} ventas · Facturado: {currency} {Math.round(cRev).toLocaleString()}</span>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "12px", fontWeight: 700, color: "var(--green)" }}>+{currency} {Math.round(cProfit).toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: "14px" }}>
                  <p>Sin ventas este mes</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">NUEVA VENTA</div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><i className="ti ti-x"></i></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <select className="form-control" value={form.company} onChange={e => setForm({...form, company: e.target.value})}>
                {cos.map(co => <option key={co.n} value={co.n}>{co.n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Cliente / Detalles</label>
              <input type="text" className="form-control" value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="Ej. Juan Pérez" />
            </div>
            <div className="form-group">
              <label className="form-label">Producto / Servicio</label>
              <input type="text" className="form-control" value={form.product} onChange={e => setForm({...form, product: e.target.value})} placeholder="Ej. Pack Redes Sociales" />
            </div>
            
            <div className="g3" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label className="form-label">Precio Cobrado ({currency})</label>
                <input type="number" className="form-control" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Costo Externo ({currency})</label>
                <input type="number" className="form-control" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Mi Ganancia Libre ({currency})</label>
                <input type="number" className="form-control" value={form.mycut} onChange={e => setForm({...form, mycut: e.target.value})} placeholder="0" />
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }} onClick={saveSale}>
              <i className="ti ti-check"></i> Registrar Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
