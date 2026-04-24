"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ChevronLeft, ChevronRight, Play, X, MessageCircle, 
  Home, Eye, ArrowLeft, CheckCircle, Sparkles, BedDouble, Bath, Square, Car,
  User, Phone, Send
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
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
  
  // CRM States
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "" });
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

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
        
        // ORDEN LÓGICO: Piso primero, luego creación
        const { data: mediaData } = await supabase.from("media")
          .select("*")
          .eq("property_id", actualId)
          .order("floor", { ascending: true })
          .order("created_at", { ascending: true });
          
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { error } = await supabase.from('leads').insert([{
      property_id: property.id,
      client_name: leadForm.name,
      phone: leadForm.phone,
      interest_level: 5
    }]);

    if (!error) {
      setSentSuccess(true);
      setTimeout(() => {
        const text = `¡Hola! Soy ${leadForm.name}. Vi la propiedad "${property.title}" y quiero agendar una visita.`;
        window.open(`https://wa.me/573001234567?text=${encodeURIComponent(text)}`, '_blank');
        setShowCRMModal(false);
        setSentSuccess(false);
        setIsSending(false);
      }, 1500);
    } else {
      alert("Lo sentimos, hubo un error. Intenta de nuevo.");
      setIsSending(false);
    }
  };

  // Filtrar para mostrar la mejor calidad por habitación en el tour (Memoized)
  const bestImages = useMemo(() => {
    return images.reduce((acc: any[], current) => {
      const key = `${current.floor}-${current.room_type}`;
      const existingIdx = acc.findIndex(img => `${img.floor}-${img.room_type}` === key);
      
      const priority = (s: string) => ({ staged: 4, cleaned: 3, enhanced: 2, original: 1 }[s] || 0);
      
      if (existingIdx === -1) {
        acc.push(current);
      } else if (priority(current.status) > priority(acc[existingIdx].status)) {
        acc[existingIdx] = current;
      }
      return acc;
    }, []);
  }, [images]);

  const tourScenes = useMemo(() => {
    return bestImages.map(img => ({
      id: img.id,
      name: img.floor ? `PISO ${img.floor} - ${img.room_type?.toUpperCase()}` : (img.room_type?.toUpperCase() || "CASA"),
      imageUrl: img.url,
      hotspots: []
    }));
  }, [bestImages]);

  const stagedImg = useMemo(() => images.find(img => img.status === 'staged'), [images]);
  const originalImg = useMemo(() => images.find(img => img.status === 'original' || img.status === 'enhanced'), [images]);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-hormozi-yellow"></div>
    </div>
  );

  if (!property) return null;


  return (
    <main className="min-h-screen bg-[#062b54] text-white selection:bg-hormozi-yellow selection:text-black font-body">
      
      {/* ── 1. TICKER ── */}
      <div className="bg-hormozi-yellow text-black py-2.5 overflow-hidden whitespace-nowrap sticky top-0 z-[100] border-b-2 border-black/10">
        <motion.div 
          initial={{ x: 0 }} animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center font-black text-[10px] uppercase tracking-[0.3em] italic">
              <span>Entrega Inmediata</span> <Sparkles size={14} />
              <span>Créditos se aceptan</span> <CheckCircle size={14} />
              <span>Sin Intermediarios</span> <Sparkles size={14} />
              <span>Alta Valorización</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── 2. EL TOUR 360 (Automático y Ordenado) ── */}
      <section className="relative h-[85vh] bg-black overflow-hidden shadow-2xl">
        <TourViewer scenes={tourScenes} initialSceneId={tourScenes[0]?.id} autoPlay={true} />
        
        {/* Marcadores de Calidad de Vida */}
        <div className="absolute top-8 left-8 z-20 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-2 bg-[#062b54]/80 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-hormozi-yellow italic">Modo <span className="text-white">Autoventa activo</span></span>
          </div>
        </div>

        <div className="absolute top-8 right-8 z-30">
          <Link href="/" className="p-4 bg-black/40 backdrop-blur-md rounded-2xl hover:bg-black/60 border border-white/5 transition-all block">
             <X size={20} />
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#062b54] via-[#062b54]/40 to-transparent z-10" />
      </section>

      {/* ── 3. ZONA DE CONVERSIÓN (Botones que no estorban) ── */}
      <div className="relative z-30 -mt-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowCRMModal(true)}
            className="group relative overflow-hidden py-8 bg-green-500 text-white font-black rounded-[2.5rem] uppercase text-[11px] tracking-[0.2em] shadow-[0_25px_60px_-15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-4 hover:scale-[1.03] transition-all"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transform skew-x-12 transition-transform duration-1000" />
            <MessageCircle size={22} className="animate-bounce" /> Agendar Cita de Venta
          </button>
          <button 
            onClick={() => document.getElementById('seccion-video')?.scrollIntoView({ behavior: 'smooth' })} 
            className="py-8 bg-white text-black font-black rounded-[2.5rem] uppercase text-[11px] tracking-[0.2em] shadow-[0_25px_60px_-15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 hover:bg-hormozi-yellow transition-all"
          >
            <Play size={22} fill="currentColor" /> Tour Video Cinematográfico
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 max-w-[1400px] mx-auto py-32 space-y-48 pb-48">
        
        {/* ── 4. VIDEO REEL ── */}
        {property.video_url && (
          <section id="seccion-video" className="space-y-12">
             <div className="text-center space-y-4">
               <div className="text-hormozi-yellow text-[11px] font-black uppercase tracking-[0.5em] italic">Propiedad Destacada</div>
               <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">Cine <span className="text-hormozi-yellow">Inmobiliario</span></h2>
             </div>
             <div className="aspect-video max-w-6xl mx-auto rounded-[5rem] overflow-hidden border-8 border-white/5 shadow-[0_60px_100px_rgba(0,0,0,0.6)] bg-black">
                <video src={property.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-[0.9]" />
             </div>
          </section>
        )}

        {/* ── 5. GALERÍA INTELIGENTE ── */}
        <section className="space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">Álbum <span className="text-hormozi-yellow">HD</span></h2>
              <div className="hidden md:flex gap-3 mb-4">
                 {images.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all duration-1000 ${i === autoCarouselIndex ? 'w-12 bg-hormozi-yellow shadow-[0_0_15px_#facc15]' : 'w-4 bg-white/10'}`} />
                 ))}
              </div>
            </div>
           <div className="relative aspect-[21/9] rounded-[5rem] overflow-hidden border-2 border-white/10 bg-black group shadow-3xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={autoCarouselIndex}
                  initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.5 }}
                  src={images[autoCarouselIndex]?.url}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => { setCurrentPhoto(autoCarouselIndex); setLightboxOpen(true); }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
           </div>
        </section>

        {/* ── 6. FICHA TÉCNICA PREMIUM ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
           <div className="lg:col-span-7 space-y-16">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-4 px-6 py-3 bg-hormozi-yellow/10 text-hormozi-yellow rounded-full border-2 border-hormozi-yellow/20">
                    <MapPin size={22} /> <span className="font-black text-[12px] uppercase tracking-widest italic">{property.location}</span>
                 </div>
                 <h1 className="text-7xl md:text-[10rem] font-extrabold uppercase italic tracking-tighter leading-[0.8] mb-8">{property.title}</h1>
                 <p className="text-2xl md:text-4xl text-white/50 leading-relaxed font-semibold italic">{property.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { ic: <BedDouble size={32} />, val: "3", l: "Habs" },
                  { ic: <Bath size={32} />, val: "2", l: "Baños" },
                  { ic: <Square size={32} />, val: "125", l: "m² Total" },
                  { ic: <Car size={32} />, val: "1", l: "Plaza" }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-12 rounded-[4rem] border-2 border-white/5 flex flex-col items-center hover:border-hormozi-yellow/30 transition-all">
                    <div className="text-hormozi-yellow mb-5">{s.ic}</div>
                    <div className="text-4xl font-black italic mb-2">{s.val}</div>
                    <div className="text-[11px] uppercase font-bold text-white/20 tracking-[0.3em]">{s.l}</div>
                  </div>
                ))}
              </div>
           </div>
           <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-40">
              <div className="bg-white p-14 md:p-20 rounded-[5rem] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.4)]">
                 <div className="text-black/30 font-black uppercase tracking-[0.4em] text-[11px] mb-6 italic">Inversión Patrimonial</div>
                 <div className="text-7xl md:text-9xl font-black italic tracking-tighter text-black leading-none mb-12">${property.price?.toLocaleString()}</div>
                 <button onClick={() => setShowCRMModal(true)} className="w-full py-9 bg-[#062b54] text-white flex items-center justify-center gap-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-black hover:scale-[1.02] transition-all shadow-xl">
                    Solicitar Agenda <ChevronRight size={20}/>
                 </button>
              </div>
              
              {stagedImg && originalImg && (
                <div className="bg-black/40 p-10 rounded-[5rem] border-2 border-white/5 space-y-8 shadow-2xl backdrop-blur-xl">
                   <div className="flex items-center justify-between px-4">
                     <span className="text-[11px] font-black uppercase tracking-[0.3em] text-hormozi-yellow">Visión Evolucionada</span>
                     <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic animate-pulse">Desliza para ver el cambio</span>
                   </div>
                   <MagicSlider before={originalImg.url} after={stagedImg.url} />
                </div>
              )}
           </div>
        </section>

      </div>

      {/* ── MODAL CRM (Apperty Style) ── */}
      <AnimatePresence>
        {showCRMModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="bg-[#062b54] border border-white/10 rounded-[5rem] p-12 md:p-20 max-w-2xl w-full shadow-3xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowCRMModal(false)} 
                className="absolute top-10 right-10 text-white/20 hover:text-white transition-all transform hover:rotate-90"
              >
                <X size={40}/>
              </button>

              {!sentSuccess ? (
                <>
                  <div className="text-hormozi-yellow text-[12px] font-black uppercase tracking-[0.5em] mb-6 italic">Paso de Interés</div>
                  <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-6">Únete a la <span className="text-hormozi-yellow">Lista VIP</span></h3>
                  <p className="text-white/40 text-lg mb-12 font-medium">Capturemos tus datos para que un consultor experto te brinde atención personalizada.</p>
                  
                  <form onSubmit={handleLeadSubmit} className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-4">Nombre Completo</label>
                       <div className="relative">
                          <User className="absolute left-10 top-1/2 -translate-y-1/2 text-white/20" size={24} />
                          <input 
                            required value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                            className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] py-8 pl-20 pr-10 text-xl font-bold outline-none focus:border-hormozi-yellow/50 transition-all"
                            placeholder="Ej: Andres Castro"
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-white/30 ml-4">WhatsApp de Contacto</label>
                       <div className="relative">
                          <Phone className="absolute left-10 top-1/2 -translate-y-1/2 text-white/20" size={24} />
                          <input 
                            required value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                            className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] py-8 pl-20 pr-10 text-xl font-bold outline-none focus:border-hormozi-yellow/50 transition-all"
                            placeholder="Ej: +57 300..."
                          />
                       </div>
                    </div>
                    <button 
                      disabled={isSending}
                      className="w-full py-9 bg-hormozi-yellow text-black font-black uppercase tracking-[0.3em] rounded-[2.5rem] text-sm flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSending ? <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" /> : <Send size={24} />}
                      Confirmar y Agendar Cita
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-20">
                   <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-12 shadow-[0_0_80px_rgba(34,197,94,0.6)]">
                      <CheckCircle size={60} className="text-white" />
                   </div>
                   <h3 className="text-6xl font-black uppercase italic tracking-tighter mb-6">¡Datos <span className="text-hormozi-yellow">Capturados!</span></h3>
                   <p className="text-white/40 text-xl italic tracking-wide">Redirigiendo a atención prioritaria...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX (Z-Index Máximo) ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/98 flex items-center justify-center p-8 cursor-zoom-out"
            onClick={() => setLightboxOpen(false)}
          >
            <img src={images[currentPhoto].url} className="max-h-full max-w-full rounded-[3rem] border-4 border-white/5 shadow-3xl" />
            <button className="absolute top-12 right-12 p-8 text-white hover:text-hormozi-yellow transition-all"><X size={48}/></button>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
