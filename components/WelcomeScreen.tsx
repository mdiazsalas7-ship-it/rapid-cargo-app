'use client';

import React, { useState } from 'react';
import { Truck, Package, Loader2, Upload, Mail, Key, ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase'; // Importamos storage
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Funciones para subir

interface WelcomeProps {
  onStart: (role: 'CLIENTE' | 'CHOFER', datos: any) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeProps) {
  const [vista, setVista] = useState<'LOGIN' | 'SELECCION_ROL' | 'REGISTRO_CLIENTE' | 'REGISTRO_CHOFER'>('LOGIN');
  const [loading, setLoading] = useState(false);

  // DATOS GENERALES
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // DATOS CLIENTE
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    nombre: '', telefono: '', direccion: '', ruc: '', razonSocial: ''
  });

  // DATOS CHOFER
  const [datosChofer, setDatosChofer] = useState({
    nombre: '', telefono: '', tipoVehiculo: 'MOTO', placa: '', licencia: '',
    // URLs de las fotos
    urlLicencia: '',
    urlRegistro: ''
  });

  // ESTADOS DE CARGA DE IMÁGENES
  const [uploadingLicencia, setUploadingLicencia] = useState(false);
  const [uploadingRegistro, setUploadingRegistro] = useState(false);

  // --- FUNCIÓN PARA SUBIR ARCHIVOS ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'licencia' | 'registro') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (tipo === 'licencia') setUploadingLicencia(true);
    else setUploadingRegistro(true);

    try {
      // 1. Crear referencia (carpeta/nombre_archivo)
      // Usamos Date.now() para que el nombre sea único
      const archivoRef = ref(storage, `documentos/${tipo}_${Date.now()}_${file.name}`);
      
      // 2. Subir
      await uploadBytes(archivoRef, file);
      
      // 3. Obtener URL pública
      const url = await getDownloadURL(archivoRef);
      
      // 4. Guardar URL en el estado
      if (tipo === 'licencia') setDatosChofer(prev => ({ ...prev, urlLicencia: url }));
      else setDatosChofer(prev => ({ ...prev, urlRegistro: url }));

    } catch (error) {
      console.error("Error subiendo:", error);
      alert("Error al subir la imagen. Intenta de nuevo.");
    } finally {
      if (tipo === 'licencia') setUploadingLicencia(false);
      else setUploadingRegistro(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datosUsuario = docSnap.data();
        onStart(datosUsuario.rol, datosUsuario);
      } else {
        alert("Usuario sin perfil.");
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (rol: 'CLIENTE' | 'CHOFER') => {
    // VALIDACIÓN IMPORTANTE PARA CHOFERES
    if (rol === 'CHOFER') {
      if (!datosChofer.urlLicencia || !datosChofer.urlRegistro) {
        alert("Debes subir las fotos de tus documentos obligatoriamente.");
        return;
      }
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      let datosFinales = {};

      if (rol === 'CLIENTE') {
        datosFinales = {
          uid, email, rol: 'CLIENTE', tipo: esEmpresa ? 'EMPRESA' : 'PARTICULAR',
          ...datosCliente, fecha_registro: new Date().toISOString()
        };
      } else {
        datosFinales = {
          uid, email, rol: 'CHOFER', ...datosChofer,
          documentos_verificados: false, fecha_registro: new Date().toISOString()
        };
      }

      await setDoc(doc(db, "usuarios", uid), datosFinales);
      alert("Cuenta creada exitosamente");
      onStart(rol, datosFinales);

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (VISTAS LOGIN, SELECCION_ROL y REGISTRO_CLIENTE quedan IGUAL que antes. Solo copio la de CHOFER que cambió) ...
  // Si necesitas el código completo de las otras vistas dímelo, pero para ahorrar espacio asumo que las mantienes.
  
  if (vista === 'LOGIN') {
    // ... (CÓDIGO DE LOGIN IGUAL AL ANTERIOR) ...
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="mb-8 text-center animate-in zoom-in duration-500 relative z-10">
           <img src="https://i.postimg.cc/v89jzD58/rapid-cargo.jpg" alt="Rapid Cargo" className="h-32 w-auto rounded-2xl shadow-2xl mb-4 border-4 border-white/10 mx-auto"/>
           <h1 className="text-3xl font-black text-white tracking-tighter">RAPID<span className="text-yellow-400">CARGO</span></h1>
        </div>
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/10 relative z-10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-white text-xs font-bold ml-2">CORREO ELECTRÓNICO</label><div className="flex items-center bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700 mt-1"><Mail className="text-slate-400 w-5 h-5 mr-3" /><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="bg-transparent text-white outline-none w-full" placeholder="correo@ejemplo.com" required/></div></div>
            <div><label className="text-white text-xs font-bold ml-2">CONTRASEÑA</label><div className="flex items-center bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700 mt-1"><Key className="text-slate-400 w-5 h-5 mr-3" /><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="bg-transparent text-white outline-none w-full" placeholder="••••••••" required/></div></div>
            <button disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-xl mt-4 transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'INICIAR SESIÓN'}</button>
          </form>
          <div className="mt-6 text-center"><p className="text-slate-400 text-sm">¿No tienes cuenta?</p><button onClick={() => setVista('SELECCION_ROL')} className="text-yellow-400 font-bold text-sm mt-1 hover:underline">REGÍSTRATE AQUÍ</button></div>
        </div>
      </div>
    );
  }

  if (vista === 'SELECCION_ROL') {
     return (
      <div className="min-h-screen bg-white p-6 flex flex-col justify-center animate-in slide-in-from-right">
        <button onClick={() => setVista('LOGIN')} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Crear Cuenta</h2>
        <p className="text-gray-500 mb-8">Selecciona tu perfil para comenzar.</p>
        <div className="space-y-4">
          <button onClick={() => setVista('REGISTRO_CLIENTE')} className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center gap-4 hover:border-yellow-400 transition-all group text-left"><div className="bg-yellow-100 p-4 rounded-full text-yellow-700 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors"><Package className="w-8 h-8" /></div><div><h3 className="font-bold text-lg text-slate-900">Soy Cliente</h3><p className="text-gray-500 text-sm">Empresas o Personas</p></div></button>
          <button onClick={() => setVista('REGISTRO_CHOFER')} className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-all group text-left"><div className="bg-blue-100 p-4 rounded-full text-blue-700 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Truck className="w-8 h-8" /></div><div><h3 className="font-bold text-lg text-slate-900">Soy Transportista</h3><p className="text-gray-500 text-sm">Moto, Carro, Panel, Mula</p></div></button>
        </div>
      </div>
    );
  }

  if (vista === 'REGISTRO_CLIENTE') {
     return (
      <div className="min-h-screen bg-white p-6 pb-20 overflow-y-auto animate-in slide-in-from-right">
        <button onClick={() => setVista('SELECCION_ROL')} className="mb-4"><ArrowLeft className="w-6 h-6 text-slate-900" /></button>
        <h2 className="text-2xl font-black text-slate-900">Registro Cliente</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 mt-4"><button onClick={() => setEsEmpresa(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!esEmpresa ? 'bg-white shadow text-slate-900' : 'text-gray-400'}`}>Persona Natural</button><button onClick={() => setEsEmpresa(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${esEmpresa ? 'bg-white shadow text-slate-900' : 'text-gray-400'}`}>Empresa</button></div>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500">EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="correo@empresa.com"/></div>
          <div><label className="text-xs font-bold text-gray-500">CONTRASEÑA</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="******"/></div>
          <div className="h-px bg-gray-200 my-2"></div>
          {esEmpresa ? ( <><div><label className="text-xs font-bold text-gray-500">RAZÓN SOCIAL</label><input type="text" onChange={e=>setDatosCliente({...datosCliente, razonSocial: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="Ej. Inversiones S.A."/></div><div><label className="text-xs font-bold text-gray-500">R.U.C / NIT</label><input type="text" onChange={e=>setDatosCliente({...datosCliente, ruc: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="Ej. 15569-22-333"/></div></> ) : ( <div><label className="text-xs font-bold text-gray-500">NOMBRE COMPLETO</label><input type="text" onChange={e=>setDatosCliente({...datosCliente, nombre: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="Ej. Juan Pérez"/></div> )}
          <div><label className="text-xs font-bold text-gray-500">TELÉFONO</label><input type="tel" onChange={e=>setDatosCliente({...datosCliente, telefono: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" placeholder="+507 6000-0000"/></div>
          <div><label className="text-xs font-bold text-gray-500">DIRECCIÓN {esEmpresa ? 'FISCAL' : 'DE DOMICILIO'}</label><textarea onChange={e=>setDatosCliente({...datosCliente, direccion: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" rows={2} placeholder="Calle, Edificio, Número..."/></div>
          <button onClick={() => handleRegistro('CLIENTE')} disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'FINALIZAR REGISTRO'}</button>
        </div>
      </div>
    );
  }

  // VISTA D: FORMULARIO CHOFER (¡AQUÍ ESTÁ LA CARGA DE FOTOS!)
  if (vista === 'REGISTRO_CHOFER') {
    return (
      <div className="min-h-screen bg-white p-6 pb-20 overflow-y-auto animate-in slide-in-from-right">
        <button onClick={() => setVista('SELECCION_ROL')} className="mb-4"><ArrowLeft className="w-6 h-6 text-slate-900" /></button>
        <h2 className="text-2xl font-black text-slate-900 mb-1">Registro Conductor</h2>
        <p className="text-sm text-gray-500 mb-6">Sube las fotos de tus documentos reales.</p>

        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500">EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none"/></div>
          <div><label className="text-xs font-bold text-gray-500">CONTRASEÑA</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none"/></div>
          <div className="h-px bg-gray-200 my-2"></div>
          <div><label className="text-xs font-bold text-gray-500">NOMBRE COMPLETO</label><input type="text" onChange={e=>setDatosChofer({...datosChofer, nombre: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none"/></div>
          
          <div>
            <label className="text-xs font-bold text-gray-500">TIPO DE VEHÍCULO</label>
            <select onChange={e=>setDatosChofer({...datosChofer, tipoVehiculo: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none mt-1">
              <option value="MOTO">Moto (Encomiendas)</option>
              <option value="AUTO">Auto Sedán</option>
              <option value="PANEL">Panel de Carga</option>
              <option value="PICKUP">Pick-up</option>
              <option value="CAMION_CHICO">Camión 4 Ruedas (NPR)</option>
              <option value="MULA">Mula / Contenedor</option>
            </select>
          </div>

          <div className="flex gap-4">
             <div className="flex-1"><label className="text-xs font-bold text-gray-500">PLACA</label><input type="text" onChange={e=>setDatosChofer({...datosChofer, placa: e.target.value})} className="w-full bg-yellow-50 border border-yellow-200 text-slate-900 p-3 rounded-xl outline-none uppercase font-mono"/></div>
             <div className="flex-1"><label className="text-xs font-bold text-gray-500">LICENCIA</label><input type="text" onChange={e=>setDatosChofer({...datosChofer, licencia: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none uppercase"/></div>
          </div>

          {/* ÁREA DE CARGA DE DOCUMENTOS REAL */}
          <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 mt-4 space-y-4">
            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Upload className="w-4 h-4"/> Documentos Requeridos</h4>
            
            {/* INPUT FOTO LICENCIA */}
            <div className={`p-3 rounded-lg border transition-colors ${datosChofer.urlLicencia ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Foto de Licencia</span>
                {datosChofer.urlLicencia && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
              {uploadingLicencia ? (
                 <div className="text-xs text-blue-500 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Subiendo...</div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'licencia')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700"/>
              )}
            </div>

            {/* INPUT FOTO REGISTRO */}
            <div className={`p-3 rounded-lg border transition-colors ${datosChofer.urlRegistro ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Registro Vehicular</span>
                {datosChofer.urlRegistro && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
              {uploadingRegistro ? (
                 <div className="text-xs text-blue-500 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Subiendo...</div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'registro')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700"/>
              )}
            </div>
          </div>

          <button onClick={() => handleRegistro('CHOFER')} disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'ENVIAR SOLICITUD'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}