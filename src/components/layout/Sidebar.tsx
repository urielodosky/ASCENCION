"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/lib/db";
import { getLvlInfo, getRank } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [totalXP] = useData<number>("totalXP");
  const [cfg] = useData<any>("cfg");
  const [timeStr, setTimeStr] = useState<string>("--:--");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    const handleFlashSave = () => {
      const el = document.getElementById("save-flash");
      if (el) {
        el.classList.add("on");
        clearTimeout((el as any)._t);
        (el as any)._t = setTimeout(() => el.classList.remove("on"), 1800);
      }
    };
    window.addEventListener("pa8_flash_save", handleFlashSave);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pa8_flash_save", handleFlashSave);
    };
  }, []);

  const { lvl, currentXP, requiredXP, pct } = getLvlInfo(totalXP);
  const rank = getRank(lvl);

  const navItems = [
    { section: "Principal" },
    { name: "Dashboard", href: "/dashboard", icon: "ti-layout-dashboard" },
    { name: "Entrenamiento", href: "/training", icon: "ti-barbell" },
    { name: "Calendario", href: "/calendar", icon: "ti-calendar" },
    { name: "Hábitos", href: "/habits", icon: "ti-checks" },
    
    { section: "Salud & Dinero" },
    { name: "Nutrición", href: "/nutrition", icon: "ti-salad" },
    { name: "Finanzas", href: "/finance", icon: "ti-coin" },
    { name: "Empresas", href: "/crm", icon: "ti-building-skyscraper" },
    
    { section: "Personal" },
    { name: "Notas", href: "/notes", icon: "ti-notes" },
    
    { section: "Estudio" },
    { name: "Biblia", href: "/bible", icon: "ti-book" },
    { name: "Facultad", href: "/study", icon: "ti-school" },
    
    { section: "Análisis" },
    { name: "Estadísticas", href: "/stats", icon: "ti-chart-dots-3" },
    { name: "Logros", href: "/achievements", icon: "ti-trophy" },
    { name: "Social", href: "/social", icon: "ti-users" },
    
    { section: "Sistema" },
    { name: "Configuración", href: "/config", icon: "ti-adjustments-horizontal" },
  ];

  return (
    <div className="sidebar" id="sidebar">
      <style dangerouslySetInnerHTML={{__html: `
        .user-profile-area {
            padding: 12px 10px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
            overflow: hidden;
            flex-shrink: 0;
        }
        .profile-pic {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background-color: var(--bg3);
            background-size: cover;
            background-position: center;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .sidebar:hover .profile-pic {
            width: 32px;
            height: 32px;
        }
        .sidebar:not(:hover) .profile-info-text {
            display: none;
        }
        .profile-info-text {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .sidebar:not(:hover) .xp-details,
        .sidebar:not(:hover) .xp-track {
            display: none;
        }
        .sidebar:not(:hover) .xp-top {
            justify-content: center;
        }
        .sidebar:not(:hover) .xp-lvl {
            font-size: 14px;
        }
      `}} />

      <div className="logo-area">
        <div className="logo-icon"><i className="ti ti-bolt"></i></div>
        <div className="logo-title-text">
          <div className="logo-title">{cfg.appName || "ASCENSION"}</div>
          <div className="logo-sub">v7.0 // ETERNAL</div>
        </div>
      </div>

      <div className="user-profile-area">
        <div className="profile-pic" style={{ backgroundImage: cfg.profilePic ? `url(${cfg.profilePic})` : 'none' }}>
          {!cfg.profilePic && <i className="ti ti-user" style={{ fontSize: '14px', color: 'var(--text2)' }}></i>}
        </div>
        <div className="profile-info-text">
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {cfg.name || "Usuario"}
          </div>
          <Link href="/profile" style={{ fontSize: '9px', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <i className="ti ti-edit"></i> Editar perfil
          </Link>
        </div>
      </div>

      <div className="xp-wrap">
        <div className="xp-top">
          <span className="xp-lvl">LVL {lvl}</span>
          <span className="xp-rank xp-details">{rank.name}</span>
        </div>
        <div className="xp-details" style={{ fontSize: "10px", color: "var(--text2)", marginBottom: "4px", textAlign: "right" }}>
          {currentXP} / {requiredXP} XP
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${pct}%`, background: rank.color }}></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={`sec-${i}`} className="nav-section">{item.section}</div>;
          }
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link 
              key={item.href} 
              href={item.href!} 
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <i className={`ti ${item.icon}`}></i>
              <span className="nav-item-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-row">
          <span className="status-dot"></span>
          <span className="status-text">SISTEMA ACTIVO</span>
        </div>
        <div className="clock-display">{timeStr}</div>
        <div className="save-flash">�S GUARDADO</div>
      </div>
    </div>
  );
}

