'use client';

import React, { useState } from 'react';
import { Truck, User, Phone, Star, ArrowRight, Loader2, MapPin, Box } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const TARIFAS = [
  { id: 'moto', nombre: 'Moto Express', base: 4.50, porKm: 0.60, cap: 'Paquete peq.' },
  { id: 'auto', nombre: 'Auto Sedán', base: 6.00, porKm: 0.80, cap: 'Paquetería' },
  { id: 'panel', nombre: 'Panel', base: 25, porKm: 1.5, cap: '800kg' },
  { id: 'npr', nombre: 'Camión NPR', base: 60, porKm: 2.5, cap: '4.5T' },
  { id: 'mula', nombre: 'Mula / Cont.', base: 150, porKm: 4.5, cap: '20T' },
];

interface SelectorProps { distanciaKm: number; }

export default function VehicleSelector({ distanciaKm }: SelectorProps) {
  const [selected, setSelected] = useState('moto');
  const [estado, setEstado] = useState<'IDLE' | 'DETALLES' | 'BUSCANDO' | 'ENCONTRADO'>('IDLE');
  const [loading, setLoading] = useState(false);
  
  // DATOS COMPLETOS DEL ENVÍO
  const [envio, setEnvio] = useState({
    descripcion: '',
    peso: 'Paquete Pequeño',
    dirOrigen: '',
    dirDestino: '',
    nombreRecibe: '',
    telefonoRecibe: ''
  });

  const getPrecio = (id: string) => {
    const v = TARIFAS.find(t => t.id === id);
    if (!v) return 0;
    return Math.floor(v.base + (distanciaKm * v.porKm));
  };

  const confirmarPedido = async () => {
    // Validación simple
    if(!envio.dirOrigen || !envio.dirDestino || !envio.descripcion) {
      alert("Por favor completa las direcciones y descripción.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "viajes"), {
        tipo_vehiculo: selected,
        precio_estimado: getPrecio(selected),
        distancia_km: distanciaKm,
        
        // DATOS DE LOGÍSTICA REALES
        descripcion_carga: envio.descripcion,
        peso_carga: envio.peso,
        direccion_recogida: envio.dirOrigen,
        direccion_entrega: envio.dirDestino,
        persona_recibe: envio.nombreRecibe,
        telefono_recibe: envio.telefonoRecibe,
        
        estado: "PENDIENTE",
        fecha_creacion: new Date(),
        cliente_nombre: "Cliente Registrado" // Aquí iría el nombre real del usuario logueado
      });
      
      setEstado('BUSCANDO');
      // Simulamos espera
      setTimeout(() => { setEstado('ENCONTRADO'); setLoading(false); }, 4000);

    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el pedido");
      setLoading(false);
    }
  };

  // --- VISTA: FORMULARIO DE DETALLES (El más importante) ---
  if (estado === 'DETALLES') {
    return (
      <div className="w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-20 animate-in slide-in-from-bottom-10 h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-slate-900">Datos del Envío</h3>
          <button onClick={() => setEstado('IDLE')} className="text-sm text-red-500 font-bold">Cancelar</button>
        </div>
        
        <div className="space-y-4">
          
          {/* SECCIÓN 1: QUÉ LLEVAS */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Box className="w-3 h-3"/> La Carga</h4>
            <textarea 
              className="w-full bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 text-sm" 
              placeholder="Describa detalladamente (Ej: 2 Cajas de zapatos y un sobre)" 
              rows={2}
              onChange={(e) => setEnvio({...envio, descripcion: e.target.value})}
            />
            <select 
              className="w-full bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 mt-2 text-sm"
              onChange={(e) => setEnvio({...envio, peso: e.target.value})}
            >
               <option>Paquete Pequeño (Moto)</option>
               <option>Cajas Medianas (Auto)</option>
               <option>Carga Pesada (Panel/Camión)</option>
            </select>
          </div>

          {/* SECCIÓN 2: DIRECCIONES */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Direcciones Exactas</h4>
            
            <div className="mb-3">
              <label className="text-[10px] font-bold text-green-600 uppercase">Punto A: Recogida</label>
              <input 
                type="text" 
                className="w-full bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 text-sm"
                placeholder="Ej: Zona Libre, Galera 45, Puerta 2"
                onChange={(e) => setEnvio({...envio, dirOrigen: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-red-600 uppercase">Punto B: Entrega</label>
              <input 
                type="text" 
                className="w-full bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 text-sm"
                placeholder="Ej: Costa del Este, PH Regalia, Apto 5B"
                onChange={(e) => setEnvio({...envio, dirDestino: e.target.value})}
              />
            </div>
          </div>

          {/* SECCIÓN 3: CONTACTO */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><User className="w-3 h-3"/> ¿Quién Recibe?</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 text-sm"
                placeholder="Nombre"
                onChange={(e) => setEnvio({...envio, nombreRecibe: e.target.value})}
              />
              <input 
                type="tel" 
                className="flex-1 bg-white p-3 rounded-lg text-slate-900 outline-none border border-gray-200 text-sm"
                placeholder="Teléfono"
                onChange={(e) => setEnvio({...envio, telefonoRecibe: e.target.value})}
              />
            </div>
          </div>

          <button onClick={confirmarPedido} disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2 shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : <>CONFIRMAR ENVÍO <ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
      </div>
    );
  }

  // VISTA: BUSCANDO
  if (estado === 'BUSCANDO') {
    return (
      <div className="w-full bg-white rounded-t-3xl shadow-2xl p-8 pb-12 text-center animate-in fade-in">
        <div className="mx-auto w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-bold text-slate-900">Asignando unidad...</h3>
        <p className="text-gray-500 mt-2 text-sm">Enviando detalles a conductores de {TARIFAS.find(t=>t.id===selected)?.nombre}.</p>
      </div>
    );
  }

  // VISTA: ENCONTRADO
  if (estado === 'ENCONTRADO') {
    return (
      <div className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-6 pb-8 animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-4">
            <div><h3 className="text-green-600 font-bold text-sm uppercase">¡Unidad Asignada!</h3><h2 className="text-2xl font-black text-slate-900">En camino</h2></div>
            <div className="bg-slate-100 p-2 rounded-full"><Truck className="w-6 h-6 text-slate-800" /></div>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white shadow-sm"><User className="w-8 h-8 text-gray-500" /></div>
            <div className="flex-1"><h4 className="font-bold text-slate-900">Roberto González</h4><div className="flex items-center gap-1 text-yellow-500"><Star className="w-4 h-4 fill-current" /><span className="text-sm font-bold text-slate-700">4.9</span></div></div>
            <div className="text-right"><span className="bg-yellow-200 text-slate-900 font-mono font-bold px-2 py-1 rounded text-xs">AB-5590</span></div>
        </div>
        <button className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Phone className="w-5 h-5" /> Llamar Chofer</button>
      </div>
    );
  }

  // VISTA: SELECCIÓN DE VEHÍCULO
  return (
    <div className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 font-sans z-50 relative pb-6">
      <div className="w-full flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>{distanciaKm > 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">{distanciaKm} km de ruta</span>}</div>
      <div className="flex gap-4 px-6 overflow-x-auto pb-4 pt-2">
        {TARIFAS.map((v) => (
            <button key={v.id} onClick={() => setSelected(v.id)} className={`flex flex-col items-center min-w-[90px] transition-all ${selected === v.id ? 'scale-105 opacity-100' : 'opacity-60'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${selected === v.id ? 'bg-slate-900 ring-4 ring-yellow-400' : 'bg-gray-100'}`}><Truck className={`w-8 h-8 ${selected === v.id ? 'text-white' : 'text-gray-400'}`} /></div>
              <span className="text-sm font-bold text-slate-900">{v.nombre}</span>
              <span className="text-[10px] text-gray-400">{v.cap}</span>
            </button>
        ))}
      </div>
      <div className="px-6">
        <button onClick={() => setEstado('DETALLES')} className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black py-4 rounded-xl text-lg shadow-lg flex justify-between px-6 items-center">
          <span>CONTINUAR</span><span className="text-xl">${getPrecio(selected)}.00</span>
        </button>
      </div>
    </div>
  );
}