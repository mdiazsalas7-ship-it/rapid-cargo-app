'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore'; // Agregamos increment
import { Truck, Package, Clock, CheckCircle, Navigation, MapPin, Phone, User, FileText, ShieldCheck, Star } from 'lucide-react'; // Agregamos Star

interface DashboardProps {
  usuario: any;
}

interface Viaje { id: string; descripcion_carga: string; distancia_km: number; precio_estimado: number; tipo_vehiculo: string; estado: string; direccion_recogida?: string; direccion_entrega?: string; persona_recibe?: string; telefono_recibe?: string; peso_carga?: string; lat_origen?: number; lng_origen?: number; lat_destino?: number; lng_destino?: number; }

export default function DriverDashboard({ usuario }: DashboardProps) {
  // 1. ESTADOS
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [viajeActivo, setViajeActivo] = useState<Viaje | null>(null);
  
  // ESTADOS NUEVOS PARA CALIFICACIÓN
  const [calificando, setCalificando] = useState(false);
  const [estrellas, setEstrellas] = useState(0);

  // 2. EFECTO DE CARGA
  useEffect(() => {
    const q = query(collection(db, "viajes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Viaje[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({ 
          id: doc.id, 
          ...data,
          lat_origen: data.lat_origen || 8.9824, 
          lng_origen: data.lng_origen || -79.5199,
          lat_destino: data.lat_destino || 9.0824, 
          lng_destino: data.lng_destino || -79.4199
        } as Viaje);
      });
      setViajes(lista.filter(v => v.estado === 'PENDIENTE'));
      const activo = lista.find(v => v.estado === 'ACEPTADO');
      if (activo) setViajeActivo(activo);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const aceptarViaje = async (id: string) => {
    // Al aceptar, guardamos también ID y Nombre del chofer en el viaje
    await updateDoc(doc(db, "viajes", id), { 
      estado: "ACEPTADO", 
      chofer_asignado: usuario.nombre,
      chofer_id: usuario.uid 
    });
  };

  const finalizarViaje = async () => {
    // MODIFICADO: En lugar de cerrar directo, abrimos modal de calificación
    setCalificando(true);
  };

  // NUEVA FUNCIÓN: Guarda calificación y cierra el viaje
  const enviarCalificacion = async () => {
    if (!viajeActivo || estrellas === 0) return;
    
    // 1. Finalizar Viaje en DB
    await updateDoc(doc(db, "viajes", viajeActivo.id), { 
      estado: "FINALIZADO",
      calificacion_cliente: estrellas 
    });

    // 2. Actualizar contador de viajes del Chofer (Estadísticas)
    if (usuario.uid) {
        await updateDoc(doc(db, "usuarios", usuario.uid), {
            viajes_completados: increment(1)
        });
    }

    alert("¡Viaje completado exitosamente!");
    setCalificando(false);
    setEstrellas(0);
    setViajeActivo(null);
  };

  const abrirGPS = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // 3. BLOQUEO DE SEGURIDAD
  if (!usuario.documentos_verificados) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Cuenta en Revisión</h2>
          <p className="text-gray-500 mb-6">
            Hola <b>{usuario.nombre}</b>. Tu perfil y documentos están siendo validados por nuestro equipo de seguridad.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-left mb-6">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Estatus Actual:</h4>
            <ul className="space-y-2 text-gray-500">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Registro completado</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500"/> Validación de Licencia</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500"/> Aprobación Final</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400">Te notificaremos cuando estés activo.</p>
        </div>
      </div>
    );
  }

  // 4. DASHBOARD (Panel Principal)
  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 relative">
      
      {/* --- MODAL DE CALIFICACIÓN --- */}
      {calificando && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">¡Entrega Exitosa!</h2>
            <p className="text-gray-500 mb-6 text-sm">El viaje ha finalizado. Por favor califica al cliente:</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setEstrellas(star)} className="transition-transform hover:scale-110 focus:outline-none">
                  <Star className={`w-10 h-10 ${star <= estrellas ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>

            <button 
              onClick={enviarCalificacion} 
              disabled={estrellas === 0} 
              className={`w-full font-bold py-4 rounded-xl transition-all ${estrellas > 0 ? 'bg-slate-900 text-white shadow-lg transform active:scale-95' : 'bg-gray-100 text-gray-400'}`}
            >
              FINALIZAR ORDEN
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl mb-6 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/v89jzD58/rapid-cargo.jpg" alt="Logo" className="h-10 w-10 rounded-full border-2 border-white" />
            <div><h1 className="text-xl font-bold leading-tight">Rapid Cargo</h1><p className="text-slate-400 text-xs">Conductor: {usuario.nombre}</p></div>
          </div>
          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50 animate-pulse">EN LÍNEA</div>
        </div>
      </div>

      {/* --- MODO VIAJE ACTIVO --- */}
      {viajeActivo && !calificando && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-green-500 mb-6 overflow-hidden animate-in zoom-in">
          <div className="bg-green-500 p-4 text-white flex justify-between items-center">
             <h2 className="font-black text-lg flex items-center gap-2"><div className="w-3 h-3 bg-white rounded-full animate-ping"></div> VIAJE EN CURSO</h2>
             <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">${viajeActivo.precio_estimado}.00</span>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Contacto en Destino</h3>
               <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-full border border-gray-200"><User className="w-6 h-6 text-slate-700"/></div>
                 <div className="flex-1"><p className="font-bold text-slate-900">{viajeActivo.persona_recibe || "Cliente"}</p><p className="text-xs text-slate-500">Recibe la carga</p></div>
                 {viajeActivo.telefono_recibe && (<a href={`tel:${viajeActivo.telefono_recibe}`} className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600"><Phone className="w-5 h-5" /></a>)}
               </div>
            </div>
            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-gray-200">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-white"></div>
                 <p className="text-xs font-bold text-slate-400 uppercase">RECOGER EN</p>
                 <p className="font-medium text-slate-900 text-sm mt-1">{viajeActivo.direccion_recogida || "Ubicación en mapa"}</p>
                 <button onClick={() => abrirGPS(viajeActivo.lat_origen!, viajeActivo.lng_origen!)} className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1"><Navigation className="w-3 h-3"/> IR CON WAZE</button>
              </div>
              <div className="relative pl-6 border-l-2 border-gray-200">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                 <p className="text-xs font-bold text-slate-400 uppercase">ENTREGAR EN</p>
                 <p className="font-medium text-slate-900 text-sm mt-1">{viajeActivo.direccion_entrega || "Ubicación en mapa"}</p>
                 <button onClick={() => abrirGPS(viajeActivo.lat_destino!, viajeActivo.lng_destino!)} className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1"><Navigation className="w-3 h-3"/> IR CON WAZE</button>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-slate-800"><span className="font-bold block text-yellow-700 text-xs uppercase mb-1">Contenido de Carga:</span>{viajeActivo.descripcion_carga} <span className="text-slate-400">({viajeActivo.peso_carga})</span></div>
            <button onClick={finalizarViaje} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg">FINALIZAR ENTREGA</button>
          </div>
        </div>
      )}

      {/* --- LISTA DE CARGAS PENDIENTES --- */}
      {!viajeActivo && !calificando && (
        <>
          <h2 className="font-bold text-slate-700 mb-4 px-2">Cargas Disponibles ({viajes.length})</h2>
          <div className="space-y-4">
            {!loading && viajes.length === 0 && <div className="text-center py-10 opacity-50"><Truck className="w-16 h-16 mx-auto mb-2 text-gray-400" /><p>No hay cargas pendientes.</p></div>}
            
            {viajes.map((viaje) => (
              <div key={viaje.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="bg-yellow-100 p-2.5 rounded-xl h-fit"><Package className="w-6 h-6 text-yellow-700" /></div>
                    <div><h3 className="font-bold text-slate-900 text-lg">${viaje.precio_estimado}.00</h3><span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{viaje.tipo_vehiculo.toUpperCase()}</span></div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Ahora</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg mb-4 space-y-2">
                   <div className="flex gap-2 text-sm text-slate-600 items-start"><MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /><span className="line-clamp-1">{viaje.direccion_recogida || "Ver en mapa"}</span></div>
                   <div className="flex gap-2 text-sm text-slate-600 items-start"><FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /><span className="line-clamp-1">{viaje.descripcion_carga}</span></div>
                </div>
                <button onClick={() => aceptarViaje(viaje.id)} className="w-full bg-slate-900 active:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"><CheckCircle className="w-5 h-5" /> ACEPTAR VIAJE</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}