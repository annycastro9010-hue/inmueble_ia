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

const floors = ["1", "2", "3", "Exterior"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"estudio" | "config">("estudio");
  const [projectName, setProjectName] = useState("Mansión Santander · Rev 01");
  const [images, setImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: true });
    if (error) console.error("Error cargando archivos:", error);
    else if (data) setImages(data);
  };

  const handleGenerateVideo = async () => {
    const validImages = images.filter(img => img.url && img.url.startsWith('http'));
    if (validImages.length === 0) {
      alert("Error: No hay imágenes válidas para procesar. Sube fotos primero.");
      return;
    }
    setIsProcessing(true);
    setCurrentAction("Iniciando Motor de Video...");
    try {
      const blob = await generatePropertyVideo({
        imageUrls: validImages.map(img => img.url),
        title: projectName.split("·")[0].trim() || "Propiedad",
        price: "LISTA PARA ESTRENAR"
      });
      const url = URL.createObjectURL(blob);
      setGeneratedVideoUrl(url);
      setVideoBlob(blob);
      setIsProcessing(false);
    } catch (error: any) {
      alert("⚠️ Error en el motor de video: " + (error?.message || "Error desconocido"));
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleUpload = async (e: any, targetFloor: string = "1") => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0 || !isSupabaseConfigured) return;
    setIsUploading(true);
    setCurrentAction(`Subiendo ${files.length} fotos...`);
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("propiedades").upload(filePath, file);
      if (!uploadError) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/${filePath}`;
        const { data: mediaData } = await supabase.from("media").insert([{ url: publicUrl, floor: targetFloor, room_type: "unassigned", status: "original" }]).select().single();
        if (mediaData) setImages(prev => [...prev, mediaData]);
      }
    }
    setIsUploading(false);
    setCurrentAction(null);
  };

  const removeImage = async (id: string, url: string) => {
    if (!confirm("¿Seguro que quieres borrar esta foto? Esto no se puede deshacer.")) return;
    
    setIsProcessing(true);
    setCurrentAction("Eliminando archivo...");
    
    try {
      // 1. Borrar de la base de datos
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;

      // 2. Intentar extraer el path para borrar del storage (opcional pero limpio)
      // El formato suele ser .../public/propiedades/uploads/nombre.jpg
      const pathParts = url.split('/propiedades/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from("propiedades").remove([filePath]);
      }

      setImages(prev => prev.filter(img => img.id !== id));
    } catch (error: any) {
      alert("No se pudo eliminar: " + error.message);
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
    setCurrentAction(type === "clean" ? "Limpiando espacio con IA..." : "Amoblando con IA...");
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) { setIsProcessing(false); return; }
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: targetImage.url, roomType: targetImage.room_type, mode: type }) });
      let result = await response.json();
      if (result.status === "processing") {
        const predictionId = result.id;
        while (result.status !== "succeeded" && result.status !== "failed") {
          await new Promise(r => setTimeout(r, 4000));
          const pollRes = await fetch(`/api/ai?id=${predictionId}`);
          result = await pollRes.json();
        }
      }
      if (result.status === "failed") throw new Error("La IA falló");
      const newUrl = result.outputUrl; 
      const newStatus = type === "clean" ? "cleaned" : "staged";
      await supabase.from("media").update({ status: newStatus, url: newUrl }).eq("id", id);
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: newStatus, url: newUrl } : img));
    } catch (e: any) { alert("Error IA: " + e.message); }
    finally { setIsProcessing(false); setCurrentAction(null); }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow">
      <aside className="fixed bottom-0 left-0 w-full lg:relative lg:w-72 border-t lg:border-t-0 lg:border-r border-white/5 bg-black/40 backdrop-blur-3xl flex lg:flex-col p-4 lg:p-8 z-40 transition-all">
        <div className="hidden lg:flex items-center gap-3 mb-12">
          <div className="bg-hormozi-yellow p-1.5 rounded-sm rotate-3">
            <Home size={20} className="text-black" />
          </div>
          <span className="font-black tracking-[0.3em] text-sm uppercase italic">SOTO <span className="text-hormozi-yellow">IA</span></span>
        </div>
        <nav className="flex-1 flex lg:flex-col gap-2 w-full justify-around lg:justify-start">
          <button onClick={() => setActiveTab("estudio")} className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 flex-1 lg:w-full px-4 lg:px-5 py-3 lg:py-4 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all ${activeTab === "estudio" ? "bg-white/10 text-hormozi-yellow shadow-lg shadow-black/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}>
            <LayoutDashboard size={18} />
            <span>Estudio</span>
          </button>
          <button onClick={() => setActiveTab("config")} className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 flex-1 lg:w-full px-4 lg:px-5 py-3 lg:py-4 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all ${activeTab === "config" ? "bg-white/10 text-hormozi-yellow shadow-lg shadow-black/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}>
            <Settings size={18} />
            <span>Config</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 relative pb-24 lg:pb-0 scrollable-container">
        <AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#062b54]/80 backdrop-blur-xl flex flex-col items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-white/5 border-t-hormozi-yellow rounded-full animate-spin mb-8" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-white/10 border-b-hormozi-yellow rounded-full animate-spin-reverse" />
                </div>
              </div>
              <p className="text-2xl font-black italic uppercase tracking-[0.2em] text-white animate-pulse">{currentAction}</p>
              <p className="mt-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">Esto tardará unos segundos...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="min-h-24 py-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-6 md:px-10 bg-black/10 backdrop-blur-md z-30 gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">
            <span>PROYECTOS</span>
            <ChevronRight size={14} />
            <span className="text-white">{projectName}</span>
          </div>
          <div className="flex gap-4">
            <button onClick={handleGenerateVideo} disabled={isProcessing || images.length === 0} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
              <Video size={16} className="text-hormozi-yellow" />
              Generar Video
            </button>
            <button onClick={() => setIsPreviewOpen(true)} className="btn-luxury py-3 px-8" disabled={images.length === 0 || isProcessing}>
              Tour 360
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
          {activeTab === "estudio" ? (
            images.length === 0 && !isUploading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full border border-dashed border-white/10 rounded-[3rem] p-24 flex flex-col items-center justify-center text-center">
                <Upload size={32} className="text-hormozi-yellow mb-8" />
                <h2 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter italic text-white">Sube las fotos</h2>
                <label className="cursor-pointer px-12 py-5 bg-white text-black font-black rounded-2xl uppercase tracking-tighter hover:scale-105 transition-all">
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
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{floor === "Exterior" ? "Fachada" : `Piso ${floor}`}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {floorImages.map((img) => (
                          <div key={img.id} className="glass-luxury rounded-[2.5rem] overflow-hidden border border-white/5">
                            <div className="aspect-video relative overflow-hidden bg-[#041f3a] rounded-t-[2.5rem]">
                              <img 
                                src={img.url} 
                                alt="Foto propiedad"
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover object-center" 
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                              />
                              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(img.id, img.url); }} 
                                className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md text-white/50 hover:text-red-500 hover:bg-white rounded-xl z-10 transition-all border border-white/10"
                                title="Eliminar rápidamente"
                              >
                                <Trash2 size={14}/>
                              </button>
                              {img.status !== 'original' && (
                                <div className="absolute top-4 left-4 px-3 py-1 bg-hormozi-yellow text-black text-[9px] font-black rounded-full uppercase">{img.status === 'cleaned' ? '✓ Limpia' : '✓ Amueblada'}</div>
                              )}
                            </div>
                            <div className="p-6 space-y-4">
                              <div className="flex gap-2">
                                <select value={img.floor} onChange={(e) => { const val = e.target.value; supabase.from("media").update({ floor: val }).eq("id", img.id).then(() => fetchMedia()); }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[9px] font-bold text-hormozi-yellow outline-none">
                                  <option value="1">Piso 1</option><option value="2">Piso 2</option><option value="3">Piso 3</option><option value="Exterior">Exterior</option>
                                </select>
                                <select value={img.room_type} onChange={(e) => { const val = e.target.value; supabase.from("media").update({ room_type: val }).eq("id", img.id).then(() => fetchMedia()); }} className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[9px] font-bold outline-none">
                                  <option value="unassigned">¿Qué habitación es?</option><option value="sala">Sala</option><option value="cocina">Cocina</option><option value="principal">Habitación</option><option value="baño">Baño</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => processAI(img.id, "clean")} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase hover:bg-white/10 transition-all">Limpiar</button>
                                <button onClick={() => processAI(img.id, "stage")} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase hover:bg-white/10 transition-all">Amueblar</button>
                                <button onClick={() => removeImage(img.id, img.url)} className="py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all">Borrar</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <label className="border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.03] min-h-[300px]">
                          <Plus size={32} className="text-white/20" />
                          <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, floor)} accept="image/*" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-12">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Configuración</h2>
              <div className="glass-luxury p-8 rounded-3xl border border-white/10 space-y-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">Nombre del Proyecto</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl font-bold" />
                <button onClick={() => alert("Guardado")} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Guardar</button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 md:top-10 md:right-10 text-white/30 hover:text-white uppercase font-black text-[10px] tracking-widest flex items-center gap-3 z-50">Cerrar <X size={20} /></button>
            <div className="max-w-[1400px] w-full flex flex-col gap-6 md:gap-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Previsualización Tour 360</h3>
                <button 
                  onClick={() => { alert("🚀 ¡TOUR PUBLICADO! Los cambios ya se ven en la página principal."); setIsPreviewOpen(false); }}
                  className="px-10 py-4 bg-hormozi-yellow text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-hormozi-yellow/20"
                >
                  🚀 Mandar a Página Principal
                </button>
              </div>
              <div className="aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black">
                <TourViewer 
                  scenes={images
                    .filter(img => img.url && img.url.startsWith('http'))
                    .sort((a, b) => {
                      // Ordenar por Piso y luego por tipo
                      const floorOrder = (f: string) => f === 'Exterior' ? 0 : parseInt(f);
                      if (floorOrder(a.floor) !== floorOrder(b.floor)) return floorOrder(a.floor) - floorOrder(b.floor);
                      return (a.room_type || '').localeCompare(b.room_type || '');
                    })
                    .map((img: any) => ({ 
                      id: img.id, 
                      name: img.room_type && img.room_type !== 'unassigned' ? `${img.floor === 'Exterior' ? 'EXT.' : 'PISO ' + img.floor} - ${img.room_type.toUpperCase()}` : 'AMBIENTE', 
                      imageUrl: img.url, 
                      hotspots: [] 
                    }))} 
                  initialSceneId={images.find(i => i.floor === 'Exterior')?.id || images[0]?.id} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generatedVideoUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <div className="max-w-md w-full max-h-[95vh] overflow-y-auto bg-[#062b54] rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-6 md:p-10 space-y-6 relative shadow-2xl custom-scrollbar">
              <button onClick={() => { setGeneratedVideoUrl(null); setVideoBlob(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-50">
                <X size={28}/>
              </button>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Video Generado</h3>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Listo para compartir</p>
              </div>

              <div className="aspect-[9/16] max-h-[55vh] mx-auto bg-black rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={async () => {
                    if (!videoBlob) return;
                    setIsProcessing(true);
                    setCurrentAction("Publicando video...");
                    try {
                      // Obtenemos la primera propiedad para asignarle el video
                      const { data: prop } = await supabase.from('properties').select('id').limit(1).single();
                      if (!prop) throw new Error("No hay propiedad configurada");
                      
                      const path = `videos/video_${Date.now()}.mp4`;
                      const { error: uploadError } = await supabase.storage.from('propiedades').upload(path, videoBlob);
                      if (uploadError) throw uploadError;
                      
                      const url = `${supabaseUrl}/storage/v1/object/public/propiedades/${path}`;
                      const { error: updateError } = await supabase.from('properties').update({ video_url: url }).eq('id', prop.id);
                      if (updateError) throw updateError;

                      alert("🚀 ¡VIDEO PUBLICADO EN LA WEB PRINCIPAL!");
                      setGeneratedVideoUrl(null);
                    } catch (e: any) { 
                      alert("Error al publicar: " + e.message); 
                    } finally { 
                      setIsProcessing(false); 
                      setCurrentAction(null);
                    }
                  }} 
                  className="w-full py-5 bg-hormozi-yellow text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-hormozi-yellow/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  🚀 Publicar en Web
                </button>
                
                <button 
                  onClick={() => { const a = document.createElement("a"); a.href = generatedVideoUrl; a.download = "video_inmueble.mp4"; a.click(); }} 
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all"
                >
                  Bajar a mi celular / PC
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
