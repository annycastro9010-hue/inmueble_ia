"use client";

import { motion } from "framer-motion";
import { MapPin, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      setProperties(data || []);
      setLoading(false);
    }
    fetchProperties();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#062b54] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hormozi-yellow"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#062b54] text-white selection:bg-hormozi-yellow">
      
      {/* ── NAV ESTÁTICO ── */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-[#062b54]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-hormozi-yellow rounded-sm rotate-3">
            <Home size={16} className="text-black" />
          </div>
          <span className="font-black tracking-[0.2em] text-xs uppercase">SOTO <span className="text-hormozi-yellow">PROPERTIES</span></span>
        </div>
        <Link href="/dashboard" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
          Admin Portal
        </Link>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#062b54] via-transparent to-[#062b54] z-10" />
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600" 
            className="w-full h-full object-cover"
            alt="Hero Background"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 text-center space-y-6 max-w-5xl"
        >
          <div className="bg-hormozi-yellow text-black px-6 py-2 rounded-full inline-block font-black uppercase text-[10px] tracking-[0.3em] italic mb-4">
            Santander Premier Real Estate
          </div>
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8]">
             Tours <span className="text-hormozi-yellow">Inmersivos</span>
          </h1>
          <p className="text-white/40 text-lg md:text-xl uppercase tracking-[0.2em] font-bold mt-6">
            La nueva forma de comprar casa en Bucaramanga
          </p>
        </motion.div>
      </section>

      {/* ── LISTADO DE PROPIEDADES ── */}
      <section className="py-24 px-6 md:px-16 container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Nuestras <span className="text-hormozi-yellow">Propiedades</span></h2>
            <p className="text-white/20 uppercase tracking-widest text-xs font-bold">Listado actualizado en tiempo real</p>
          </div>
          <div className="h-0.5 flex-1 bg-white/5 mx-12 hidden md:block mb-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-[#041a30] rounded-[3.5rem] border border-white/5 hover:border-hormozi-yellow/40 transition-all duration-700 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#041a30] via-transparent to-transparent z-10 opacity-80" />
                <img 
                  src={prop.main_image || (i % 2 === 0 ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" : "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800")}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                  alt={prop.title}
                />
                <div className="absolute bottom-8 left-8 right-8 z-20 space-y-1">
                   <div className="text-hormozi-yellow font-black uppercase text-[9px] tracking-[0.3em] flex items-center gap-2">
                      <MapPin size={12}/> {prop.location}
                   </div>
                   <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{prop.title}</h3>
                </div>
              </div>

              <div className="p-8 pt-0 space-y-6 flex-1 flex flex-col">
                <div className="text-3xl font-black italic tracking-tighter text-white/90">
                  ${prop.price?.toLocaleString() || '185.000.000'}
                </div>
                
                <Link 
                  href={`/propiedad/${prop.id}`}
                  className="w-full py-6 bg-white text-black text-center font-black rounded-3xl uppercase text-xs tracking-widest hover:bg-hormozi-yellow transition-all flex items-center justify-center gap-3 group-hover:shadow-[0_10px_40px_rgba(251,204,4,0.2)]"
                >
                  Ver Tour Virtual <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem]">
            <h4 className="text-white/20 font-black uppercase tracking-[0.4em]">Próximamente nuevas propiedades</h4>
          </div>
        )}
      </section>

      <footer className="py-24 text-center border-t border-white/5 bg-black/20">
        <div className="max-w-4xl mx-auto space-y-8 opacity-40">
           <div className="flex justify-center gap-8">
              <span className="font-black italic uppercase tracking-widest text-[10px]">Tours 360</span>
              <span className="font-black italic uppercase tracking-widest text-[10px]">Limpieza IA</span>
              <span className="font-black italic uppercase tracking-widest text-[10px]">Marketing 4K</span>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-[0.8em]">SOTO IA PROPERTIES · 2026</p>
        </div>
      </footer>
    </main>
  );
}
