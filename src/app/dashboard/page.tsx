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
      floor: "1",
      status: "original"
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: type === "clean" ? "cleaned" : "staged" } : img
      ));
      setIsProcessing(false);
    }, 2000);
  };

  // Group images by floor for better organization
  const floors = ["1", "2", "3", "Exterior"];

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      {/* Sidebar - Same as before */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-hormozi-yellow p-1.5 rounded rotate-12">
            <Home size={18} className="text-black" />
          </div>
          <span className="font-bold tracking-tighter uppercase text-sm italic">ESTUDIO <span className="text-hormozi-yellow">IA</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 rounded-lg text-hormozi-yellow font-medium text-sm transition-all">
            <LayoutDashboard size={18} />
            Resumen
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-all">
            <ImageIcon size={18} />
            Mis Inmuebles
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md">
           <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
            <span>Inmuebles</span>
            <ChevronRight size={14} />
            <span className="text-white">Organizando Casa de 3 Pisos</span>
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

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {images.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-white/10 rounded-3xl p-24 flex flex-col items-center justify-center text-center bg-white/[0.02]"
            >
              <Upload className="text-hormozi-yellow mb-6" size={48} />
              <h2 className="text-3xl font-extrabold mb-4 uppercase tracking-tighter italic">Suelte aquí todas las fotos</h2>
              <p className="text-white/40 max-w-sm mb-8">No importa si es el primer piso o el patio. Súbalas todas y aquí las organizamos de una.</p>
              <label className="cursor-pointer px-10 py-4 bg-white text-black font-extrabold rounded-xl uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                Seleccionar fotos
                <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            </motion.div>
          ) : (
            <div className="space-y-16">
              {floors.map((floor) => {
                const floorImages = images.filter(img => img.floor === floor || (floor === "1" && img.floor === "unassigned"));
                if (floorImages.length === 0 && floor !== "1") return null;

                return (
                  <div key={floor} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                        {floor === "Exterior" ? "Fachada y Exteriores" : `Piso ${floor}`}
                      </h3>
                      <div className="h-[1px] flex-1 bg-white/10" />
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{floorImages.length} fotos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {floorImages.map((img) => (
                         <motion.div key={img.id} layout className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden group">
                           <div className="aspect-video relative">
                             <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                             <div className="absolute top-4 right-4 flex gap-2">
                               <button onClick={() => removeImage(img.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           </div>
                           
                           <div className="p-4 space-y-3">
                             <div className="flex gap-2">
                               <select 
                                 value={img.floor}
                                 onChange={(e) => setImages(images.map(i => i.id === img.id ? { ...i, floor: e.target.value } : i))}
                                 className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold uppercase text-hormozi-yellow outline-none"
                               >
                                 <option value="1">Piso 1</option>
                                 <option value="2">Piso 2</option>
                                 <option value="3">Piso 3</option>
                                 <option value="Exterior">Exterior</option>
                               </select>

                               <select 
                                 value={img.roomType}
                                 onChange={(e) => setImages(images.map(i => i.id === img.id ? { ...i, roomType: e.target.value } : i))}
                                 className="flex-[2] bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold uppercase outline-none"
                               >
                                 <option value="unassigned">Habitación...</option>
                                 <option value="sala">Sala / Comedor</option>
                                 <option value="cocina">Cocina</option>
                                 <option value="principal">Hab. Principal</option>
                                 <option value="cuarto2">Habitación 2</option>
                                 <option value="cuarto3">Habitación 3</option>
                                 <option value="baño">Baño</option>
                                 <option value="patio">Patio / Ropas</option>
                               </select>
                             </div>

                             <div className="flex gap-2">
                                <button onClick={() => processAI(img.id, "clean")} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-hormozi-yellow hover:text-black transition-all">Limpieza</button>
                                <button onClick={() => processAI(img.id, "stage")} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-hormozi-yellow hover:text-black transition-all">Amoblar</button>
                             </div>
                           </div>
                         </motion.div>
                       ))}

                       {/* Mini Upload for this floor */}
                       <label className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.02] p-8">
                          <Upload size={20} className="text-white/20" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Añadir más al {floor === "Exterior" ? "Exterior" : `Piso ${floor}`}</span>
                          <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*" />
                       </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
