"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, ChevronRight, Play, X, MessageCircle, Home, Eye } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import TourViewer from "@/components/TourViewer";
import { supabase } from "@/lib/supabase";

const MAIN_PROPERTY_ID = '77777777-7777-7777-7777-777777777777';

export default function PropertyPage() {
  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: propData } = await supabase
          .from('properties').select('*').eq('id', MAIN_PROPERTY_ID).maybeSingle();
        setProperty(propData);

        const { data: mediaData } = await supabase
          .from('media').select('*')
          .eq('property_id', MAIN_PROPERTY_ID)
          .order('created_at', { ascending: true });
        setImages(mediaData || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hormozi-yellow"></div>
    </div>
  );

  const displayProperty = property || {
    title: "Casa Exclusiva Santander",
    location: "Bucaramanga, Santander",
    price: 179900000,
    description: "Espacio diseñado para el máximo confort y lujo.",
    video_url: null,
  };

  // Fotos: todas las que vengan de Supabase; si no hay, usa placeholder
  const displayPhotos = images.length > 0
    ? images.map(img => img.url)
    : [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1600",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=1600",
        "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?auto=format&fit=crop&q=80&w=1600",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1600",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=1600",
      ];

  const tourScenes = images.length > 0
    ? images.map(img => ({
        id: img.id,
        name: img.room_type && img.room_type !== "unassigned" ? img.room_type.toUpperCase() : "ESPACIO",
        imageUrl: img.url,
        hotspots: []
      }))
    : displayPhotos.map((url, i) => ({
        id: `scene-${i}`,
        name: `ESPACIO ${i + 1}`,
        imageUrl: url,
        hotspots: []
      }));

  const nextPhoto = () => setCurrentPhoto(p => (p + 1) % displayPhotos.length);
  const prevPhoto = () => setCurrentPhoto(p => (p - 1 + displayPhotos.length) % displayPhotos.length);

  const openLightbox = (index: number) => {
    setCurrentPhoto(index);
    setLightboxOpen(true);
  };

  const WHATSAPP_NUMBER = "573001234567";
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Me interesa la propiedad: ${displayProperty.title}`)}`;

  const formattedPrice = typeof displayProperty.price === 'number'
    ? `$${displayProperty.price.toLocaleString('es-CO')}`
    : displayProperty.price || "Precio a consultar";

  return (
    <main className="min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow selection:text-black">
      
      {/* ── TICKER: ENTREGA INMEDIATA (MARQUEE) ── */}
      <div className="bg-hormozi-yellow text-black py-2 overflow-hidden whitespace-nowrap border-b border-black/10 relative z-[60]">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center font-black text-[11px] md:text-[13px] uppercase tracking-[0.5em] italic">
              <span>Entrega Inmediata</span>
              <span className="w-2 h-2 bg-black rounded-full" />
              <span>Venta Directa</span>
              <span className="w-2 h-2 bg-black rounded-full" />
              <span>Créditos Aprobados</span>
              <span className="w-2 h-2 bg-black rounded-full" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-10 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center bg-black/30 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-hormozi-yellow rounded-sm rotate-3">
            <Home size={16} className="text-black" />
          </div>
          <span className="font-black tracking-[0.2em] text-xs uppercase">SOTO <span className="text-hormozi-yellow">IA</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors hidden md:block">
            Administración
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-black rounded-full text-[10px] uppercase tracking-widest hover:scale-105 hover:bg-green-400 transition-all shadow-lg shadow-green-500/30"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </nav>

      {/* ── SECCIÓN 1: HERO — TOUR 360 LIMPID (SIN TEXTO ENCIMA) ── */}
      <section className="relative bg-black overflow-hidden pt-16">
        {/* Tour ocupa el ancho completo, limpio y sin estorbos */}
        <div className="w-full relative shadow-inner" style={{ aspectRatio: '21/9', minHeight: '400px' }}>
          <div className="absolute inset-0">
            <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
          </div>
          {/* Overlay sutil solo en los bordes para profundidad */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/20" />
          
          <div className="absolute bottom-6 left-6 md:left-12 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-hormozi-yellow font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> EN VIVO: TOUR VIRTUAL 360°
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 1.5: INFO PRINCIPAL (TÍTULO Y PRECIO) — Con mucho espacio ── */}
      <section className="bg-[#062b54] pt-12 pb-6 px-6 md:px-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-hormozi-yellow/60 font-black uppercase tracking-[0.4em] text-[10px]">
              <MapPin size={14} className="text-hormozi-yellow" /> {displayProperty.location}
            </div>
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.8] text-white">
              {displayProperty.title}
            </h1>
            <div className="h-2 w-24 bg-hormozi-yellow rounded-full" />
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 flex flex-col items-center md:items-end group hover:border-hormozi-yellow/50 transition-all duration-500">
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-2">Precio de Venta</span>
             <p className="text-4xl md:text-6xl font-black text-hormozi-yellow italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,204,4,0.3)]">
               {formattedPrice}
             </p>
          </div>
        </div>
      </section>

      {/* ── CTA BOTONES — debajo del hero, dinámicos ── */}
      <section className="bg-[#062b54] px-6 md:px-16 py-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Botón WhatsApp — DINÁMICO */}
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0px rgba(34, 197, 94, 0)",
                "0 0 40px rgba(34, 197, 94, 0.4)",
                "0 0 0px rgba(34, 197, 94, 0)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="flex items-center justify-center gap-4 w-full sm:w-auto sm:min-w-[320px] px-12 py-7 bg-green-500 text-white font-black rounded-[2.5rem] text-base uppercase tracking-widest shadow-2xl shadow-green-500/20 hover:bg-green-400 transition-colors relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
            <span>Agendar mi Visita</span>
          </motion.a>

          {/* Botón Tour 360 Full Screen */}
          <motion.button
            onClick={() => setShowTour(true)}
            whileHover={{ scale: 1.05, backgroundColor: "#fbcc04", color: "#000" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-4 w-full sm:w-auto sm:min-w-[320px] px-12 py-7 bg-white/5 border border-white/20 text-white font-black rounded-[2.5rem] text-base uppercase tracking-widest transition-all relative group"
          >
            <Play size={22} className="fill-white group-hover:fill-black group-hover:scale-110 transition-all" />
            <span>Experiencia 360°</span>
          </motion.button>
        </div>
      </section>

      {/* ── SECCIÓN 2: VIDEO SHOWCASE ── */}
      <section className="py-16 md:py-24 bg-[#041a30] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-hormozi-yellow font-black uppercase tracking-[0.5em] text-[10px] mb-3">Reel de Presentación</p>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
              Vive la Experiencia <span className="text-hormozi-yellow">en Movimiento.</span>
            </h2>
            <p className="text-white/40 text-sm mt-3 uppercase tracking-[0.2em]">
              Mira este resumen rápido de la propiedad. Calidad 4K para que no te pierdas ningún detalle.
            </p>
          </div>

          {/* Video — si existe en Supabase se reproduce, si no muestra la galería en slideshow */}
          {displayProperty.video_url ? (
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
              <video
                ref={videoRef}
                src={displayProperty.video_url}
                autoPlay loop muted playsInline
                className="w-full h-full object-cover"
              />
              {/* botón overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-transparent transition-colors group">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-white fill-white ml-1" />
                </div>
              </div>
            </div>
          ) : (
            /* Si no hay video, slideshow automático con las fotos */
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentPhoto}
                  src={displayPhotos[currentPhoto]}
                  alt={`Foto ${currentPhoto + 1}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              {/* Auto-advance */}
              <AutoSlideshow
                total={displayPhotos.length}
                current={currentPhoto}
                onChange={setCurrentPhoto}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {displayPhotos.slice(0, 6).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`h-1.5 rounded-full transition-all ${i === currentPhoto ? 'w-8 bg-hormozi-yellow' : 'w-2 bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN 3: GALERÍA ── */}
      <section className="py-20 px-6 bg-[#062b54]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-hormozi-yellow font-black uppercase tracking-[0.5em] text-[10px] mb-2">Galería</p>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
              Cada rincón, <span className="text-hormozi-yellow">una historia.</span>
            </h2>
            <p className="text-white/30 text-sm mt-2">Haz clic en cualquier foto para verla en grande</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {displayPhotos.map((url, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openLightbox(i)}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-hormozi-yellow/50 transition-colors ${
                  i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                }`}
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-300">
                    <div className="w-12 h-12 bg-hormozi-yellow rounded-full flex items-center justify-center shadow-2xl">
                      <Eye size={20} className="text-black" />
                    </div>
                  </div>
                </div>
                {/* Número */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white/60">
                  {i + 1}/{displayPhotos.length}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: DESCRIPCIÓN ── */}
      {displayProperty.description && (
        <section className="py-20 bg-black/20 px-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-6 text-hormozi-yellow">
              Acerca de la propiedad
            </h3>
            <p className="text-white/70 text-lg md:text-xl leading-relaxed font-medium">
              {displayProperty.description}
            </p>
          </div>
        </section>
      )}

      {/* ── FOOTER CTA ── */}
      <footer className="py-24 border-t border-white/5 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h4 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-10 leading-tight">
            ¿Es esta la casa de <br/> <span className="text-hormozi-yellow">tus sueños?</span>
          </h4>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WHATSAPP_URL} target="_blank" className="px-10 py-5 bg-white text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-hormozi-yellow transition-colors">
              WhatsApp Ahora
            </a>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-10 py-5 border border-white/10 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-white/5 transition-all">
              Volver arriba
            </button>
          </div>
          <p className="mt-16 text-[10px] text-white/10 font-bold uppercase tracking-[0.5em]">© 2026 SOTO IA · Santander, CO</p>
        </div>
      </footer>

      {/* ── MODAL: TOUR VIRTUAL FULL SCREEN ── */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10"
          >
            <button
              onClick={() => setShowTour(false)}
              className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <X size={16} /> Cerrar
            </button>
            <div className="w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10" style={{ aspectRatio: '16/9' }}>
              <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX: IMÁGENES EN GRANDE ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/97 backdrop-blur-2xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Botón cerrar */}
            <button
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>

            {/* Contador */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
              {currentPhoto + 1} / {displayPhotos.length}
            </div>

            {/* Imagen central */}
            <motion.img
              key={currentPhoto}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              src={displayPhotos[currentPhoto]}
              alt={`Foto ${currentPhoto + 1}`}
              className="max-h-[82vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />

            {/* Flechas de navegación */}
            <button
              onClick={e => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 md:left-8 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 md:right-8 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <ChevronRight size={24} />
            </button>

            {/* Miniaturas en la parte inferior */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 pb-1">
              {displayPhotos.map((url, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setCurrentPhoto(i); }}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === currentPhoto ? 'border-hormozi-yellow scale-110' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                >
                  <img src={url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Componente auxiliar para hacer auto-slideshow cuando no hay video */
function AutoSlideshow({ total, current, onChange }: { total: number; current: number; onChange: (i: number) => void }) {
  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      onChange((current + 1) % total);
    }, 4000);
    return () => clearInterval(interval);
  }, [current, total, onChange]);
  return null;
}
