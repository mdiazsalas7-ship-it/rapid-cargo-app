'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Check, X, Shield, Search, Truck, Eye } from 'lucide-react';

interface Usuario { 
  id: string; nombre: string; email: string; rol: string; documentos_verificados: boolean; tipoVehiculo?: string; placa?: string; licencia?: string; 
  urlLicencia?: string; urlRegistro?: string; // Campos nuevos
}

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  // Estado para el modal de visualización de fotos
  const [fotoActiva, setFotoActiva] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("rol", "==", "CHOFER"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Usuario[] = [];
      snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  const toggleAprobacion = async (id: string, estadoActual: boolean) => {
    await updateDoc(doc(db, "usuarios", id), {
      documentos_verificados: !estadoActual
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 pb-20 text-white font-sans relative">
      
      {/* MODAL PARA VER FOTOS */}
      {fotoActiva && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFotoActiva(null)}>
          <button className="absolute top-4 right-4 bg-white text-black p-2 rounded-full font-bold">CERRAR</button>
          <img src={fotoActiva} alt="Documento" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border-2 border-white" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-yellow-400 p-3 rounded-xl text-slate-900 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
          <Shield className="w-8 h-8" />
        </div>
        <div><h1 className="text-2xl font-black tracking-tight">TORRE DE CONTROL</h1><p className="text-slate-400 text-sm">Rapid Cargo Admin</p></div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-6 flex items-center gap-3 border border-slate-700">
        <Search className="text-slate-500" />
        <input type="text" placeholder="Buscar por placa o nombre..." className="bg-transparent outline-none w-full text-white placeholder-slate-500" />
      </div>

      <h2 className="text-slate-400 font-bold text-sm uppercase mb-4 tracking-wider">Solicitudes de Choferes ({usuarios.length})</h2>

      <div className="space-y-4">
        {usuarios.map((u) => (
          <div key={u.id} className={`p-5 rounded-2xl border transition-all ${u.documentos_verificados ? 'bg-slate-800 border-slate-700 opacity-60' : 'bg-slate-800 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center"><Truck className="text-slate-400 w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">{u.nombre}</h3>
                  <div className="flex gap-2">
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-mono text-yellow-400 border border-slate-600">{u.placa || 'N/A'}</span>
                    <span className="text-xs text-slate-400 mt-0.5 uppercase">{u.tipoVehiculo}</span>
                  </div>
                </div>
              </div>
              {u.documentos_verificados ? <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">ACTIVO</span> : <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30 animate-pulse">PENDIENTE</span>}
            </div>

            <div className="bg-slate-900/50 p-3 rounded-lg mb-4 text-sm text-slate-400 border border-slate-700/50 grid grid-cols-2 gap-2">
              <div><span className="block text-[10px] uppercase font-bold text-slate-500">Licencia</span>{u.licencia || '---'}</div>
              <div><span className="block text-[10px] uppercase font-bold text-slate-500">Email</span>{u.email}</div>
            </div>

            {/* BOTONES PARA VER DOCUMENTOS */}
            <div className="flex gap-2 mb-4">
               {u.urlLicencia && (
                 <button onClick={() => setFotoActiva(u.urlLicencia!)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-xs text-white py-2 rounded-lg flex items-center justify-center gap-1"><Eye className="w-3 h-3"/> LICENCIA</button>
               )}
               {u.urlRegistro && (
                 <button onClick={() => setFotoActiva(u.urlRegistro!)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-xs text-white py-2 rounded-lg flex items-center justify-center gap-1"><Eye className="w-3 h-3"/> REGISTRO</button>
               )}
            </div>

            <button 
                onClick={() => toggleAprobacion(u.id, u.documentos_verificados)}
                className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-colors ${u.documentos_verificados ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20'}`}
              >
                {u.documentos_verificados ? <><X className="w-4 h-4" /> BLOQUEAR ACCESO</> : <><Check className="w-4 h-4" /> APROBAR CONDUCTOR</>}
            </button>
          </div>
        ))}
        {usuarios.length === 0 && <p className="text-center text-slate-600 py-10">No hay choferes registrados aún.</p>}
      </div>
    </div>
  );
}