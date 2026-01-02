'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Menu, User, LogOut } from 'lucide-react';

// IMPORTACIÓN DE COMPONENTES
import VehicleSelector from '@/components/VehicleSelector';
import WelcomeScreen from '@/components/WelcomeScreen';
import DriverDashboard from '@/components/DriverDashboard';
import AdminDashboard from '@/components/AdminDashboard'; // <--- NUEVO: Importamos el Admin

// Importación dinámica del mapa
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold animate-pulse">
      Cargando Mapa...
    </div>
  )
});

export default function Home() {
  // ESTADOS DE LA APLICACIÓN
  const [distancia, setDistancia] = useState(0);
  
  // Ahora el usuario guarda más datos, no solo el role. (Nombre, Verificado, etc)
  const [usuario, setUsuario] = useState<{ role: 'CLIENTE' | 'CHOFER' | 'ADMIN'; [key: string]: any } | null>(null);

  // --- CASO 1: NO HAY USUARIO LOGUEADO (Mostrar Registro) ---
  if (!usuario) {
    // Recibimos "role" y el resto de "datos" (nombre, verificado, etc) desde el Login
    return <WelcomeScreen onStart={(role, datos) => setUsuario({ role, ...datos })} />;
  }

  // --- CASO 2: EL USUARIO ES ADMIN (Torre de Control) ---
  if (usuario.role === 'ADMIN') {
    return (
      <>
        <button 
          onClick={() => setUsuario(null)} 
          className="fixed top-5 right-5 z-50 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
        <AdminDashboard />
      </>
    );
  }

  // --- CASO 3: EL USUARIO ES UN CHOFER (Mostrar Panel de Pedidos) ---
  if (usuario.role === 'CHOFER') {
    return (
      <>
        <button 
          onClick={() => setUsuario(null)} 
          className="fixed top-5 right-5 z-50 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
        
        {/* LE PASAMOS LOS DATOS DEL USUARIO PARA QUE SEPA SI ESTÁ BLOQUEADO O NO */}
        <DriverDashboard usuario={usuario} />
      </>
    );
  }

  // --- CASO 4: EL USUARIO ES UN CLIENTE (Mostrar Mapa y Selector) ---
  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden bg-gray-100">
      
      {/* HEADER: TU LOGO REAL (IMAGEN) */}
      <div className="absolute top-2 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <div className="bg-white p-1.5 rounded-xl shadow-lg shadow-black/20">
          <img 
            src="https://i.postimg.cc/v89jzD58/rapid-cargo.jpg" 
            alt="Rapid Cargo" 
            className="h-12 w-auto object-contain rounded-lg"
          />
        </div>
      </div>

      {/* CAPA 0: EL MAPA (Fondo) */}
      <div className="absolute inset-0 z-0">
        <Map setDistancia={setDistancia} />
      </div>

      {/* CAPA 1: BARRA DE BÚSQUEDA SUPERIOR */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-16 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-2xl flex items-center p-3 gap-3 pointer-events-auto ring-1 ring-black/5">
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Menu className="text-gray-600 w-6 h-6 ml-1" />
          </button>
          
          <div className="flex-1 border-l border-gray-200 pl-3 ml-1">
            <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-gray-400 font-bold tracking-widest">ORIGEN DETECTADO</span>
            </div>
            <input 
              type="text" 
              defaultValue="Tu Ubicación Actual"
              className="w-full outline-none text-slate-900 font-bold text-sm bg-transparent truncate placeholder-gray-400"
              readOnly
            />
          </div>

          <button 
            onClick={() => setUsuario(null)}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full border border-gray-200 transition-colors"
          >
            <User className="text-slate-700 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CAPA 2: SELECTOR DE VEHÍCULOS (Panel Inferior) */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <VehicleSelector distanciaKm={distancia} />
      </div>
      
    </div>
  );
}