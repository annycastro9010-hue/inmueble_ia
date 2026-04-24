'use client';

import { 
  BedDouble, Bath, Maximize2, Car, MapPin, 
  ChevronLeft, ChevronRight, Play, X, MessageCircle, Home, Phone
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TourViewer from "@/components/TourViewer";
import { supabase } from "@/lib/supabase";

export default function DynamicPropertyPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: propData, error: propErr } = await supabase
          .from('properties')
          .select('*')
          .eq('id', params.id)
          .single();

        if (propErr) throw propErr;
        setProperty(propData);

        const { data: mediaData, error: mediaErr } = await supabase
          .from('media')
          .select('*')
          .eq('property_id', params.id)
          .order('created_at', { ascending: true });

        if (mediaErr) throw mediaErr;
        setImages(mediaData.filter(m => m.url && m.url.startsWith('http')));
      } catch (err) {
        console.error("Error cargando propiedad:", err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hormozi-yellow"></div>
    </div>
  );

  if (!property) return <div className="min-h-screen bg-black flex items-center justify-center">Propiedad no encontrada</div>;

  const displayPhotos = images.length > 0 ? images.map(img => img.url) : [];
  const nextPhoto = () => setCurrentPhoto((p) => (p + 1) % displayPhotos.length);
  const prevPhoto = () => setCurrentPhoto((p) => (p - 1 + displayPhotos.length) % displayPhotos.length);

  const WHATSAPP_NUMBER = "573001234567"; 
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Me interesa la propiedad ${property.title}`)}`;

  const tourScenes = images.map(img => ({
    id: img.id,
    name: img.room_type !== "unassigned" ? img.room_type.toUpperCase() : "AMBIENTE",
    imageUrl: img.url,
    hotspots: []
  }));

  return (
    <main className="min-h-screen bg-[#062b54] text-white selection:bg-hormozi-yellow selection:text-black font-body">
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center bg-black/10 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-hormozi-yellow rounded-sm">
            <Home size={16} className="text-black" />
          </div>
          <span className="font-black uppercase text-xs tracking-widest">SOTO IA</span>
        </Link>
        <a href={WHATSAPP_URL} className="px-5 py-2 bg-green-500 text-white font-black rounded-full text-[10px] uppercase tracking-widest">
          WhatsApp
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {property.video_url ? (
          <div className="absolute inset-0">
            <video src={property.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b54] to-transparent" />
          </div>
        ) : (
          <>
            <img src={displayPhotos[currentPhoto]} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b54] to-transparent" />
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 px-6 md:px-16 pb-24 z-20">
          <div className="max-w-6xl mx-auto">
             <p className="text-hormozi-yellow font-black text-[10px] uppercase tracking-widest mb-2">{property.address}</p>
             <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-6">{property.title}</h1>
             <div className="inline-block bg-black/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10">
                <p className="text-[10px] font-black text-white/30 uppercase mb-1">Inversión</p>
                <p className="text-3xl md:text-6xl font-black text-hormozi-yellow tracking-tighter">
                   ${Number(property.price).toLocaleString()}
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="relative z-30 -mt-10 px-6 max-w-4xl mx-auto flex flex-col sm:row gap-4">
          <a href={WHATSAPP_URL} className="flex-1 py-6 bg-green-500 text-white font-black rounded-2xl text-center uppercase tracking-widest text-sm shadow-2xl">
            Agendar Cita
          </a>
          <button onClick={() => { setShowTour(true); document.getElementById("tour")?.scrollIntoView(); }} className="flex-1 py-6 bg-white text-black font-black rounded-2xl text-center uppercase tracking-widest text-sm shadow-2xl font-black">
            Tour Virtual 360°
          </button>
      </section>

      {/* Galeria */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase italic mb-10">Galería</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayPhotos.map((url, i) => (
              <img key={i} src={url} className="w-full aspect-square object-cover rounded-[2rem] border border-white/10" />
            ))}
          </div>
      </section>

      {/* Tour */}
      <section id="tour" className="py-20 px-6 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black uppercase italic mb-10 text-center">Tour Virtual</h2>
            {showTour && tourScenes.length > 0 ? (
              <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0].id} />
            ) : (
              <div onClick={() => setShowTour(true)} className="h-[400px] bg-black/40 rounded-[2rem] flex items-center justify-center cursor-pointer border border-white/10">
                 <Play size={48} className="text-hormozi-yellow" />
              </div>
            )}
          </div>
      </section>

      {/* Footer */}
      <footer className="py-20 text-center text-white/20 text-[10px] uppercase font-bold tracking-widest">
         © 2026 SOTO IA
      </footer>
    </main>
  );
}
