"use client";

import { useData } from "@/lib/db";
import { useState } from "react";

export default function ProfilePage() {
  const [cfg, setCfg] = useData<any>("cfg");
  const [name, setName] = useState(cfg?.name || "");
  const [profilePic, setProfilePic] = useState(cfg?.profilePic || "");
  const [age, setAge] = useState(cfg?.age || 25);
  const [weight, setWeight] = useState(cfg?.peso || 80);
  const [height, setHeight] = useState(cfg?.height || 175);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCfg({ ...cfg, name, profilePic, age, peso: weight, height });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">PERFIL Y REGISTRO</div>
      </div>
      
      <div className="panel">
        <div className="panel-head">Datos Personales</div>
        
        <div className="form-group">
          <label className="form-label">Nombre de Usuario</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Tu nombre"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Foto de Perfil</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg3)', backgroundImage: profilePic ? `url(${profilePic})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!profilePic && <i className="ti ti-user" style={{ color: 'var(--text2)' }}></i>}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input 
                type="text" 
                value={profilePic} 
                onChange={(e) => setProfilePic(e.target.value)} 
                placeholder="URL de la imagen (o sube una archivo)"
              />
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="ti ti-upload"></i> Subir imagen local
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const img = new window.Image();
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const MAX_SIZE = 150;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                          if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                          }
                        } else {
                          if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                          }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx?.drawImage(img, 0, 0, width, height);
                        setProfilePic(canvas.toDataURL("image/jpeg", 0.8));
                      };
                      img.src = ev.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-row3">
          <div className="form-group">
            <label className="form-label">Edad</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Peso (kg)</label>
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Altura (cm)</label>
            <input 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(Number(e.target.value))} 
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: '10px' }}>
          <i className="ti ti-device-floppy"></i> {saved ? "Guardado" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
