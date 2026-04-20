"use client";

import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  Trash2, 
  Video, 
  ChevronRight, 
  Upload,
  Home,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured, supabaseUrl } from "@/lib/supabase";
import TourViewer from "@/components/TourViewer";
import { generatePropertyVideo } from "@/lib/video-engine"; // Importamos el motor de video

export default function DashboardPage() {
  const [images, setImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTourIndex, setActiveTourIndex] = useState(0);

  const handleGenerateVideo = async () => {
    // Ahora permitimos todas las imágenes subidas, incluso las que ya traes limpias de fuera
    if (images.length === 0) {
      alert("Primero sube las fotos de la casa (ya limpias o amobladas).");
      return;
    }

    setIsProcessing(true);
    try {
      alert("🎬 Generando video con tus fotos... Esto tomará unos segundos.");
      
      const videoBlob = await generatePropertyVideo({
        imageUrls: images.map(img => img.url), // Usamos todas las fotos subidas
        title: "PROPIEDAD DESTACADA",
        price: "LISTA PARA ESTRENAR"
      });

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Video_Propiedad_${Date.now()}.mp4`;
      a.click();
      
      alert("✅ ¡Video Viral descargado con éxito!");
    } catch (error) {
      console.error(error);
      alert("Error al generar el video. Intenta subir menos de 5 fotos a la vez para mayor velocidad.");
    } finally {
      setIsProcessing(false);
    }
  };

  // El Tour ahora mostrará todo lo que subas
  const tourImages = images;

  // Cargar imágenes de Supabase
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

  const handleUpload = async (e: any, targetFloor: string = "1") => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

    if (!isSupabaseConfigured) {
      alert("⚠️ Error de Configuración: La aplicación todavía está usando la URL de prueba. Por favor, asegúrate de que en Vercel la variable se llame NEXT_PUBLIC_SUPABASE_URL.");
      return;
    }

    setIsUploading(true);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("propiedades")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

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

      if (dbError) {
        console.error("Error BD:", dbError);
      } else {
        setImages(prev => [...prev, mediaData]);
      }
    }

    setIsUploading(false);
  };

  const removeImage = async (id: string) => {
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

  const updateMetadata = async (id: string, field: string, value: string) => {
    const { error } = await supabase
      .from("media")
      .update({ [field]: value })
      .eq("id", id);

    if (!error) {
      setImages(images.map(img => img.id === id ? { ...img, [field]: value } : img));
    }
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
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

      if (!response.ok) {
        throw new Error(result.error || "Error en el servidor");
      }

      // POLLING: Si la IA está procesando (Replicate), esperamos desde el navegador (Evita error 504)
      if (result.status === "processing") {
        const predictionId = result.id;
        console.log("Esperando a la IA...", predictionId);
        
        while (result.status !== "succeeded" && result.status !== "failed") {
          await new Promise(r => setTimeout(r, 4000)); // Esperar 4 seg
          const pollRes = await fetch(`/api/ai?id=${predictionId}`);
          result = await pollRes.json();
        }
      }

      if (result.status === "failed") {
        throw new Error(result.error || "La IA falló al procesar la imagen");
      }
      
      const newUrl = result.outputUrl; 
      const newStatus = type === "clean" ? "cleaned" : "staged";

      await supabase
        .from("media")
        .update({ status: newStatus, url: newUrl })
        .eq("id", id);

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: newStatus, url: newUrl } : img
      ));
      
      alert(`✅ ¡Éxito! Imagen ${type === "clean" ? 'limpiada' : 'amoblada'}.`);
    } catch (error: any) {
      console.error("Error de IA:", error);
      alert(`Ups! Algo salió mal: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const floors = ["1", "2", "3", "Exterior"];

  return (
    <div className="flex h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-hormozi-yellow p-1.5 rounded-sm rotate-3">
            <Home size={20} className="text-black" />
          </div>
          <span className="font-black tracking-[0.3em] text-sm uppercase italic">SOTO <span className="text-hormozi-yellow">IA</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="flex items-center gap-4 w-full px-5 py-4 bg-white/5 rounded-xl text-hormozi-yellow font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard size={18} />
            Estudio de Diseño
          </button>
          <button className="flex items-center gap-4 w-full px-5 py-4 text-white/30 hover:text-white hover:bg-white/5 rounded-xl text-xs uppercase tracking-widest transition-all">
            <Settings size={18} />
            Configuración
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-black/10 backdrop-blur-md">
            <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">
              <span>PROYECTOS</span>
              <ChevronRight size={14} />
              <span className="text-white">Mansión Santander · Rev 01</span>
            </div>

            <div className="flex gap-4 items-center">
               {isUploading && <span className="flex items-center gap-2 text-[10px] font-bold text-hormozi-yellow animate-pulse"><Clock size={14}/> SUBIENDO...</span>}
              <button 
                onClick={handleGenerateVideo}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
              >
                <Video size={16} className="text-hormozi-yellow" />
                Generar Video Viral
              </button>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="btn-luxury"
                disabled={images.length === 0}
              >
                Ver Tour 360
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {images.length === 0 && !isUploading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full border border-dashed border-white/10 rounded-[3rem] p-24 flex flex-col items-center justify-center text-center bg-white/[0.01]"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                <Upload className="text-hormozi-yellow" size={32} />
              </div>
              <h2 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter italic">Carga tus fotos de Android</h2>
              <p className="text-white/30 max-w-sm mb-12 text-sm leading-relaxed">No importa la luz o el celular. Nuestra IA mejorará la calidad y aplicará el diseño por ti.</p>
              <label className="cursor-pointer px-12 py-5 bg-white text-black font-black rounded-2xl uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] text-sm">
                Seleccionar Fotos
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e)} accept="image/*" disabled={isUploading} />
              </label>
            </motion.div>
          ) : (
            <div className="space-y-24">
              {floors.map((floor) => {
                const floorImages = images.filter(img => img.floor === floor);
                if (floorImages.length === 0 && floor !== "1") return null;

                return (
                  <div key={floor} className="space-y-10">
                    <div className="flex items-center gap-6">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                        {floor === "Exterior" ? "Fachada y Exteriores" : `Piso ${floor}`}
                      </h3>
                      <div className="h-[1px] flex-1 bg-white/5" />
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">
                        {images.filter(img => img.floor === floor).length} Activos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {floorImages.map((img) => (
                         <motion.div key={img.id} layout className="glass-luxury rounded-[2rem] overflow-hidden group">
                           <div className="aspect-[4/3] relative overflow-hidden">
                             <img 
                                src={img.url} 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" 
                              />
                             <div className="absolute top-6 left-6">
                                {img.status !== 'original' && (
                                  <div className="px-4 py-1.5 bg-hormozi-yellow text-black text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                    <CheckCircle2 size={12}/> {img.status === 'cleaned' ? 'LIMPIA' : 'AMUEBLADA'}
                                  </div>
                                )}
                             </div>
                             <div className="absolute top-6 right-6 flex gap-2">
                               <button onClick={() => removeImage(img.id)} className="p-3 bg-red-500/20 text-red-500 rounded-xl backdrop-blur-3xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                 <Trash2 size={16} />
                               </button>
                             </div>
                             
                             {/* Overlay de acciones rápidas */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-8 gap-4">
                               <button 
                                 onClick={async () => {
                                   const newStatus = img.status === 'staged' ? 'original' : 'staged';
                                   await supabase.from("media").update({ status: newStatus }).eq("id", img.id);
                                   setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: newStatus } : i));
                                 }}
                                 className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[9px] font-bold rounded-lg uppercase tracking-[0.2em] border border-white/5 transition-all"
                               >
                                 {img.status === 'staged' ? 'Quitar Marca Final' : 'Marcar como Final (Link al Tour)'}
                               </button>
                             </div>
                           </div>
                           
                           <div className="p-6 space-y-4">
                             <div className="flex gap-2">
                               <select 
                                 value={img.floor}
                                 onChange={(e) => updateMetadata(img.id, "floor", e.target.value)}
                                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[10px] font-bold uppercase text-hormozi-yellow outline-none cursor-pointer"
                               >
                                 <option value="1">Piso 1</option>
                                 <option value="2">Piso 2</option>
                                 <option value="3">Piso 3</option>
                                 <option value="Exterior">Exterior</option>
                               </select>

                               <select 
                                 value={img.room_type}
                                 onChange={(e) => updateMetadata(img.id, "room_type", e.target.value)}
                                 className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[10px] font-bold uppercase outline-none cursor-pointer"
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

                             <div className="flex gap-3">
                                <button 
                                  onClick={() => processAI(img.id, "clean")} 
                                  disabled={isProcessing}
                                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-hormozi-yellow hover:text-black transition-all disabled:opacity-30"
                                >
                                  {isProcessing ? 'Procesando...' : 'Limpiar Espacio (IA)'}
                                </button>
                                <button 
                                  onClick={() => processAI(img.id, "stage")} 
                                  disabled={isProcessing}
                                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-30"
                                >
                                  {isProcessing ? 'Procesando...' : 'Amueblar Estilo (IA)'}
                                </button>
                             </div>
                           </div>
                         </motion.div>
                       ))}

                       <label className="border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.02] p-12 transition-all">
                          <Plus size={24} className="text-white/20" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Añadir Fotos</span>
                          <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, floor)} accept="image/*" />
                       </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Visor de Tour Virtual */}
      <AnimatePresence>
        {isPreviewOpen && tourImages.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-12"
          >
             <button 
               onClick={() => setIsPreviewOpen(false)}
               className="absolute top-10 right-10 text-white/50 hover:text-white transition-all text-sm font-bold uppercase tracking-widest"
             >
               Esc · Cerrar Estudio
             </button>

             <div className="max-w-6xl w-full space-y-8">
                <TourViewer 
                  scenes={tourImages.map((img: any) => ({
                    id: img.id,
                    name: img.room_type || "Espacio",
                    imageUrl: img.url,
                    hotspots: []
                  }))}
                  initialSceneId={tourImages[activeTourIndex]?.id}
                />

                <div className="flex justify-center gap-4">
                   {tourImages.map((img, idx) => (
                     <button 
                        key={img.id}
                        onClick={() => setActiveTourIndex(idx)}
                        className={`w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all ${idx === activeTourIndex ? 'border-hormozi-yellow scale-110 shadow-[0_0_20px_rgba(255,255,0,0.2)]' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                     >
                        <img src={img.url} className="w-full h-full object-cover" />
                     </button>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
