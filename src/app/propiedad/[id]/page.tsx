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
      className="relative w-full aspect-video rounded-[3rem] overflow-hidden cursor-ew-resize border-4 border-white/10 group shadow-2xl"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Después (Amueblado) */}
      <img src={after} className="absolute inset-0 w-full h-full object-cover" alt="Amueblado" />
      
      {/* Antes (Vacío) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/30"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={before} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5]" alt="Vacío" />
      </div>

      {/* Selector */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="h-full w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] relative">
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-xl border-4 border-hormozi-yellow">
            <ArrowLeftRight size={16} />
          </div>
        </div>
      </div>

      {/* Etiquetas */}
      <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
         Original
      </div>
      <div className="absolute top-8 right-8 bg-hormozi-yellow text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-hormozi-yellow/20 opacity-90 group-hover:opacity-100 transition-opacity">
         IA Amueblada ✨
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
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: propData } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
        setProperty(propData);

        const { data: mediaData } = await supabase.from('media').select('*').eq('property_id', id).order('created_at', { ascending: true });
        setImages(mediaData || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-hormozi-yellow"></div>
    </div>
  );

  if (!property) return null;

  const displayPhotos = images.length > 0 ? images.map(img => img.url) : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600"];
  
  // Encontrar pareja para el slider mágico
  const stagedImg = images.find(img => img.ai_status === 'staged' || img.is_processed);
  const originalImg = images.find(img => img.ai_status !== 'staged' && !img.is_processed);

  const tourScenes = images.map(img => ({
    id: img.id,
    name: img.room_type?.toUpperCase() || "ESPACIO",
    imageUrl: img.url,
    hotspots: []
  }));

  const WHATSAPP_URL = `https://wa.me/573001234567?text=${encodeURIComponent(`¡Hola! Acabo de ver "${property.title}" en el portal y me encantó. ¿Cuándo podemos verla?`)}`;

  return (
    <main className="min-h-screen bg-[#062b54] text-white selection:bg-hormozi-yellow selection:text-black">
      
      {/* ── BARRA DE URGENCIA (TICKER) ── */}
      <div className="bg-hormozi-yellow text-black py-3 overflow-hidden whitespace-nowrap sticky top-0 z-[100] border-b-2 border-black/10">
        <motion.div 
          initial={{ x: 0 }} animate={{ x: "-50%" }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-16 items-center font-black text-xs md:text-sm uppercase tracking-[0.4em] italic">
              <span>Entrega Inmediata</span> <Sparkles size={16} />
              <span>Financiación 100%</span> <CheckCircle size={16} />
              <span>Venta Sin Intermediarios</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <nav className="p-6 md:p-10 flex justify-between items-center max-w-[1600px] mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-all">
             <ChevronLeft size={24} />
          </div>
          <span className="font-black tracking-widest text-[11px] uppercase opacity-60">Volver al catálogo</span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Disponible Hoy</span>
        </div>
      </nav>

      <section className="px-6 md:px-16 max-w-[1600px] mx-auto pb-40">
        
        {/* TITULO Y PRECIO (GIGANTE) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
           <div className="space-y-4 max-w-4xl">
              <div className="flex items-center gap-3 text-hormozi-yellow font-black uppercase tracking-[0.3em] text-xs">
                 <MapPin size={18} /> {property.location}
              </div>
              <h1 className="text-6xl md:text-[9rem] font-black uppercase italic tracking-tighter leading-[0.85]">
                 {property.title.split(' ').map((word: string, i: number) => (
                    <span key={i} className={i % 2 !== 0 ? "text-hormozi-yellow" : ""}>{word} </span>
                 ))}
              </h1>
           </div>
           <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-2">Precio de Venta</div>
              <div className="text-5xl md:text-7xl font-black italic tracking-tighter text-hormozi-yellow">
                ${property.price?.toLocaleString()}
              </div>
           </div>
        </div>

        {/* --- EL MOMENTO WOW: COMPARADOR MÁGICO --- */}
        <div className="mb-32">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-0.5 w-12 bg-hormozi-yellow" />
             <h2 className="text-2xl font-black uppercase italic tracking-widest">Efecto <span className="text-hormozi-yellow">Magia IA</span></h2>
             <span className="text-[10px] uppercase font-bold text-white/30 italic">Desliza para ver el potencial</span>
          </div>
          {stagedImg && originalImg ? (
             <MagicSlider before={originalImg.url} after={stagedImg.url} />
          ) : (
            <div className="relative aspect-video rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
               <img src={displayPhotos[0]} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* --- ACCIÓN RÁPIDA (BOTONES GIGANTES) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
           <a 
            href={WHATSAPP_URL} 
            target="_blank"
            className="group relative h-32 md:h-48 bg-green-500 rounded-[2.5rem] flex items-center justify-center gap-6 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-green-500/20"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <MessageCircle size={48} className="text-white" />
              <div className="text-left">
                 <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Dudas o Citas</div>
                 <div className="text-2xl md:text-4xl font-black uppercase italic text-white leading-none">Hablar por <span className="underline italic">WhatsApp</span></div>
              </div>
           </a>

           <button 
            onClick={() => setShowTour(true)}
            className="group relative h-32 md:h-48 bg-white rounded-[2.5rem] flex items-center justify-center gap-6 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/10"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Eye size={48} className="text-black" />
              <div className="text-left text-black">
                 <div className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Inmersión Total</div>
                 <div className="text-2xl md:text-4xl font-black uppercase italic leading-none">Ver Tour <span className="underline">360°</span></div>
              </div>
           </button>
        </div>

        {/* --- DETALLES TÉCNICOS (SIMPLE PARA ABUELOS) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32">
           {[
             { icon: <BedDouble />, val: "3", label: "Habitaciones" },
             { icon: <Bath />, val: "2", label: "Baños" },
             { icon: <Square />, val: "125", label: "Mt2 Área" },
             { icon: <Car />, val: "1", label: "Garaje" }
           ].map((spec, i) => (
             <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-3">
                <div className="text-hormozi-yellow flex justify-center">{spec.icon}</div>
                <div className="text-4xl font-black italic tracking-tighter">{spec.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{spec.label}</div>
             </div>
           ))}
        </div>

        {/* --- TOUR 360 (SI ESTÁ ABIERTO) --- */}
        {showTour && (
          <div className="fixed inset-0 z-[200] bg-black">
             <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} />
             <button 
              onClick={() => setShowTour(false)}
              className="absolute top-10 right-10 z-[210] p-6 bg-white text-black rounded-full shadow-2xl font-black uppercase text-xs tracking-widest"
             >
               Cerrar ×
             </button>
          </div>
        )}

        {/* --- GALERÍA REFINADA --- */}
        <div className="space-y-12 mb-32">
           <h2 className="text-4xl font-black uppercase italic tracking-tight">Galería de <span className="text-hormozi-yellow">Fotos</span></h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {displayPhotos.map((url, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-[3rem] overflow-hidden border border-white/10 group cursor-pointer"
                  onClick={() => { setCurrentPhoto(i); setLightboxOpen(true); }}
                >
                  <img src={url} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-[1s]" />
                </motion.div>
              ))}
           </div>
        </div>

        {/* --- DESCRIPCIÓN --- */}
        <div className="max-w-4xl space-y-8">
           <div className="text-hormozi-yellow text-xs font-black uppercase tracking-widest">Sobre esta propiedad</div>
           <p className="text-2xl md:text-4xl text-white/80 leading-[1.2] font-medium tracking-tight">
              {property.description}
           </p>
        </div>

      </section>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/98 flex items-center justify-center p-4 md:p-20"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={displayPhotos[currentPhoto]} 
              className="max-h-full max-w-full rounded-2xl shadow-2xl border border-white/10" 
            />
            <button className="absolute top-10 right-10 p-6 text-white opacity-40 hover:opacity-100 transition-opacity"><X size={40}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTON FLOTANTE MÓVIL (COMPRAR YA) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 md:hidden bg-gradient-to-t from-[#062b54] to-transparent">
         <a href={WHATSAPP_URL} target="_blank" className="w-full py-6 bg-hormozi-yellow text-black text-center font-black rounded-3xl uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3">
           <MessageCircle size={18} /> Preguntar por WhatsApp
         </a>
      </div>

    </main>
  );
}
