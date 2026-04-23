"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, BedDouble, Bath, Maximize2, Car,
  ChevronLeft, ChevronRight, Play, X, MessageCircle, Home, Phone
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TourViewer from "@/components/TourViewer";

// ============================================================
// 🏠 DATOS DE LA PROPIEDAD — Edita esto con tu información real
// ============================================================
const PROPERTY = {
  title: "Casa Familiar en Venta",
  subtitle: "Bucaramanga, Santander",
  address: "Urbanización Reserva del Bosque, Bucaramanga",
  price: "$380.000.000 COP",
  priceNote: "Precio negociable. Escritura al día.",
  specs: [
    { icon: BedDouble, label: "Habitaciones", value: "3" },
    { icon: Bath, label: "Baños", value: "2" },
    { icon: Maximize2, label: "Área", value: "120 m²" },
    { icon: Car, label: "Parqueadero", value: "1" },
  ],
  description: `Casa de dos pisos en conjunto cerrado con vigilancia 24 horas. 
Sala-comedor integrado, cocina integral, patio trasero y zona de ropas. 
Habitación principal con baño privado. Acabados en porcelanato, ventanas de aluminio y rejas de seguridad. 
A 5 minutos del centro comercial Cabecera y colegios cercanos.`,
  // Cambia estas URLs por las fotos reales cuando las subas
  photos: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600607687940-4ad236f75705?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600",
  ],
  // Tours virtuales — reemplazar imageUrl con tus fotos reales de Supabase
  tourScenes: [
    {
      id: "sala",
      name: "Sala Principal",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
      hotspots: [{ x: 80, y: 50, targetSceneId: "cocina", label: "Ver Cocina" }],
    },
    {
      id: "cocina",
      name: "Cocina Integral",
      imageUrl: "https://images.unsplash.com/photo-1600607687940-4ad236f75705?auto=format&fit=crop&q=80&w=1600",
      hotspots: [{ x: 10, y: 60, targetSceneId: "cuarto", label: "Ver Habitación" }],
    },
    {
      id: "cuarto",
      name: "Habitación Master",
      imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=1600",
      hotspots: [{ x: 50, y: 80, targetSceneId: "sala", label: "Volver a Sala" }],
    },
  ],
};

// ============================================================
// 📱 WHATSAPP — Número y mensaje de calificación
// ============================================================
const WHATSAPP_NUMBER = "573001234567"; // ← Cambia esto por tu número real (con código país, sin +)
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Hola! Vi la publicación de la casa en ${PROPERTY.address} y me interesa obtener más información.

Mis respuestas rápidas:
1️⃣ ¿Estoy buscando para vivir o invertir? → 
2️⃣ ¿Tengo preaprobado crédito hipotecario o compro de contado? → 
3️⃣ ¿Para cuándo necesito mudarme aproximadamente? → 

Gracias!`
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// ============================================================
export default function PropertyPage() {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const nextPhoto = () => setCurrentPhoto((p) => (p + 1) % PROPERTY.photos.length);
  const prevPhoto = () => setCurrentPhoto((p) => (p - 1 + PROPERTY.photos.length) % PROPERTY.photos.length);

  return (
    <main className="min-h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow selection:text-black">
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-4 md:py-5 flex justify-between items-center bg-black/40 md:bg-gradient-to-b md:from-black/60 md:to-transparent backdrop-blur-md">
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

      {/* ── HERO GALERÍA ── */}
      <section className="relative h-[85vh] md:h-[92vh] w-full overflow-hidden">
        {/* Foto principal */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentPhoto}
            src={PROPERTY.photos[currentPhoto]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt={`Foto ${currentPhoto + 1} de la propiedad`}
          />
        </AnimatePresence>
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062b54] via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062b54]/60 via-transparent to-transparent" />

        {/* Controles del carrusel */}
        <button onClick={prevPhoto} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-10">
          <ChevronLeft size={20} />
        </button>
        <button onClick={nextPhoto} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all z-10">
          <ChevronRight size={20} />
        </button>

        {/* Indicadores de foto */}
        <div className="absolute bottom-[280px] md:bottom-48 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
          {PROPERTY.photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentPhoto ? "w-6 md:w-8 bg-hormozi-yellow" : "w-2 md:w-3 bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Info principal sobre el hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-12 md:pb-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-hormozi-yellow uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3 md:mb-4">
              <MapPin size={12} />
              <span className="truncate">{PROPERTY.address}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
              <div className="max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-2 md:mb-3">
                  {PROPERTY.title}
                </h1>
                <p className="text-white/50 text-xs md:text-sm">{PROPERTY.subtitle}</p>
              </div>

              <div className="md:text-right shrink-0">
                <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Precio</p>
                <p className="text-2xl md:text-5xl font-black text-hormozi-yellow tracking-tighter">{PROPERTY.price}</p>
                <p className="text-[9px] md:text-[10px] text-white/30 mt-1">{PROPERTY.priceNote}</p>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-4">
              {PROPERTY.specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                  <Icon size={16} className="text-hormozi-yellow" />
                  <span className="font-black text-xs md:text-sm">{value}</span>
                  <span className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA PRINCIPAL (El primer WhatsApp) ── */}
      <section className="py-12 px-6 md:px-16 bg-black/40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left">
          <div>
            <p className="text-white font-black text-xl md:text-2xl tracking-tight">¿Te interesa esta propiedad?</p>
            <p className="text-white/40 text-sm mt-1">Responde 3 preguntas rápidas y te contactamos hoy mismo.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-green-500 hover:bg-green-400 text-white font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-2xl shadow-green-500/30 w-full sm:w-auto"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
            <button
              onClick={() => { setShowTour(true); document.getElementById("tour-section")?.scrollIntoView({ behavior: "smooth" }); }}
              className="flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 hover:bg-white/10 font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest transition-all w-full sm:w-auto"
            >
              <Play size={20} className="text-hormozi-yellow" />
              Tour Virtual
            </button>
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
            {PROPERTY.photos.map((url, i) => (
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
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
                {i === 0 && (
                  <div className="absolute inset-0 flex items-end p-4 md:p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/60">
                      {PROPERTY.photos.length} fotos disponibles · Clic para ampliar
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
              <p className="text-white/40 text-xs md:text-sm mt-2">Recorre cada habitación desde tu celular sin salir de casa.</p>
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
              <TourViewer scenes={PROPERTY.tourScenes} initialSceneId="sala" />
            </motion.div>
          ) : (
            /* Placeholder para quien no activa el tour */
            <div
              onClick={() => setShowTour(true)}
              className="relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
            >
              <img
                src={PROPERTY.photos[0]}
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
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4 md:mb-6">Descripción</p>
            <p className="text-white/70 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {PROPERTY.description}
            </p>
          </div>

          <div>
            <p className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4 md:mb-6">Ficha Técnica</p>
            <div className="space-y-2 md:space-y-4">
              {PROPERTY.specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 md:py-4 border-b border-white/5">
                  <div className="flex items-center gap-3 text-white/50">
                    <Icon size={16} className="text-hormozi-yellow" />
                    <span className="text-[10px] md:text-sm uppercase tracking-widest font-bold">{label}</span>
                  </div>
                  <span className="font-black text-white text-lg md:text-xl">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 md:py-4 border-b border-white/5">
                <span className="text-white/50 text-[10px] md:text-sm uppercase tracking-widest font-bold">Precio</span>
                <span className="font-black text-hormozi-yellow text-lg md:text-xl">{PROPERTY.price}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL (WhatsApp) ── */}
      <section className="py-20 md:py-24 px-6 text-center bg-black/30">
        <div className="max-w-2xl mx-auto">
          <p className="text-hormozi-yellow text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4">¿Listo para el siguiente paso?</p>
          <h3 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">
            Habla con nosotros ahora
          </h3>
          <p className="text-white/40 mb-10 md:mb-12 leading-relaxed text-sm">
            Solo escríbenos por WhatsApp. En el mensaje ya van 3 preguntas cortas para darte información personalizada sin perder tu tiempo.
          </p>

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
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="flex items-center justify-center gap-3 px-10 md:px-12 py-5 md:py-6 bg-white/5 border border-white/10 hover:bg-white/10 font-black rounded-2xl text-sm md:text-base uppercase tracking-widest transition-all"
            >
              <Phone size={24} className="hidden sm:block" />
              Llamar Directo
            </a>
          </div>

          <p className="mt-8 text-white/20 text-[8px] md:text-[10px] uppercase tracking-widest">
            Sin intermediarios · Respuesta en menos de 2 horas
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 text-center border-t border-white/5">
        <p className="text-white/10 text-[9px] uppercase font-bold tracking-widest">
          © 2026 Soto IA · Tecnología Inmobiliaria · Santander, Colombia
        </p>
      </footer>

      {/* ── BOTÓN WHATSAPP FLOTANTE (siempre visible en móvil) ── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-full shadow-2xl shadow-green-500/40 transition-all hover:scale-110 md:hidden"
      >
        <MessageCircle size={20} />
        <span className="text-[11px] uppercase tracking-widest">WhatsApp</span>
      </a>

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
              src={PROPERTY.photos[currentPhoto]}
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
              {PROPERTY.photos.map((_, i) => (
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
