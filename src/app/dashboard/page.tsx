"use client";

import { useEffect, useState, useRef } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Trash2, 
  Video, 
  ChevronRight, 
  Upload,
  Home,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  AlertCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured, supabaseUrl } from "@/lib/supabase";
import TourViewer from "@/components/TourViewer";
import { generatePropertyVideo } from "@/lib/video-engine";

export default function DashboardPage() {
  // Estados de Navegación
  const [activeTab, setActiveTab] = useState<"estudio" | "config">("estudio");
  const [projectName, setProjectName] = useState("Mansión Santander · Rev 01");

  // Estados de Datos
  const [images, setImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  
  // Estados de UI
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar imágenes de Supabase al inicio
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) console.error("Error cargando archivos:", error);
    else if (data) setImages(data);
  };

  const handleGenerateVideo = async () => {
    const validImages = images.filter(img => img.url && img.url.startsWith('http'));
    
    if (validImages.length === 0) {
      alert("Error: No hay imágenes válidas para procesar. Sube fotos primero.");
      return;
    }

    console.log("Imágenes a procesar:", validImages.length);

    setIsProcessing(true);
    setCurrentAction("Iniciando Motor de Video...");
    try {
      const videoBlob = await generatePropertyVideo({
        imageUrls: validImages.map(img => img.url),
        title: projectName.split("·")[0].trim() || "Propiedad",
        price: "LISTA PARA ESTRENAR"
      });

      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);
      setVideoBlob(videoBlob);
      
      setCurrentAction(null);
      alert("🎯 ¡Video Generado! Revisa la vista previa para publicarlo.");
    } catch (error: any) {
      console.error("DETALLE DEL ERROR:", error);
      let errorMsg = "Error desconocido";
      if (typeof error === 'string') errorMsg = error;
      else if (error && error.message) errorMsg = error.message;
      else if (error && typeof error === 'object') errorMsg = JSON.stringify(error);
      
      alert("⚠️ Error en el motor de video: " + errorMsg + "\n\nRevisa la consola (F12) para más detalles.");
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleUpload = async (e: any, targetFloor: string = "1") => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

    if (!isSupabaseConfigured) {
      alert("⚠️ Error: Supabase no está configurado correctamente.");
      return;
    }

    setIsUploading(true);
    setCurrentAction(`Subiendo ${files.length} fotos...`);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("propiedades")
        .upload(filePath, file);

      if (uploadError) {
        alert(`Error subiendo ${file.name}: ${uploadError.message}`);
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/${filePath}`;

      const { data: mediaData, error: dbError } = await supabase
        .from("media")
        .insert([{
          url: publicUrl,
          floor: targetFloor,
          room_type: "unassigned",
          status: "original"
        }])
        .select()
        .single();

      if (dbError) console.error("Error BD:", dbError);
      else setImages(prev => [...prev, mediaData]);
    }

    setIsUploading(false);
    setCurrentAction(null);
  };

  const removeImage = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar esta foto?")) return;
    
    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", id);

    if (!dbError) {
      setImages(prev => prev.filter(img => img.id !== id));
    } else {
      alert("Error al eliminar el registro.");
    }
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
    setCurrentAction(type === "clean" ? "Limpiando espacio con IA..." : "Amoblando con IA...");
    
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) return;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: targetImage.url,
          roomType: targetImage.room_type,
          mode: type
        })
      });

      let result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error en el servidor");

      if (result.status === "processing") {
        const predictionId = result.id;
        while (result.status !== "succeeded" && result.status !== "failed") {
          await new Promise(r => setTimeout(r, 4000));
          const pollRes = await fetch(`/api/ai?id=${predictionId}`);
          result = await pollRes.json();
        }
      }

      if (result.status === "failed") throw new Error("La IA falló al procesar.");
      
      const newUrl = result.outputUrl; 
      const newStatus = type === "clean" ? "cleaned" : "staged";

      await supabase.from("media").update({ status: newStatus, url: newUrl }).eq("id", id);

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: newStatus, url: newUrl } : img
      ));
      
      alert(`✅ ¡Éxito! Imagen ${type === "clean" ? 'limpia' : 'amoblada'}.`);
    } catch (error: any) {
      alert(`Ups! Algo salió mal: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const floors = ["1", "2", "3", "Exterior"];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow">
      {/* Sidebar - Desktop / Bottom Nav - Mobile */}
      <aside className="fixed bottom-0 left-0 w-full lg:relative lg:w-72 border-t lg:border-t-0 lg:border-r border-white/5 bg-black/40 backdrop-blur-3xl flex lg:flex-col p-4 lg:p-8 z-40 transition-all">
        <div className="hidden lg:flex items-center gap-3 mb-12">
          <div className="bg-hormozi-yellow p-1.5 rounded-sm rotate-3 shadow-[0_0_20px_rgba(255,255,0,0.3)]">
            <Home size={20} className="text-black" />
          </div>
          <span className="font-black tracking-[0.3em] text-sm uppercase italic">SOTO <span className="text-hormozi-yellow">IA</span></span>
        </div>

        <nav className="flex-1 flex lg:flex-col gap-2 w-full justify-around lg:justify-start">
          <button 
            onClick={() => setActiveTab("estudio")}
            className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 flex-1 lg:w-full px-4 lg:px-5 py-3 lg:py-4 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all ${activeTab === "estudio" ? "bg-white/10 text-hormozi-yellow shadow-lg shadow-black/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
          >
            <LayoutDashboard size={18} />
            <span className="lg:block">Estudio</span>
          </button>
          <button 
            onClick={() => setActiveTab("config")}
            className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 flex-1 lg:w-full px-4 lg:px-5 py-3 lg:py-4 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all ${activeTab === "config" ? "bg-white/10 text-hormozi-yellow shadow-lg shadow-black/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
          >
            <Settings size={18} />
            <span className="lg:block">Config</span>
          </button>
        </nav>

        <div className="hidden lg:block mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">Estado del Servidor</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] font-bold">{isSupabaseConfigured ? "CONECTADO A SUPABASE" : "ERROR DE CONEXIÓN"}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 relative pb-24 lg:pb-0 scrollable-container">
        {/* Overlay de Carga Global */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-hormozi-yellow border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-xl font-black italic uppercase tracking-tighter animate-pulse">{currentAction}</p>
              <p className="text-white/40 text-xs mt-2 uppercase tracking-widest">Por favor, no cierres esta ventana</p>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="min-h-24 py-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-6 md:px-10 bg-black/10 backdrop-blur-md z-30 gap-6">
            <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest md:tracking-[0.4em]">
              <span className="hidden sm:inline">PROYECTOS</span>
              <ChevronRight size={14} className="hidden sm:inline" />
              <span className="text-white truncate max-w-[200px] md:max-w-none">{projectName}</span>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center">
               {isUploading && (
                 <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-hormozi-yellow bg-hormozi-yellow/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-hormozi-yellow/20">
                   <Clock size={12} className="animate-spin"/> 
                   SUBIENDO...
                 </div>
               )}
              <button 
                onClick={handleGenerateVideo}
                disabled={isProcessing || images.length === 0}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] md:text-[10px] font-bold hover:bg-white/10 transition-all uppercase tracking-widest disabled:opacity-20 flex-1 sm:flex-none"
              >
                <Video size={16} className="text-hormozi-yellow" />
                <span className="hidden sm:inline">Generar</span> Video
              </button>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="btn-luxury flex-1 sm:flex-none py-2.5 md:py-5"
                disabled={images.length === 0 || isProcessing}
              >
                Tour 360
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          {activeTab === "estudio" ? (
            /* VISTA DE ESTUDIO (EXISTENTE + MEJORADA) */
            images.length === 0 && !isUploading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 flex flex-col items-center justify-center text-center bg-white/[0.01]"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 md:mb-8 text-hormozi-yellow">
                  <Upload size={32} />
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-4 uppercase tracking-tighter italic text-white leading-tight">Sube las fotos de tu inmueble</h2>
                <p className="text-white/30 max-w-sm mb-10 md:mb-12 text-xs md:text-sm leading-relaxed">Puedes subirlas normales o panorámicas. La IA se encargará del resto.</p>
                <label className="cursor-pointer w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 bg-white text-black font-black rounded-2xl uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] text-xs md:text-sm">
                  Seleccionar Fotos
                  <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e)} accept="image/*" />
                </label>
              </motion.div>
            ) : (
              <div className="space-y-24">
                {floors.map((floor) => {
                  const floorImages = images.filter(img => img.floor === floor);
                  if (floorImages.length === 0 && floor !== "1") return null;

                  return (
                    <div key={floor} className="space-y-10">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                          {floor === "Exterior" ? "Fachada" : `Piso ${floor}`}
                        </h3>
                        <div className="hidden md:block h-[1px] flex-1 bg-white/5" />
                        <span className="text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">
                          {floorImages.length} Activos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {floorImages.map((img) => (
                           <motion.div key={img.id} layout className="glass-luxury rounded-[2.5rem] overflow-hidden group border border-white/5">
                             <div className="aspect-[4/3] relative overflow-hidden">
                               <img 
                                  src={img.url} 
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" 
                                />
                               
                               {/* Badges de Estado */}
                               <div className="absolute top-6 left-6 flex flex-col gap-2">
                                  {img.status !== 'original' && (
                                    <div className="px-4 py-1.5 bg-hormozi-yellow text-black text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                      <CheckCircle2 size={12}/> {img.status === 'cleaned' ? 'IA: LIMPIA' : 'IA: AMUEBLADA'}
                                    </div>
                                  )}
                                  {img.status === 'staged' && (
                                    <div className="px-4 py-1.5 bg-blue-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                      <ExternalLink size={12}/> VISTA FINAL
                                    </div>
                                  )}
                               </div>

                               <div className="absolute top-4 right-4 z-20">
                                 <button onClick={() => removeImage(img.id)} className="p-3 bg-red-500 text-white rounded-xl shadow-xl active:scale-90 transition-all">
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                               
                               <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-all">
                                 <button 
                                   onClick={async () => {
                                     const newStatus = img.status === 'staged' ? 'original' : 'staged';
                                     await supabase.from("media").update({ status: newStatus }).eq("id", img.id);
                                     setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: newStatus } : i));
                                   }}
                                   className={`w-full py-4 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${img.status === 'staged' ? 'bg-hormozi-yellow border-hormozi-yellow text-black' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                 >
                                   {img.status === 'staged' ? '⭐ Foto en Tour' : 'Añadir al Tour'}
                                 </button>
                               </div>
                             </div>
                             
                             <div className="p-6 space-y-4 bg-black/20">
                               <div className="flex gap-2">
                                 <select 
                                   value={img.floor}
                                   onChange={(e) => {
                                     const val = e.target.value;
                                     supabase.from("media").update({ floor: val }).eq("id", img.id).then(() => {
                                       setImages(images.map(i => i.id === img.id ? { ...i, floor: val } : i));
                                     });
                                   }}
                                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[9px] font-bold uppercase text-hormozi-yellow outline-none cursor-pointer"
                                 >
                                   <option value="1">Piso 1</option>
                                   <option value="2">Piso 2</option>
                                   <option value="3">Piso 3</option>
                                   <option value="Exterior">Exterior</option>
                                 </select>

                                 <select 
                                   value={img.room_type}
                                   onChange={(e) => {
                                      const val = e.target.value;
                                      supabase.from("media").update({ room_type: val }).eq("id", img.id).then(() => {
                                        setImages(images.map(i => i.id === img.id ? { ...i, room_type: val } : i));
                                      });
                                   }}
                                   className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[9px] font-bold uppercase outline-none cursor-pointer"
                                 >
                                   <option value="unassigned">¿Qué habitación es?</option>
                                   <option value="sala">Sala Principal</option>
                                   <option value="cocina">Cocina Gourmet</option>
                                   <option value="principal">Habitación Master</option>
                                   <option value="cuarto2">Habitación Suite</option>
                                   <option value="baño">Baño / Spa</option>
                                   <option value="patio">Terraza / Balcón</option>
                                  </select>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={() => processAI(img.id, "clean")} 
                                    disabled={isProcessing}
                                    className="py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-hormozi-yellow hover:text-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                  >
                                    Limpiar (IA)
                                  </button>
                                  <button 
                                    onClick={() => processAI(img.id, "stage")} 
                                    disabled={isProcessing}
                                    className="py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                  >
                                    Amueblar (IA)
                                  </button>
                               </div>
                             </div>
                           </motion.div>
                         ))}

                         <label className="border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.03] p-12 transition-all min-h-[300px]">
                            <Plus size={32} className="text-white/20" />
                            <div className="text-center">
                              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 block mb-1">Añadir Fotos</span>
                              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/10 italic">Nuevas secciones</span>
                            </div>
                            <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, floor)} accept="image/*" />
                         </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* VISTA DE CONFIGURACIÓN */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Configuración del Proyecto</h2>
                <p className="text-white/40 text-sm">Personaliza los detalles de este inmueble y gestiona las conexiones.</p>
              </div>

              <div className="grid gap-8">
                {/* Nombre del Proyecto */}
                <div className="glass-luxury p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <Home size={20} className="text-hormozi-yellow" />
                    <span className="font-bold uppercase tracking-widest text-xs text-white/60">Información General</span>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Nombre Público de la Propiedad</label>
                    <input 
                      type="text" 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl font-bold italic outline-none focus:border-hormozi-yellow transition-all"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      alert("¡Configuración guardada correctamente!");
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-tighter hover:scale-105 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] active:scale-95"
                  >
                    <Save size={16} /> Guardar Cambios
                  </button>
                </div>

                {/* Estado de APIs */}
                <div className="glass-luxury p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-hormozi-yellow" />
                    <span className="font-bold uppercase tracking-widest text-xs text-white/60">Integraciones de IA</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-white/40">Supabase Storage</span>
                        <span className="text-xs font-bold text-white">{isSupabaseConfigured ? "Conectado" : "Error de variable de entorno"}</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"}`} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-white/40">Motor de Video (FFmpeg)</span>
                        <span className="text-xs font-bold text-white">WASM Localmente Cargado</span>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Visor de Tour Virtual */}
      <AnimatePresence>
        {isPreviewOpen && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 md:p-12"
          >
             <button 
               onClick={() => setIsPreviewOpen(false)}
               className="absolute top-6 right-6 md:top-10 md:right-10 text-white/30 hover:text-white transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 z-[110]"
             >
               Cerrar <div className="hidden sm:block p-2 border border-white/10 rounded-lg">ESC</div>
               <X size={20} className="sm:hidden" />
             </button>

             <div className="max-w-[1400px] w-full space-y-6 md:space-y-10 flex flex-col h-full md:h-auto overflow-y-auto md:overflow-visible py-12 md:py-0">
                <div className="shrink-0 aspect-video md:h-auto overflow-hidden rounded-[1.5rem] md:rounded-[3rem]">
                  <TourViewer 
                    scenes={images
                      .filter(img => img.url && img.url.startsWith('http'))
                      .map((img: any) => ({
                        id: img.id,
                        name: img.room_type !== "unassigned" ? img.room_type.toUpperCase() : "ESPACIO INTERIOR",
                        imageUrl: img.url,
                        hotspots: []
                      }))}
                    initialSceneId={images[activeTourIndex]?.id}
                  />
                </div>

                <div className="flex justify-center gap-4 overflow-x-auto pb-4 scrollbar-none">
                   {images
                     .filter(img => img.url && img.url.startsWith('http'))
                     .map((img, idx) => (
                     <button 
                        key={img.id}
                        onClick={() => setActiveTourIndex(idx)}
                        className={`group relative shrink-0 w-28 aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-500 ${idx === activeTourIndex ? 'border-hormozi-yellow scale-110 shadow-[0_0_30px_rgba(255,255,0,0.2)]' : 'border-white/5 opacity-40 hover:opacity-100 hover:scale-105'}`}
                     >
                        <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-125" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <CheckCircle2 size={16} className="text-hormozi-yellow" />
                        </div>
                     </button>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Vista Previa de Video y Publicación */}
      <AnimatePresence>
        {generatedVideoUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-[#062b54] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
              <button 
                onClick={() => {
                  setGeneratedVideoUrl(null);
                  setVideoBlob(null);
                }}
                className="absolute top-6 right-6 text-white/30 hover:text-white z-20"
              >
                <X size={24} />
              </button>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Video Generado</h3>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Vista previa del reel inmobiliario</p>
                </div>

                <div className="aspect-[9/16] bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                   <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                   <button 
                     onClick={() => {
                       const a = document.createElement("a");
                       a.href = generatedVideoUrl;
                       a.download = `Propiedad_${Date.now()}.mp4`;
                       a.click();
                     }}
                     className="py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     Descargar
                   </button>
                   <button 
                     onClick={async () => {
                       if (!videoBlob) return;
                       setIsProcessing(true);
                       setCurrentAction("Publicando en la Landing...");
                       
                       try {
                         const { data: prop, error: pErr } = await supabase.from('properties').select('id').limit(1).single();
                         if (pErr || !prop) throw new Error("Asegúrate de haber configurado la propiedad en 'Config'.");

                         const fileName = `video_${Date.now()}.mp4`;
                         const filePath = `videos/${fileName}`;

                         const { error: upErr } = await supabase.storage.from('propiedades').upload(filePath, videoBlob);
                         if (upErr) throw upErr;

                         const videoPublicUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/${filePath}`;
                         const { error: updErr } = await supabase.from('properties').update({ video_url: videoPublicUrl }).eq('id', prop.id);
                         if (updErr) throw updErr;

                         alert("🚀 ¡VIDEO PUBLICADO EN LA LANDING!");
                         setGeneratedVideoUrl(null);
                       } catch (e: any) {
                         alert("Error: " + e.message);
                       } finally {
                         setIsProcessing(false);
                         setCurrentAction(null);
                       }
                     }}
                     className="py-4 bg-hormozi-yellow text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,0,0.2)]"
                   >
                     🚀 Publicar
                   </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
