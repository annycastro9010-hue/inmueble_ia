"use client";

import { motion } from "framer-motion";
import { Play, MapPin, Eye, ArrowRight, Home, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import TourViewer from "@/components/TourViewer";

export default function LandingPage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const propertyImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600607687940-4ad236f75705?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=1600",
  ];

  return (
    <main className="relative min-h-screen bg-primary overflow-hidden selection:bg-hormozi-yellow selection:text-black font-body">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Primary Background Image (The "House Alone") */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600" 
            alt="Hero Architectural View"
            className="w-full h-full object-cover opacity-50"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setIsVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10 ${
              isVideoLoaded ? "opacity-80" : "opacity-0"
            }`}
          >
            <source src="https://player.vimeo.com/external/494254065.sd.mp4?s=d150bf1f6004901f40d16c526aef6cc6d73f1d8c&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-at from-primary/60 via-transparent to-primary/60 z-20" />
        </div>

        {/* Floating Glass Navbar */}
        <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-50">
           <div className="flex items-center gap-3">
              <div className="p-1.5 bg-hormozi-yellow rounded-sm">
                <Home size={18} className="text-black" />
              </div>
              <span className="font-bold tracking-[0.2em] text-sm uppercase">Soto <span className="text-hormozi-yellow">IA</span></span>
           </div>
           <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white/60 transition-colors">
              Acceso Admin
           </Link>
        </nav>

        {/* Editorial Title Overlay */}
        <div className="relative z-30 text-center px-6 mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "circOut" }}
          >
            <span className="text-[10px] font-bold text-hormozi-yellow uppercase tracking-[0.5em] mb-4 block">Arquitectura & Tecnología</span>
            <h1 className="text-5xl md:text-[7.5rem] font-black text-white leading-[0.85] uppercase -ml-2">
              EL NUEVO <br />
              <span className="italic">ESTÁNDAR</span>
            </h1>
            <div className="mt-12 flex flex-col items-center gap-6">
              <button 
                className="btn-luxury"
                onClick={() => document.getElementById('tour-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Mansión Santander
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE CURATED VIEWPORT (Virtual Tour) */}
      <section id="tour-section" className="relative py-32 px-6 md:px-24 section-tonal-shift">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8">
                LA MAGIA <br /><span className="text-hormozi-yellow">DEL ESTUDIO</span>
              </h2>
              <p className="text-white/40 text-lg leading-relaxed mb-12">
                Convertimos espacios vacíos en sueños habitables. <br />
                Nuestra IA limpia y amuebla cada habitación preservando la esencia arquitectónica original.
              </p>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/20">
                <div className="w-12 h-[1px] bg-white/10" />
                <span>360 Virtual Tour Reality</span>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-7">
            <div className="relative glass-luxury p-4 rounded-3xl overflow-hidden">
               <TourViewer 
                scenes={[
                  {
                    id: 'sala',
                    name: 'Sala Principal',
                    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000',
                    hotspots: [
                      { x: 80, y: 50, targetSceneId: 'cocina', label: 'Ver Cocina' },
                      { x: 20, y: 40, targetSceneId: 'cuarto', label: 'Pasillo Habitaciones' }
                    ]
                  },
                  {
                    id: 'cocina',
                    name: 'Cocina Integral',
                    imageUrl: 'https://images.unsplash.com/photo-1600607687940-4ad236f75705?auto=format&fit=crop&q=80&w=1000',
                    hotspots: [
                      { x: 10, y: 60, targetSceneId: 'sala', label: 'Volver a la Sala' }
                    ]
                  },
                  {
                    id: 'cuarto',
                    name: 'Master Suite',
                    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=1000',
                    hotspots: [
                      { x: 50, y: 80, targetSceneId: 'sala', label: 'Salir a la Sala' }
                    ]
                  }
                ]} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. ASYMMETRIC GRID (Gallery) */}
      <section className="py-32 bg-primary">
        <div className="px-6 md:px-24 mb-16 flex justify-between items-end">
           <div>
             <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.5em] mb-4 italic">The Showcase</h3>
             <h4 className="text-4xl font-extrabold text-white uppercase italic">IA <span className="text-hormozi-yellow">vs</span> REAL</h4>
           </div>
           <button className="text-[9px] font-bold text-white/40 uppercase tracking-widest hover:text-hormozi-yellow transition-colors flex items-center gap-2">
              Ver Galería Completa <ArrowRight size={14} />
           </button>
        </div>

        <div className="flex gap-8 overflow-hidden">
           <motion.div 
             animate={{ x: ["0%", "-50%"] }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="flex gap-8"
           >
             {[...propertyImages, ...propertyImages].map((url, i) => (
                <div key={i} className="w-[500px] h-[650px] flex-shrink-0 rounded-[2rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-black/20 group">
                   <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                </div>
             ))}
           </motion.div>
        </div>
      </section>

      <footer className="py-32 text-center section-tonal-shift">
         <div className="max-w-xl mx-auto">
            <h5 className="text-white/20 text-[9px] font-bold uppercase tracking-[0.6em] mb-12">Proudly Made in Santander</h5>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-white font-black tracking-tighter text-4xl uppercase">Soto <span className="text-hormozi-yellow">IA</span></span>
            </div>
            <p className="text-white/10 text-[10px] uppercase font-bold tracking-widest">© 2026 Architectural Intelligence · Real Estate Studio</p>
         </div>
      </footer>
    </main>
  );
}

