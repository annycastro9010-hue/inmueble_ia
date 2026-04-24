"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, ChevronRight, Play, X, MessageCircle, Home, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import TourViewer from "@/components/TourViewer";
import { supabase } from "@/lib/supabase";

export default function PropertyDynamicPage({ params }: { params: { id: string } }) {
  const { id } = params;
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
          .from('properties').select('*').eq('id', id).maybeSingle();
        setProperty(propData);

        const { data: mediaData } = await supabase
          .from('media').select('*')
          .eq('property_id', id)
          .order('created_at', { ascending: true });
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hormozi-yellow"></div>
    </div>
  );

  if (!property) return (
    <div className="min-h-screen bg-[#062b54] flex flex-col items-center justify-center text-white p-6">
      <h1 className="text-4xl font-black uppercase italic mb-4">Inmueble no encontrado</h1>
      <Link href="/" className="px-8 py-4 bg-hormozi-yellow text-black font-black rounded-2xl uppercase text-xs tracking-widest hover:scale-105 transition-all">
        Volver al Inicio
      </Link>
    </div>
  );

  const displayProperty = property;
  const displayPhotos = images.length > 0 ? images.map(img => img.url) : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600"];

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

  const formattedPrice = typeof displayProperty.price === 'number'
    ? `$${displayProperty.price.toLocaleString('es-CO')}`
    : displayProperty.price || "Precio a consultar";

  const WHATSAPP_URL = `https://wa.me/573001234567?text=${encodeURIComponent(`Hola! Me interesa la propiedad: ${displayProperty.title}`)}`;

  return (
    <main className="min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow selection:text-black pb-20">
      
      {/* ── TICKER ── */}
      <div className="bg-hormozi-yellow text-black py-2 overflow-hidden whitespace-nowrap border-b border-black/10 relative z-[60]">
        <motion.div 
          initial={{ x: 0 }} animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center font-black text-[11px] md:text-[13px] uppercase tracking-[0.5em] italic">
              <span>Entrega Inmediata</span> <span className="w-2 h-2 bg-black rounded-full" />
              <span>Venta Directa</span> <span className="w-2 h-2 bg-black rounded-full" />
              <span>Créditos Aprobados</span> <span className="w-2 h-2 bg-black rounded-full" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-10 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center bg-black/30 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-white/10 rounded-full group-hover:bg-hormozi-yellow transition-colors">
            <ArrowLeft size={16} className="group-hover:text-black" />
          </div>
          <span className="font-black tracking-[0.2em] text-[10px] uppercase">VOLVER</span>
        </Link>
        <div className="flex items-center gap-3">
          <a href={WHATSAPP_URL} target="_blank" className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white font-black rounded-full text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/30">
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </nav>

      <section className="relative pt-24 px-6 md:px-16 container mx-auto">
        {/* Título y Precio */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-hormozi-yellow font-black uppercase tracking-widest text-[10px]">
                <MapPin size={14} /> {displayProperty.location}
             </div>
             <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">{displayProperty.title}</h1>
          </div>
          <div className="text-3xl md:text-5xl font-black italic text-hormozi-yellow tracking-tighter">
            {formattedPrice}
          </div>
        </div>

        {/* Hero Tour */}
        <div className="rounded-[3rem] overflow-hidden border border-white/10 bg-black aspect-video relative shadow-2xl">
           <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
           <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-hormozi-yellow font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> TOUR VIRTUAL 360°
            </div>
          </div>
        </div>

        {/* Galería Rápida */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
           {displayPhotos.slice(0, 4).map((url, i) => (
             <div onClick={() => openLightbox(i)} key={i} className="aspect-video rounded-[1.5rem] overflow-hidden border border-white/5 cursor-pointer relative group">
                <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {i === 3 && displayPhotos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-black text-xl">+{displayPhotos.length - 4}</div>
                )}
             </div>
           ))}
        </div>

        {/* Video si existe */}
        {displayProperty.video_url && (
          <div className="mt-20">
            <h2 className="text-2xl font-black uppercase italic tracking-tight mb-6">Reel Promocional</h2>
            <div className="rounded-[3rem] overflow-hidden border border-white/10 bg-black aspect-video relative group">
               <video src={displayProperty.video_url} autoPlay loop muted className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="mt-20 max-w-4xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tight mb-6 text-hormozi-yellow">Descripción</h2>
            <p className="text-xl text-white/70 leading-relaxed">{displayProperty.description}</p>
        </div>
      </section>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
            <img src={displayPhotos[currentPhoto]} className="max-h-full max-w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setLightboxOpen(false)} className="absolute top-10 right-10 p-3 bg-white/10 rounded-full hover:bg-white/20"><X/></button>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
