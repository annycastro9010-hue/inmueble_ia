"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Settings, Trash2, Video, ChevronRight,
  Upload, Home, ExternalLink, X, Sparkles, CheckCircle2,
  ArrowLeftRight, Wand2, RefreshCw, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, supabaseUrl } from "@/lib/supabase";
import TourViewer from "@/components/TourViewer";
import { generatePropertyVideo } from "@/lib/video-engine";
import { autoEnhanceImage } from "@/lib/image-enhancer";
import Link from "next/link";

// Removed hardcoded MASTER_ID to support multi-property dynamic routing

interface AIResultModal {
  beforeUrl: string;
  afterUrl: string;
  imageId: string;
  type: "clean" | "stage";
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"inmuebles" | "estudio" | "config">("inmuebles");
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AIResultModal | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const [propertyPrice, setPropertyPrice] = useState("0");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const formattedPrice = (parseFloat(propertyPrice?.toString().replace(/[^0-9.]/g, '') || "0")).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    if (data) setAllProperties(data);
    setLoading(false);
  };

  const selectProperty = async (id: string) => {
    setActivePropertyId(id);
    setActiveTab("estudio");
    setLoading(true);
    
    const { data: propData } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
    if (propData) {
      setProjectName(propData.title);
      setPropertyPrice(propData.price?.toString() || "0");
      setPropertyLocation(propData.location || "");
      setPropertyDescription(propData.description || "");
    }

    const { data: mediaData } = await supabase.from("media").select("*").eq("property_id", id).order("created_at", { ascending: true });
    setImages(mediaData || []);
    setLoading(false);
  };

  const createNewProperty = async () => {
    const title = prompt("Introduce el nombre del nuevo inmueble:");
    if (!title) return;

    const { data, error } = await supabase.from("properties").insert({
      title,
      price: 0,
      location: "Sin ubicación",
      description: "Nueva descripción",
      status: "draft"
    }).select().single();

    if (error) return alert("Error: " + error.message);
    setAllProperties([data, ...allProperties]);
    selectProperty(data.id);
  };

  const handleSaveProperty = async () => {
    if (!activePropertyId) return;
    setIsProcessing(true);
    setCurrentAction("Guardando cambios...");
    try {
      await supabase.from("properties").update({
        title: projectName,
        price: parseFloat(propertyPrice.replace(/[^0-9.]/g, '')) || 0,
        location: propertyLocation,
        description: propertyDescription
      }).eq("id", activePropertyId);
      alert("✅ ¡Información actualizada!");
      fetchProperties();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleGenerateVideo = async () => {
    const validImages = images.filter(img => img.url);
    if (validImages.length === 0) return alert("Sube fotos primero.");
    setIsProcessing(true);
    setCurrentAction("Generando Video Cinematic...");
    try {
      const blob = await generatePropertyVideo({
        imageUrls: validImages.map(img => img.url),
        title: projectName,
        price: formattedPrice || "OPORTUNIDAD ÚNICA"
      });
      
      const vUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(vUrl);
      setVideoBlob(blob);

      // Subir video a Supabase
      setCurrentAction("Guardando video en la nube...");
      const videoFileName = `video_${activePropertyId}_${Date.now()}.mp4`;
      const { error: uploadErr } = await supabase.storage
        .from("propiedades")
        .upload(`videos/${videoFileName}`, blob, { contentType: 'video/mp4' });

      if (!uploadErr) {
        const publicVideoUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/videos/${videoFileName}`;
        await supabase.from("properties").update({ video_url: publicVideoUrl }).eq("id", activePropertyId);
        alert("✅ ¡Video generado y guardado!");
      }

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleUpload = async (e: any, targetFloor: string = "1") => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setCurrentAction(`Foto ${i + 1}/${files.length}: Analizando calidad...`);
      let finalBlob: Blob = file;
      let enhancedStatus = 'original';

      try {
        const enhancement = await autoEnhanceImage(file);
        finalBlob = enhancement.blob;
        enhancedStatus = enhancement.enhanced ? 'enhanced' : 'original';
        setCurrentAction(`Foto ${i + 1}/${files.length}: ${enhancement.message}`);
      } catch {
        console.warn('[Upload] Mejora falló, usando original');
      }

      setCurrentAction(`Foto ${i + 1}/${files.length}: Subiendo...`);
      const ext = enhancedStatus === 'enhanced' ? 'jpg' : (file.name.split('.').pop() || 'jpg');
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("propiedades")
        .upload(`uploads/${fileName}`, finalBlob, { contentType: 'image/jpeg' });

      if (!uploadError) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/uploads/${fileName}`;
        const { data } = await supabase.from("media")
          .insert([{ url: publicUrl, floor: targetFloor, room_type: "unassigned", status: enhancedStatus, property_id: activePropertyId }])
          .select().single();
        if (data) setImages(prev => [...prev, data]);
      }
    }

    setIsUploading(false);
    setCurrentAction(null);
  };

  /** Re-procesa con el enhancer las imágenes que ya estaban subidas antes del pipeline */
  const enhanceExistingImages = async () => {
    const toEnhance = images.filter(img => img.status === 'original');
    if (toEnhance.length === 0) return alert("Todas las imágenes ya están en HD ✅");
    setIsProcessing(true);
    for (let i = 0; i < toEnhance.length; i++) {
      const img = toEnhance[i];
      setCurrentAction(`Mejorando foto ${i + 1}/${toEnhance.length}...`);
      try {
        const res = await fetch('/api/enhance', {
          method: 'POST',
          body: await (async () => {
            const fd = new FormData();
            const blob = await fetch(img.url).then(r => r.blob());
            fd.append('file', blob, 'image.jpg');
            return fd;
          })()
        });
        const result = await res.json();
        if (result.enhanced && result.dataUrl) {
          // Subir la versión mejorada
          const enhanced = await fetch(result.dataUrl).then(r => r.blob());
          const fileName = `enhanced_${Date.now()}.jpg`;
          const { error } = await supabase.storage.from('propiedades').upload(`uploads/${fileName}`, enhanced, { contentType: 'image/jpeg' });
          if (!error) {
            const newUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/uploads/${fileName}`;
            await supabase.from('media').update({ url: newUrl, status: 'enhanced' }).eq('id', img.id);
            setImages(prev => prev.map(m => m.id === img.id ? { ...m, url: newUrl, status: 'enhanced' } : m));
          }
        }
      } catch { /* continuar con la siguiente */ }
    }
    setIsProcessing(false);
    setCurrentAction(null);
    alert('✅ ¡Mejora HD completada!');
  };

  const removeImage = async (id: string) => {
    if (!confirm("¿Borrar foto?")) return;
    await supabase.from("media").delete().eq("id", id);
    setImages(prev => prev.filter(img => img.id !== id));
  };

  /** Procesa con IA y muestra modal antes/después */
  const processAI = async (id: string, type: "clean" | "stage") => {
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) return;

    const beforeUrl = targetImage.url; // Guardar URL original para el "Antes"

    setIsProcessing(true);
    setCurrentAction(
      type === "clean"
        ? "🧹 IA limpiando la habitación..."
        : "🛋️ IA amoblando con estilo moderno..."
    );

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: targetImage.url,
          roomType: targetImage.room_type || 'sala',
          mode: type
        })
      });

      const result = await res.json();

      if (result.error) throw new Error(result.error);

      if (result.outputUrl) {
        let finalUrl = result.outputUrl;

        // Si la IA devuelve Base64 (Gemini), lo subimos a Supabase Storage
        // para tener una URL real y estable para futuros procesos (como amoblar tras limpiar)
        if (finalUrl.startsWith('data:')) {
          const blob = await (await fetch(finalUrl)).blob();
          const fileName = `ai_${type}_${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("media")
            .upload(fileName, blob, { contentType: 'image/jpeg' });

          if (uploadError) throw new Error(`Error subiendo resultado IA: ${uploadError.message}`);

          const { data: { publicUrl } } = supabase.storage
            .from("media")
            .getPublicUrl(fileName);
          
          finalUrl = publicUrl;
        }

        const newStatus = type === "clean" ? "cleaned" : "staged";

        // Insertar como nueva versión en lugar de sobrescribir para el slider del antes/después
        const { data: newData, error: insertErr } = await supabase.from("media")
          .insert([{ 
            url: finalUrl, 
            status: newStatus, 
            floor: targetImage.floor, 
            room_type: targetImage.room_type, 
            property_id: activePropertyId 
          }])
          .select().single();

        if (newData) {
          setImages(prev => [...prev, newData]);
          // Mostrar modal antes/después para feedback inmediato
          setSliderPos(50);
          setAiResult({
            beforeUrl,
            afterUrl: finalUrl,
            imageId: newData.id,
            type
          });
        }
      } else {
        throw new Error("La IA no devolvió ninguna imagen. Revisa que GOOGLE_AI_STUDIO_API_KEY esté configurada.");
      }
    } catch (e: any) {
      alert(`❌ Error IA: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'enhanced') return <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-full uppercase"><Sparkles size={8}/> HD</div>;
    if (status === 'cleaned') return <div className="flex items-center gap-1 px-2 py-0.5 bg-hormozi-yellow text-black text-[8px] font-black rounded-full uppercase"><CheckCircle2 size={8}/> Limpia</div>;
    if (status === 'staged') return <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500 text-white text-[8px] font-black rounded-full uppercase"><CheckCircle2 size={8}/> Amueblada</div>;
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow">

      {/* ── SIDEBAR ── */}
      <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col p-6 z-40 lg:h-screen lg:sticky lg:top-0">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-hormozi-yellow p-1.5 rounded-sm rotate-3"><Home size={20} className="text-black" /></div>
            <span className="font-black tracking-[0.3em] text-sm uppercase italic leading-none">SOTO <span className="text-hormozi-yellow">IA</span></span>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-3 w-full">
          {/* VOLVER - Ahora arriba y destacado */}
          <Link href="/" className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full bg-white text-black hover:bg-hormozi-yellow shadow-xl shadow-white/5">
            <ArrowLeftRight size={18} /> Ver Web Pública
          </Link>

          <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em] mb-2 px-5">Gestión</div>
          <button onClick={() => setActiveTab("inmuebles")} className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full ${activeTab === "inmuebles" ? "bg-white/10 text-hormozi-yellow shadow-inner" : "text-white/30 hover:text-white hover:bg-white/5"}`}>
            <Home size={18} /> Mis Inmuebles
          </button>

          {activePropertyId && (
            <>
              <button onClick={() => setActiveTab("estudio")} className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full ${activeTab === "estudio" ? "bg-white/10 text-hormozi-yellow shadow-inner" : "text-white/30 hover:text-white hover:bg-white/5"}`}>
                <LayoutDashboard size={18} /> Estudio Fotografías
              </button>
              
              <button onClick={() => setActiveTab("config")} className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full ${activeTab === "config" ? "bg-white/10 text-hormozi-yellow shadow-inner" : "text-white/30 hover:text-white hover:bg-white/5"}`}>
                <Settings size={18} /> Configuración Web
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 hidden lg:block">
           <div className="text-[8px] font-black uppercase tracking-widest text-white/10 text-center">Panel de Control v4.0</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#041f3a]/30">

        {/* Header */}
        <header className="py-5 border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-8 gap-4">
          <div className="flex items-center gap-4">
            {/* Botón Volver - Visible en Móvil aquí, en Desktop en Sidebar */}
            <Link href="/" className="lg:hidden p-2 bg-white/10 rounded-xl">
              <ArrowLeftRight size={20} />
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">
              <span>EDITOR</span> <ChevronRight size={14} /> <span className="text-white">{projectName}</span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={enhanceExistingImages}
              title="Mejorar calidad de fotos ya subidas"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600/40 transition-all text-blue-400"
            >
              <RefreshCw size={14} /> Mejorar HD
            </button>
            <button 
              onClick={() => {
                if (images.length === 0) return alert("Sube al menos una foto primero.");
                // Si ya hay un video (podemos chequearlo con el estado del proyecto)
                // Por ahora usamos una confirmación simple
                if (confirm("¿Generar nuevo video? Esto reemplazará el video actual de la propiedad.")) {
                  handleGenerateVideo();
                }
              }} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <Video size={14} className="text-hormozi-yellow" /> Video
            </button>
            <button 
              onClick={() => {
                if (confirm("Deseas abrir el editor de Tour 360?")) {
                  setIsPreviewOpen(true);
                }
              }} 
              className="px-6 py-2.5 bg-hormozi-yellow text-black font-black uppercase text-[9px] tracking-widest rounded-xl hover:scale-105 transition-all"
            >
              Tour 360
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-[#062b54]/40 backdrop-blur-sm flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-t-hormozi-yellow border-white/10 rounded-full animate-spin" />
            </div>
          )}

          {activeTab === "inmuebles" ? (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Mis <span className="text-hormozi-yellow">Inmuebles</span></h2>
                <button onClick={createNewProperty} className="px-8 py-4 bg-hormozi-yellow text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-hormozi-yellow/20">
                  + Crear Nuevo Inmueble
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProperties.map(prop => (
                  <motion.div 
                    key={prop.id}
                    whileHover={{ y: -5 }}
                    onClick={() => selectProperty(prop.id)}
                    className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 cursor-pointer hover:border-hormozi-yellow/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-hormozi-yellow/5 blur-3xl rounded-full" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black uppercase text-hormozi-yellow/60 tracking-widest mb-2 flex items-center gap-2">
                        <MapPin size={12}/> {prop.location || 'Sin ubicación'}
                      </div>
                      <h3 className="text-xl font-black uppercase italic tracking-tight mb-4 group-hover:text-hormozi-yellow transition-colors leading-none">
                        {prop.title}
                      </h3>
                      <div className="flex justify-between items-end">
                        <div className="text-2xl font-black text-white/90 italic tracking-tighter">
                          ${prop.price?.toLocaleString() || '0'}
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-hormozi-yellow group-hover:text-black transition-all">
                          <ChevronRight size={20}/>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {allProperties.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="text-white/20 font-black uppercase tracking-widest text-sm mb-2">No tienes inmuebles todavía</div>
                    <button onClick={createNewProperty} className="text-hormozi-yellow font-bold uppercase text-[10px] tracking-widest hover:underline">Haga clic aquí para empezar</button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "estudio" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/40 rounded-[2rem] overflow-hidden border border-white/5 group hover:border-white/20 transition-all"
                >
                  <div className="aspect-video relative overflow-hidden bg-black/60">
                    <img
                      src={img.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      crossOrigin="anonymous"
                      alt="Imagen propiedad"
                    />
                    {/* Botón borrar */}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={13}/>
                    </button>
                    {/* Badge de estado */}
                    <div className="absolute top-3 left-3">{statusBadge(img.status)}</div>
                  </div>

                  {/* Acciones IA */}
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => processAI(img.id, "clean")}
                        className="py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <X size={12} className="text-yellow-400" /> Limpiar
                      </button>
                      <button
                        onClick={() => processAI(img.id, "stage")}
                        className="py-3 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:from-purple-600/50 hover:to-blue-600/50 transition-all flex items-center justify-center gap-1.5 text-purple-300"
                      >
                        <Wand2 size={12} /> Amoblar IA
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Upload card */}
              <label className="border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-hormozi-yellow/40 hover:bg-hormozi-yellow/5 transition-all group">
                <Upload size={28} className="text-white/20 mb-3 group-hover:text-hormozi-yellow/60 transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50">Subir Fotos</span>
                <span className="text-[8px] text-white/20 mt-1">Se mejoran automáticamente</span>
                <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            </div>

          ) : (
            /* Configuración */
            <div className="max-w-2xl space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-hormozi-yellow">Configuración del Inmueble</h2>
              <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Título del Anuncio</label>
                  <input value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-lg font-bold outline-none focus:border-hormozi-yellow transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Precio</label>
                    <input value={propertyPrice} onChange={e => setPropertyPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-hormozi-yellow outline-none focus:border-hormozi-yellow transition-colors" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Ubicación</label>
                    <input value={propertyLocation} onChange={e => setPropertyLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:border-hormozi-yellow transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Descripción</label>
                  <textarea value={propertyDescription} onChange={e => setPropertyDescription(e.target.value)} rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none resize-none focus:border-hormozi-yellow transition-colors" />
                </div>
                <button onClick={handleSaveProperty} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-hormozi-yellow transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── OVERLAY: Procesando ── */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-[#062b54]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-t-hormozi-yellow border-white/10 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wand2 size={28} className="text-hormozi-yellow animate-pulse" />
              </div>
            </div>
            <h5 className="text-xl font-black italic uppercase tracking-[0.2em] mb-2">{currentAction}</h5>
            <p className="text-white/30 text-xs uppercase tracking-widest">La IA está trabajando, esto puede tardar hasta 30 segundos...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Resultado IA Antes/Después ── */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#062b54] rounded-[3rem] border border-white/10 max-w-4xl w-full p-6 md:p-10 shadow-2xl relative"
            >
              <button onClick={() => setAiResult(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <X size={20}/>
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                  <Wand2 size={10}/> IA Completada
                </div>
                <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">
                  {aiResult.type === 'stage' ? 'Habitación Amueblada' : 'Habitación Limpia'}
                  {' '}<span className="text-hormozi-yellow">con IA</span>
                </h3>
                <p className="text-white/40 text-xs mt-2 flex items-center gap-2">
                  <ArrowLeftRight size={12}/> Desliza el control para comparar antes y después
                </p>
              </div>

              {/* Slider Antes/Después */}
              <div
                className="relative rounded-2xl overflow-hidden select-none"
                style={{ aspectRatio: '16/9' }}
              >
                {/* DESPUÉS (fondo completo) */}
                <img
                  src={aiResult.afterUrl}
                  alt="Después"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* ANTES (clip por la derecha del slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={aiResult.beforeUrl}
                    alt="Antes"
                    className="w-full h-full object-cover"
                    style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }}
                  />
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 rounded-full text-[9px] font-black uppercase tracking-widest">ANTES</div>
                <div className="absolute top-4 right-4 px-3 py-1 bg-hormozi-yellow text-black rounded-full text-[9px] font-black uppercase tracking-widest">DESPUÉS</div>

                {/* Línea separadora */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] cursor-ew-resize"
                  style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
                    <ArrowLeftRight size={16} className="text-black"/>
                  </div>
                </div>

                {/* Input range para controlar el slider */}
                <input
                  type="range" min={0} max={100} value={sliderPos}
                  onChange={e => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                />
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setAiResult(null)}
                  className="flex-1 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-hormozi-yellow transition-colors"
                >
                  ✅ Guardar y continuar
                </button>
                <button
                  onClick={() => {
                    processAI(aiResult.imageId, aiResult.type);
                    setAiResult(null);
                  }}
                  className="py-4 px-8 bg-white/5 border border-white/10 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14}/> Reintentar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Tour Preview ── */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 md:p-10"
          >
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white flex items-center gap-2 text-xs font-black uppercase">
              <X size={20}/> Cerrar
            </button>
            <div className="w-full max-w-6xl aspect-video rounded-[3rem] overflow-hidden bg-black shadow-2xl border border-white/10">
              <TourViewer
                scenes={images.map(img => ({ id: img.id, name: img.room_type?.toUpperCase() || 'ESPACIO', imageUrl: img.url, hotspots: [] }))}
                initialSceneId={images[0]?.id}
                autoPlay={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Video generado ── */}
      {generatedVideoUrl && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-[#062b54] p-8 rounded-[3rem] border border-white/10 max-w-sm w-full relative">
            <button onClick={() => setGeneratedVideoUrl(null)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
            <h4 className="text-xl font-black uppercase italic tracking-tighter mb-6">Video Listo 🎬</h4>
            <video src={generatedVideoUrl} controls autoPlay loop className="w-full aspect-[9/16] rounded-2xl bg-black mb-6 shadow-2xl" />
            <button
              onClick={async () => {
                setIsProcessing(true);
                setCurrentAction("Publicando en la web...");
                const path = `v_${Date.now()}.mp4`;
                await supabase.storage.from('propiedades').upload(path, videoBlob!);
                const url = `${supabaseUrl}/storage/v1/object/public/propiedades/${path}`;
                await supabase.from('properties').update({ video_url: url }).eq('id', activePropertyId);
                alert("🚀 ¡Video publicado!");
                setGeneratedVideoUrl(null);
                setIsProcessing(false);
                setCurrentAction(null);
              }}
              className="w-full py-4 bg-hormozi-yellow text-black font-black rounded-2xl uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
            >
              Publicar en Web
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
