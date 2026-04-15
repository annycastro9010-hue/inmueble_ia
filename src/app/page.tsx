"use client";

import { motion } from "framer-motion";
import { Play, MapPin, Eye, ArrowRight, Home, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import TourViewer from "@/components/TourViewer";

export default function LandingPage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Mock data for images that "move alone"
  const propertyImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA4dYqDyk69GFn771jrhjQF6L_qfSpXpWks645bLXtHwXwKVhCQA0Ml10UG-0ALjKggCGm0m0Nm53emiGBNr_Grr0dvayR6X8KDPvimr5ZLeXEE07RITlMS3qacTWPSFH_B5iobL_fXckgB3YC9OiotyRUy98dYb_HvNuC-_96pmsuQSHDvo1BHVKO9hCrNASUdLdU8mSLy-pQuBePJU5wh4jmQFNwf1Y7qcfuNnhA9yeOR5rfXV-ppFZSln2YB_Gkt3CezPUfRTec",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600607687940-4ad236f75705?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=1000",
  ];

  return (
    <main className="relative min-h-screen bg-[#050505] overflow-hidden selection:bg-hormozi-yellow selection:text-black">
      {/* 1. VIDEO HERO SECTION */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setIsVideoLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isVideoLoaded ? "opacity-30" : "opacity-0"
            }`}
          >
            <source src="https://player.vimeo.com/external/494254065.sd.mp4?s=d150bf1f6004901f40d16c526aef6cc6d73f1d8c&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-at from-black via-transparent to-black" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-7xl md:text-[12xl] font-extrabold text-white tracking-tighter leading-[0.7] mb-8 uppercase">
              EL ESTÁNDAR <br />
              <span className="text-hormozi-yellow italic">MODERNO</span>
            </h1>
            <p className="text-white/40 text-xl font-bold uppercase tracking-[0.2em] mb-12">Provincia de Soto · Santander</p>
            
            <button className="btn-hormozi group" onClick={() => document.getElementById('tour-section')?.scrollIntoView({ behavior: 'smooth' })}>
              ¡Pegue una vuelta ahora!
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. VIRTUAL TOUR SECTION */}
      <section id="tour-section" className="py-24 px-6 md:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
            <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight uppercase leading-none">
              Dese un <br /><span className="text-hormozi-yellow">recorridito</span>
            </h2>
            <p className="max-w-md text-white/50 text-right">
              Mire cómo queda la casa limpiecita y amoblada con nuestra IA. De una foto simple de celular, nosotros le armamos todo.
            </p>
          </div>
          <TourViewer 
            roomName="Sala Principal y Comedor" 
            imageUrl="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
          />
        </div>
      </section>

      {/* 3. MOVING IMAGES SECTION (The "Alex Hormozi" Slider) */}
      <section className="py-24 bg-black/50 border-y border-white/5">
        <div className="px-6 md:px-24 mb-12">
           <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter">Casa vacía vs <span className="text-hormozi-yellow">IA Mágica</span></h3>
        </div>

        <div className="flex gap-4 overflow-hidden whitespace-nowrap">
           <motion.div 
             animate={{ x: ["0%", "-50%"] }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="flex gap-4"
           >
             {[...propertyImages, ...propertyImages].map((url, i) => (
                <div key={i} className="w-[400px] h-[500px] flex-shrink-0 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/10">
                   <img src={url} className="w-full h-full object-cover" />
                </div>
             ))}
           </motion.div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-24 text-center border-t border-white/5">
         <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2 bg-hormozi-yellow rounded rotate-12">
              <Home size={20} className="text-black" />
            </div>
            <span className="text-white font-extrabold tracking-tighter text-2xl uppercase">Inmueble IA</span>
         </div>
         <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em]">Diseñado para vender de una</p>
      </footer>
    </main>
  );
}
