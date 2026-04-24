"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ChevronLeft, ChevronRight, Play, X, MessageCircle, 
  Home, Eye, ArrowLeft, CheckCircle, Sparkles, BedDouble, Bath, Square, Car 
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import TourViewer from "@/components/TourViewer";
import { supabase } from "@/lib/supabase";

// ── COMPONENTE MÁGICO DE COMPARACIÓN ──
function MagicSlider({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-[3rem] overflow-hidden cursor-ew-resize border-2 border-white/10 group shadow-2xl"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <img src={after} className="absolute inset-0 w-full h-full object-cover" alt="Después" />
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/30"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={before} className="absolute inset-0 w-full h-full object-cover" alt="Antes" />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ left: `${sliderPos}%` }}>
        <div className="h-full w-0.5 bg-white shadow-xl relative">
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-xl border-4 border-[#062b54]">
             <ArrowLeftRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftRight({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20"/>
        </svg>
    )
}

export default function PropertyDynamicPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoCarouselIndex, setAutoCarouselIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        let query = supabase.from('properties').select('*');
        if (id.length > 20) {
            query = query.eq('id', id);
        } else {
            query = query.or(`slug.eq.${id},title.ilike.%${id.replace(/-/g, ' ')}%`);
        }
        const { data: propData } = await query.maybeSingle();
        if (!propData) {
            const { data: retry } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
            if (retry) setProperty(retry);
        } else {
            setProperty(propData);
        }
        const actualId = propData?.id || id;
        const { data: mediaData } = await supabase.from("media").select("*").eq("property_id", actualId).order("created_at", { ascending: true });
        setImages(mediaData || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setAutoCarouselIndex(prev => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [images]);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-hormozi-yellow"></div>
    </div>
  );

  if (!property) return null;

  const tourScenes = images.map(img => ({
    id: img.id,
    name: img.room_type?.toUpperCase() || "CASA",
    imageUrl: img.url,
    hotspots: []
  }));

  const stagedImg = images.find(img => img.status === 'staged');
  const originalImg = images.find(img => img.status === 'original' || img.status === 'enhanced');

  const WHATSAPP_URL = `https://wa.me/573001234567?text=${encodeURIComponent(`¡Hola! Estoy viendo "${property.title}" y quiero una cita.`)}`;

  return (
    <main className="min-h-screen bg-[#062b54] text-white selection:bg-hormozi-yellow selection:text-black">
      
      {/* ── 1. TICKER (LLAMATIVO) ── */}
      <div className="bg-hormozi-yellow text-black py-2.5 overflow-hidden whitespace-nowrap sticky top-0 z-[100] border-b-2 border-black/10">
        <motion.div 
          initial={{ x: 0 }} 
          animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center font-black text-[10px] uppercase tracking-[0.3em] italic">
              <span>Entrega Inmediata</span> <Sparkles size={14} />
              <span>Créditos se aceptan</span> <CheckCircle size={14} />
              <span>Sin Intermediarios</span> <Sparkles size={14} />
              <span>Oportunidad de Inversión</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── 2. EL TOUR 360 (LIMPIO) ── */}
      <section className="relative h-[80vh] bg-black overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
        <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
        
        {/* Marcador superior mejorado */}
        <div className="absolute top-8 left-8 z-20">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#062b54]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-hormozi-yellow">Vivencia <span className="text-white">Real 360°</span></span>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="absolute top-8 right-8 z-30">
          <Link href="/" className="p-4 bg-black/40 backdrop-blur-md rounded-2xl hover:bg-black/60 border border-white/5 transition-all">
             <X size={20} />
          </Link>
        </div>

        {/* Overlay inferior difuminado */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#062b54] via-[#062b54]/40 to-transparent z-10" />
      </section>

      {/* ── 3. BOTONES DE ACCIÓN (CON AIRE) ── */}
      <div className="relative z-30 -mt-16 px-6 max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href={WHATSAPP_URL} target="_blank" className="relative group overflow-hidden py-7 bg-green-500 text-white font-black rounded-3xl uppercase text-[11px] tracking-widest shadow-[0_20px_50px_rgba(34,197,94,0.3)] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 skew-x-12 transition-transform duration-500" />
            <MessageCircle size={22} /> ¡Quiero conocerla ya!
          </a>
          <button 
            onClick={() => document.getElementById('seccion-video')?.scrollIntoView({ behavior: 'smooth' })} 
            className="py-7 bg-white text-black font-black rounded-3xl uppercase text-[11px] tracking-widest shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 hover:bg-hormozi-yellow transition-all"
          >
            <Play size={22} fill="currentColor" /> Ver Video Recorrido
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 max-w-[1400px] mx-auto py-24 space-y-40 pb-40">
        
        {/* ── 4. VIDEO REEL (AUTO-PLAY) ── */}
        {property.video_url && (
          <section id="seccion-video" className="space-y-10">
             <div className="text-center space-y-3">
               <div className="text-hormozi-yellow text-[10px] font-black uppercase tracking-[0.4em]">Experiencia Cinematic</div>
               <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                 Venta en <span className="text-hormozi-yellow">Movimiento</span>
               </h2>
             </div>
             <div className="aspect-video max-w-6xl mx-auto rounded-[4rem] overflow-hidden border-4 border-white/5 shadow-[0_60px_100px_rgba(0,0,0,0.6)] bg-black">
                <video 
                  src={property.video_url} 
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover"
                />
             </div>
          </section>
        )}

        {/* ── 5. CARRUSEL AUTOMÁTICO ── */}
        <section className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-4">
                 <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">Álbum <span className="text-hormozi-yellow">Pro</span></h2>
                 <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Las fotos cambian automáticamente para ti</p>
              </div>
              <div className="hidden md:flex gap-2">
                 {images.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === autoCarouselIndex ? 'w-10 bg-hormozi-yellow' : 'w-4 bg-white/10'}`} />
                 ))}
              </div>
            </div>
           
           <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[4rem] overflow-hidden border-2 border-white/10 bg-black/20 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={autoCarouselIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  src={images[autoCarouselIndex]?.url}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => { setCurrentPhoto(autoCarouselIndex); setLightboxOpen(true); }}
                />
              </AnimatePresence>
           </div>

           {/* Individuales */}
           <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
              {images.map((img, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -5 }}
                  className={`flex-shrink-0 w-48 md:w-64 aspect-video rounded-[2rem] overflow-hidden border-2 transition-all cursor-pointer ${i === autoCarouselIndex ? 'border-hormozi-yellow shadow-2xl scale-[0.98]' : 'border-white/5 opacity-50'}`}
                  onClick={() => setAutoCarouselIndex(i)}
                >
                  <img src={img.url} className="w-full h-full object-cover" />
                </motion.div>
              ))}
           </div>
        </section>

        {/* ── 6. FICHA TÉCNICA Y MAGIA ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-start">
           <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-3 px-5 py-2 bg-hormozi-yellow/10 text-hormozi-yellow rounded-full border border-hormozi-yellow/20">
                    <MapPin size={18} /> <span className="font-black text-[11px] uppercase tracking-widest">{property.location}</span>
                 </div>
                 <h1 className="text-6xl md:text-[8rem] font-extrabold uppercase italic tracking-tighter leading-[0.8]">
                    {property.title}
                 </h1>
                 <p className="text-xl md:text-3xl text-white/70 leading-relaxed font-medium">
                    {property.description}
                 </p>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { ic: <BedDouble size={28} />, val: "3", l: "Cuartos" },
                  { ic: <Bath size={28} />, val: "2", l: "Baños" },
                  { ic: <Square size={28} />, val: "125", l: "m² Área" },
                  { ic: <Car size={28} />, val: "1", l: "Garaje" }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-10 rounded-[3rem] border border-white/5 flex flex-col items-center">
                    <div className="text-hormozi-yellow mb-4">{s.ic}</div>
                    <div className="text-3xl font-black italic mb-1">{s.val}</div>
                    <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{s.l}</div>
                  </div>
                ))}
              </div>
           </div>

           <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32">
              <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                 <div className="text-black/40 font-black uppercase tracking-widest text-[10px] mb-4">Inversión para Vivir</div>
                 <div className="text-6xl md:text-8xl font-black italic tracking-tighter text-black leading-none mb-10">
                   ${property.price?.toLocaleString()}
                 </div>
                 <div className="h-px bg-black/10 w-full mb-10" />
                 <a href={WHATSAPP_URL} target="_blank" className="w-full py-7 bg-[#062b54] text-white flex items-center justify-center gap-4 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all">
                    Agendar ahora <ChevronRight size={20}/>
                 </a>
              </div>

              {/* Slider IA mejor integrado */}
              {stagedImg && originalImg && (
                <div className="bg-[#062b54] p-8 rounded-[4rem] border border-white/10 space-y-6 shadow-2xl">
                   <div className="flex items-center justify-between px-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-hormozi-yellow">Visión IA</span>
                     <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Desliza para amueblar</span>
                   </div>
                   <MagicSlider before={originalImg.url} after={stagedImg.url} />
                </div>
              )}
           </div>
        </section>

      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/98 flex items-center justify-center p-6"
            onClick={() => setLightboxOpen(false)}
          >
            <img src={images[currentPhoto].url} className="max-h-full max-w-full rounded-3xl shadow-2xl border border-white/10" />
            <button className="absolute top-10 right-10 p-6 text-white bg-white/10 rounded-full"><X size={32}/></button>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
