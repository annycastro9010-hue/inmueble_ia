"use client";

import { useState } from "react";
import { 
  Upload, 
  Trash2, 
  Wand2, 
  Video, 
  LayoutDashboard, 
  Home, 
  Settings,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [images, setImages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleUpload = (e: any) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      roomType: "unassigned",
      status: "original"
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
    // Simulate AI Processing
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: type === "clean" ? "cleaned" : "staged" } : img
      ));
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-hormozi-yellow p-1.5 rounded rotate-12">
            <Home size={18} className="text-black" />
          </div>
          <span className="font-bold tracking-tighter uppercase text-sm">Builder <span className="text-hormozi-yellow">Studio</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 rounded-lg text-hormozi-yellow font-medium text-sm transition-all hover:bg-white/10">
            <LayoutDashboard size={18} />
            Resumen
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-all">
            <ImageIcon size={18} />
            Mis Inmuebles
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-all">
            <Settings size={18} />
            Ajustes
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Plan Profesional</p>
            <p className="text-xs font-medium mb-3">IA Ilimitada</p>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all">Mejorar Plan</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
            <span>Inmuebles</span>
            <ChevronRight size={14} />
            <span className="text-white">Casa del Horizonte</span>
          </div>

          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
              <Video size={16} className="text-hormozi-yellow" />
              Crear Video Viral
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-hormozi-yellow text-black rounded-lg text-xs font-bold hover:scale-105 transition-all uppercase tracking-widest">
              Lanzar al Mundo
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12">
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-12">
            {[
              { n: 1, t: "Subir Fotos" },
              { n: 2, t: "Mejorar con IA" },
              { n: 3, t: "Etiquetar" }
            ].map((step) => (
              <div key={step.n} className={`flex items-center gap-3 ${activeStep === step.n ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${activeStep === step.n ? "bg-hormozi-yellow text-black" : "bg-white/10"}`}>
                  {step.n}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{step.t}</span>
                {step.n < 3 && <div className="w-12 h-[1px] bg-white/10 mx-2" />}
              </div>
            ))}
          </div>

          {/* Upload Area */}
          {images.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-white/10 rounded-3xl p-24 flex flex-col items-center justify-center text-center bg-white/[0.02]"
            >
              <div className="w-20 h-20 bg-hormozi-yellow/10 rounded-full flex items-center justify-center mb-6">
                <Upload className="text-hormozi-yellow" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Suelte aquí sus fotos</h2>
              <p className="text-white/40 max-w-sm mb-8">Suba fotos simples de celular. Nuestra IA se encarga de limpiarlas y amoblarlas por usted.</p>
              <label className="cursor-pointer px-10 py-4 bg-white text-black font-extrabold rounded-xl uppercase tracking-tighter hover:scale-105 transition-all">
                Seleccionar fotos
                <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence>
                {images.map((img) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={img.id}
                    className="group relative bg-[#111] rounded-2xl overflow-hidden border border-white/5"
                  >
                    <div className="aspect-[4/3] relative">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {img.status !== "original" && (
                          <div className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded flex items-center gap-1 uppercase">
                            <CheckCircle2 size={10} /> {img.status === "cleaned" ? "LIMPIA" : "AMOBLADA"}
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => removeImage(img.id)}
                        className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="p-5">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest mb-4 focus:border-hormozi-yellow outline-none"
                        value={img.roomType}
                        onChange={(e) => {
                          const newImages = images.map(i => i.id === img.id ? { ...i, roomType: e.target.value } : i);
                          setImages(newImages);
                        }}
                      >
                        <option value="unassigned">¿Qué habitación es?</option>
                        <option value="living">Sala Principal</option>
                        <option value="kitchen">Cocina</option>
                        <option value="bedroom">Habitación</option>
                        <option value="exterior">Fachada / Jardín</option>
                        <option value="pool">Piscina / Social</option>
                      </select>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => processAI(img.id, "clean")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-hormozi-yellow" />}
                          Limpieza IA
                        </button>
                        <button 
                          onClick={() => processAI(img.id, "stage")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} className="text-indigo-400" />}
                          Amoblar de una
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add More Button */}
              <label className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors p-12">
                 <Upload size={24} className="text-white/20" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Agregar más fotos</span>
                 <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
