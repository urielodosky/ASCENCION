"use client";

import { useState } from "react";

export default function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
  className = "",
  style = {},
  colorClass = "" // e.g. "panel-green", "panel-amber"
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  colorClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`panel ${colorClass} ${className}`} style={{ ...style, marginBottom: "16px" }}>
      <div 
        className="panel-head" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ cursor: "pointer", marginBottom: isOpen ? "14px" : "0", transition: "margin 0.2s ease" }}
      >
        <span style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px",
          transition: "all 0.3s ease",
          fontSize: isOpen ? "inherit" : "16px",
          color: isOpen ? "inherit" : "var(--accent)",
          textShadow: isOpen ? "none" : "0 0 15px rgba(255, 0, 64, 0.6)",
          fontFamily: isOpen ? "inherit" : "'Outfit', sans-serif",
          textTransform: isOpen ? "inherit" : "uppercase",
          letterSpacing: isOpen ? "inherit" : "1px",
          fontWeight: isOpen ? "inherit" : 800
        }}>
          {title}
        </span>
        <i 
          className="ti ti-chevron-down" 
          style={{ 
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            marginLeft: "8px",
            fontSize: "14px",
            color: "var(--text2)"
          }}
        />
      </div>
      
      {isOpen && (
        <div 
          className="panel-body" 
          style={{ 
            animation: "fadeIn 0.2s ease"
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
