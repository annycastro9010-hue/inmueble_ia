"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, BedDouble, Bath, Maximize2, Car,
  ChevronLeft, ChevronRight, Play, X, MessageCircle, Home, Phone
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import TourViewer from "@/components/TourViewer";
import { supabase } from "@/lib/supabase";

const MAIN_PROPERTY_ID = '77777777-7777-7777-7777-777777777777';

export default function PropertyPage() {
  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtenemos la propiedad única (Usando el ID maestro)
        const { data: propData, error: propErr } = await supabase
          .from('properties')
          .select('*')
          .eq('id', MAIN_PROPERTY_ID)
          .maybeSingle();

        if (propErr) throw propErr;
        setProperty(propData);

        // Obtenemos las imágenes de esta propiedad específica
        const { data: mediaData, error: mediaErr } = await supabase
          .from('media')
          .select('*')
          .eq('property_id', MAIN_PROPERTY_ID)
          .order('created_at', { ascending: true });

        if (mediaErr) throw mediaErr;
        setImages(mediaData || []);
      } catch (err) {
        console.error("Error cargando datos dinámicos:", err);
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

  // Fallback si no hay datos
  const displayProperty = property || {
    title: "Mansión Santander",
    location: "Bucaramanga, Santander",
    price: 0,
    description: "Carga tus fotos y genera tu video desde el panel de administración para ver el contenido real aquí."
  };

  const displayPhotos = images.length > 0 ? images.map(img => img.url) : [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600"
  ];

  const tourScenes = images.map(img => ({
    id: img.id,
    name: img.room_type !== "unassigned" ? img.room_type.toUpperCase() : "AMBIENTE",
    imageUrl: img.url,
    hotspots: []
  }));

  const nextPhoto = () => setCurrentPhoto((p) => (p + 1) % displayPhotos.length);
  const prevPhoto = () => setCurrentPhoto((p) => (p - 1 + displayPhotos.length) % displayPhotos.length);

  // WhatsApp dinámico
  const WHATSAPP_NUMBER = "573001234567"; 
  const WHATSAPP_MESSAGE = encodeURIComponent(
    `¡Hola! Me interesa la propiedad ${displayProperty.title} (${displayProperty.price}). ¿Podemos agendar una cita?`
  );
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <main className="min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow selection:text-black">
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-4 md:py-5 flex justify-between items-center bg-black/10 backdrop-blur-md md:bg-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-hormozi-yellow rounded-sm">
            <Home size={16} className="text-black" />
          </div>
          <span className="font-black tracking-[0.2em] text-xs md:text-sm uppercase">
            SOTO <span className="text-hormozi-yellow">IA</span>
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-green-500 hover:bg-green-400 text-white font-black rounded-full text-[9px] md:text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={14} className="hidden sm:block" /> {typeof window !== 'undefined' && window.innerWidth < 640 ? 'WhatsApp' : 'WhatsApp'}
          </a>
          <Link href="/dashboard" className="text-[9px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">
            Admin
          </Link>
        </div>
      </nav>

      {/* ── HERO DYNAMIC (Video or Photos) ── */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {displayProperty.video_url ? (
          <div className="absolute inset-0 w-full h-full bg-black">
            <video 
              key={displayProperty.video_url}
              autoPlay 
              loop 
              muted 
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              className="w-full h-full object-cover transition-opacity duration-1000"
              onCanPlayThrough={(e) => (e.currentTarget.style.opacity = "1")}
              style={{ opacity: 0 }}
            >
              <source src={displayProperty.video_url} type="video/mp4" />
              Tu navegador no soporta videos.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b54] via-transparent to-black/20" />
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhoto}
                src={displayPhotos[currentPhoto]}
                crossOrigin="anonymous"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                alt={`Foto ${currentPhoto + 1} de la propiedad`}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b54] via-black/20 to-transparent" />
            
            {/* Controles solo si no hay video */}
            <button onClick={prevPhoto} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextPhoto} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-10">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Info principal sobre el hero — SIEMPRE VISIBLE */}
        <div className="absolute inset-x-0 bottom-0 px-6 md:px-16 pb-20 md:pb-24 z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-hormozi-yellow uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4">
              <MapPin size={12} />
              <span className="truncate">{displayProperty.location}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-3xl">
                <h1 className={`font-black uppercase italic tracking-tighter leading-[0.9] mb-4 transition-all ${displayProperty.video_url ? 'text-3xl sm:text-4xl md:text-6xl text-white/90 drop-shadow-2xl' : 'text-4xl sm:text-5xl md:text-8xl text-white'}`}>
                  {displayProperty.title}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-hormozi-yellow text-black font-black text-[10px] uppercase tracking-widest rounded-full">
                    Garantizado
                  </div>
                  <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-[0.2em]">Exclusividad IA</p>
                </div>
              </div>

              <div className={`md:text-right shrink-0 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/10 self-start md:self-auto transition-all ${displayProperty.video_url ? 'bg-black/20' : 'bg-black/40'}`}>
                <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Inversión</p>
                <p className="text-3xl md:text-5xl font-black text-hormozi-yellow tracking-tighter">
                  {typeof displayProperty.price === 'number' ? `$${displayProperty.price.toLocaleString()}` : displayProperty.price}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BOTONES DE ACCIÓN RÁPIDA ── */}
      <section className="relative z-30 -mt-10 md:-mt-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
           <motion.a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 md:py-6 bg-green-500 hover:bg-green-400 text-white font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest transition-all shadow-2xl shadow-green-500/30"
            >
              <MessageCircle size={20} />
              Quiero Agendar una Cita
            </motion.a>
            <motion.button
              onClick={() => { setShowTour(true); document.getElementById("tour-section")?.scrollIntoView({ behavior: "smooth" }); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 md:py-6 bg-white text-black font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest transition-all shadow-2xl"
            >
              <Play size={20} />
              Ver Tour Virtual 360°
            </motion.button>
        </div>
      </section>

      {/* ── VIDEO REEL (Vertical TikTok Style) — AHORA EN PRIMER PLANO ── */}
      {/* @ts-ignore */}
      {displayProperty.video_url && (
        <section className="relative z-20 -mt-20 md:-mt-32 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-black/60 backdrop-blur-2xl p-6 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="inline-block px-4 py-1.5 bg-hormozi-yellow text-black font-black text-[10px] uppercase tracking-widest rounded-full">
                  Reel de Presentación
                </div>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter">
                  Vive la experiencia <br /> <span className="text-hormozi-yellow">en movimiento</span>
                </h2>
                <p className="text-white/50 text-xs md:text-sm">
                  Mira este resumen rápido de la propiedad. Calidad 4K para que no te pierdas ningún detalle.
                </p>
              </div>
              
              <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden border-[8px] border-white/20 shadow-2xl group">
                <video 
                  src={displayProperty.video_url} 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={displayPhotos[0]}
                />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA PRINCIPAL (El primer WhatsApp) ── */}
      <section className="py-12 px-6 md:px-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left">
          <div>
            <p className="text-white font-black text-xl md:text-2xl tracking-tight">¿Te interesa esta propiedad?</p>
            <p className="text-white/40 text-sm mt-1">Contacta al agente ahora mismo.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
            <motion.a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-110 shadow-2xl shadow-green-500/30 w-full sm:w-auto"
            >
              <MessageCircle size={20} />
              Agendar Cita
            </motion.a>
          </div>
        </div>
      </section>

      {/* ── GALERÍA SIMPLE (Para quien no quiere el tour) ── */}
      <section className="py-16 md:py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 md:mb-10 text-center md:text-left">
            <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3">Galería de Fotos</p>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Conoce cada rincón</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {displayPhotos.map((url, i) => (
              <motion.button
                key={i}
                onClick={() => { setCurrentPhoto(i); setLightboxOpen(true); }}
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-black/20 ${
                  i === 0 ? "sm:col-span-2 sm:row-span-2 aspect-[4/3]" : "aspect-square"
                }`}
              >
                <img
                  src={url}
                  crossOrigin="anonymous"
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
                {i === 0 && (
                  <div className="absolute inset-0 flex items-end p-4 md:p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/60">
                      {displayPhotos.length} fotos disponibles · Clic para ampliar
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOUR VIRTUAL (Opcional, para quienes quieren explorarlo) ── */}
      <section id="tour-section" className="py-16 md:py-20 px-6 md:px-16 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10 text-center md:text-left">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3">Recorrido Interactivo</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Tour Virtual 360°</h2>
              <p className="text-white/40 text-xs md:text-sm mt-2">Recorre cada habitación de tu casa desde tu celular.</p>
            </div>
            {!showTour && (
              <button
                onClick={() => setShowTour(true)}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-hormozi-yellow hover:bg-yellow-300 text-black font-black rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-hormozi-yellow/20 shrink-0 mx-auto md:mx-0"
              >
                <Play size={18} /> Iniciar Recorrido
              </button>
            )}
          </div>

          {showTour ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} />
            </motion.div>
          ) : (
            /* Placeholder para quien no activa el tour */
            <div
              onClick={() => setShowTour(true)}
              className="relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
            >
              <img
                src={displayPhotos[0]}
                crossOrigin="anonymous"
                className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105"
                alt="Preview del tour"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-hormozi-yellow rounded-full flex items-center justify-center shadow-2xl shadow-hormozi-yellow/30 group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-black ml-1" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs md:text-sm">Clic para recorrer la casa</p>
                  <p className="text-white/40 text-[10px] md:text-xs">No necesitas instalar nada</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── DESCRIPCIÓN + DATOS CONCRETOS ── */}
      <section className="py-12 md:py-20 px-6 md:px-16">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4 md:mb-6">Descripción</p>
            <p className="text-white/70 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {displayProperty.description}
            </p>
        </div>
      </section>

      {/* ── CTA FINAL (WhatsApp) ── */}
      <section className="py-20 md:py-24 px-6 text-center bg-black/30">
        <div className="max-w-2xl mx-auto">
          <p className="text-hormozi-yellow text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4">¿Listo para el siguiente paso?</p>
          <h3 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">
            Habla con nosotros ahora
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-10 md:px-12 py-5 md:py-6 bg-green-500 hover:bg-green-400 text-white font-black rounded-2xl text-sm md:text-base uppercase tracking-widest transition-all hover:scale-105 shadow-2xl shadow-green-500/30"
            >
              <MessageCircle size={24} className="hidden sm:block" />
              WhatsApp — Escribir Ya
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 text-center border-t border-white/5">
        <p className="text-white/10 text-[9px] uppercase font-bold tracking-widest">
          © 2026 Soto IA · Tecnología Inmobiliaria · Santander, Colombia
        </p>
      </footer>

      {/* ── BOTÓN WHATSAPP FLOTANTE (siempre visible en móvil) ── */}
      <motion.a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed bottom-8 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-full shadow-2xl shadow-green-500/40 transition-all hover:scale-110 md:hidden"
      >
        <MessageCircle size={20} />
        <span className="text-[11px] uppercase tracking-widest">WhatsApp</span>
      </motion.a>

      {/* ── LIGHTBOX de fotos ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-8 right-8 p-3 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-all"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={24} />
            </button>
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 rounded-full border border-white/10 z-10"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            >
              <ChevronLeft size={24} />
            </button>
            <motion.img
              key={currentPhoto}
              src={displayPhotos[currentPhoto]}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              alt={`Foto ${currentPhoto + 1}`}
            />
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/50 rounded-full border border-white/10 z-10"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-8 flex gap-2">
              {displayPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentPhoto(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === currentPhoto ? "w-8 bg-hormozi-yellow" : "w-3 bg-white/30"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
