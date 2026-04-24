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
      className="relative w-full aspect-video rounded-[2rem] overflow-hidden cursor-ew-resize border-2 border-white/10 group"
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
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black shadow-xl">
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
        // Buscamos por ID o por Slug (si el ID contiene el nombre de la propiedad)
        let query = supabase.from('properties').select('*');
        
        if (id.length > 20) { // Probablemente un UUID
            query = query.eq('id', id);
        } else {
            // Buscamos por slug o título aproximado (fallback)
            query = query.or(`slug.eq.${id},title.ilike.%${id.replace(/-/g, ' ')}%`);
        }

        const { data: propData } = await query.maybeSingle();
        
        if (!propData) {
            // Intentamos una búsqueda desesperada por ID si el slug falló
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

  // Auto-Carousel logic
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setAutoCarouselIndex(prev => (prev + 1) % images.length);
      }, 3500);
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
      
      {/* ── 1. EL TOUR 360 ES LO PRIMERO (AUTO-PLAY) ── */}
      <section className="relative h-[70vh] md:h-[85vh] bg-black">
        <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
        
        {/* Marcador de Tour */}
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] italic text-hormozi-yellow">Experiencia <span className="text-white">Vivo 360°</span></span>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="absolute top-8 right-8 z-30">
          <Link href="/" className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all">
             <X size={20} />
          </Link>
        </div>

        {/* Overlay inferior difuminado */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#062b54] to-transparent z-10" />
      </section>

      {/* ── 2. BOTONES DE ACCIÓN RÁPIDA ── */}
      <div className="relative z-20 -mt-10 px-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
        <a href={WHATSAPP_URL} target="_blank" className="flex-1 py-6 bg-green-500 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.03] transition-transform">
          <MessageCircle size={20} /> Quiero una Cita
        </a>
        <button onClick={() => window.scrollTo({ top: 1500, behavior: 'smooth' })} className="flex-1 py-6 bg-white text-black font-black rounded-3xl uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.03] transition-transform">
          <Play size={20} /> Ver Video Cinematic
        </button>
      </div>

      <div className="px-6 md:px-12 max-w-[1400px] mx-auto py-16 space-y-32">
        
        {/* ── 3. VIDEO REEL (AUTO-PLAY) ── */}
        {property.video_url && (
          <section className="space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-0.5 w-12 bg-hormozi-yellow" />
               <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Video <span className="text-hormozi-yellow">Reel de Venta</span></h2>
             </div>
             <div className="aspect-video rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                <video 
                  src={property.video_url} 
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover"
                />
             </div>
          </section>
        )}

        {/* ── 4. CARRUSEL AUTOMÁTICO DE FOTOS ── */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
             <div className="h-0.5 w-12 bg-hormozi-yellow" />
             <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Explora los <span className="text-hormozi-yellow">Espacios</span></h2>
           </div>
           
           <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[3rem] overflow-hidden border border-white/10 bg-black/20 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={autoCarouselIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.8 }}
                  src={images[autoCarouselIndex]?.url}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => { setCurrentPhoto(autoCarouselIndex); setLightboxOpen(true); }}
                />
              </AnimatePresence>
              
              {/* Controles del carrusel */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                 {images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${idx === autoCarouselIndex ? 'w-8 bg-hormozi-yellow' : 'w-2 bg-white/20'}`}
                    />
                 ))}
              </div>
           </div>

           {/* Galería de miniaturas (Individuales) */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.slice(0, 8).map((img, i) => (
                <div 
                  key={i} 
                  className={`aspect-video rounded-3xl overflow-hidden border-2 transition-all cursor-pointer ${i === autoCarouselIndex ? 'border-hormozi-yellow scale-95' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                  onClick={() => setAutoCarouselIndex(i)}
                >
                  <img src={img.url} className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
        </section>

        {/* ── 5. INFORMACIÓN, TITULO Y MAGIA ── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-20 items-start">
           <div className="lg:col-span-3 space-y-12">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-hormozi-yellow font-black uppercase tracking-widest text-[10px]">
                    <MapPin size={16} /> {property.location}
                 </div>
                 <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                    {property.title}
                 </h1>
                 <p className="text-xl md:text-2xl text-white/60 leading-relaxed max-w-4xl pt-4">
                    {property.description}
                 </p>
              </div>

              {/* Ficha técnica simple */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { ic: <BedDouble />, val: "3", l: "Habs" },
                  { ic: <Bath />, val: "2", l: "Baños" },
                  { ic: <Square />, val: "125", l: "m²" },
                  { ic: <Car />, val: "1", l: "Garaje" }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 text-center">
                    <div className="text-hormozi-yellow flex justify-center mb-2">{s.ic}</div>
                    <div className="text-2xl font-black italic">{s.val}</div>
                    <div className="text-[10px] uppercase font-bold opacity-30">{s.l}</div>
                  </div>
                ))}
              </div>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 shadow-2xl">
                 <div className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-2 text-center">Inversión Final</div>
                 <div className="text-5xl md:text-6xl font-black italic tracking-tighter text-hormozi-yellow text-center">
                   ${property.price?.toLocaleString()}
                 </div>
                 <div className="mt-8 h-px bg-white/10 w-full" />
                 <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] italic text-white/50">
                       <CheckCircle size={14} className="text-green-500" /> Entrega Inmediata
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] italic text-white/50">
                       <CheckCircle size={14} className="text-green-500" /> Documentos al día
                    </div>
                 </div>
              </div>

              {/* Magia IA en lateral */}
              {stagedImg && originalImg && (
                <div className="space-y-4">
                   <div className="text-[10px] font-black uppercase tracking-widest text-hormozi-yellow px-4 flex items-center gap-2">
                      <Sparkles size={12}/> Potencial con IA
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
            className="fixed inset-0 z-[500] bg-black/98 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <img src={images[currentPhoto].url} className="max-h-full max-w-full rounded-2xl" />
            <button className="absolute top-10 right-10 p-6 text-white"><X size={40}/></button>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
