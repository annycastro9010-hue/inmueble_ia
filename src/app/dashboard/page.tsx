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

  const handleUpload = (e: any, floor: string = "1") => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      roomType: "unassigned",
      floor: floor,
      status: "original"
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const processAI = async (id: string, type: "clean" | "stage") => {
    setIsProcessing(true);
    const targetImage = images.find(img => img.id === id);
    
    if (!targetImage) return;

    try {
      const { processPropertyImage } = await import("@/lib/ai-stager");
      const prediction = await processPropertyImage({
        imageUrl: targetImage.url,
        roomType: targetImage.roomType,
        mode: type
      });

      setImages(prev => prev.map(img => 
        img.id === id ? { 
          ...img, 
          status: type === "clean" ? "cleaned" : "staged",
          predictionId: prediction.id
        } : img
      ));
      
      alert(`¡Petición de ${type} enviada! ID: ${prediction.id}`);

    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con la IA. ¿Configuraste el REPLICATE_API_TOKEN?");
    } finally {
      setIsProcessing(false);
    }
  };

  const floors = ["1", "2", "3", "Exterior"];

  return (
    <div className="flex h-screen bg-[#062b54] text-white font-body selection:bg-hormozi-yellow">
      {/* Sidebar - Architecture Focus */}
      <aside className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-hormozi-yellow p-1.5 rounded-sm rotate-3">
            <Home size={20} className="text-black" />
          </div>
          <span className="font-black tracking-[0.3em] text-sm uppercase italic">SOTO <span className="text-hormozi-yellow">IA</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="flex items-center gap-4 w-full px-5 py-4 bg-white/5 rounded-xl text-hormozi-yellow font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard size={18} />
            Estudio de Diseño
          </button>
          <button className="flex items-center gap-4 w-full px-5 py-4 text-white/30 hover:text-white hover:bg-white/5 rounded-xl text-xs uppercase tracking-widest transition-all">
            <ImageIcon size={18} />
            Catálogo Real
          </button>
          <button className="flex items-center gap-4 w-full px-5 py-4 text-white/30 hover:text-white hover:bg-white/5 rounded-xl text-xs uppercase tracking-widest transition-all">
            <Settings size={18} />
            Integraciones
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-black/10 backdrop-blur-md">
            <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">
              <span>Proyectos</span>
              <ChevronRight size={14} />
              <span className="text-white">Mansión Santander · Rev 01</span>
            </div>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
                <Video size={16} className="text-hormozi-yellow" />
                Generar Viral Reel
              </button>
              <button className="btn-luxury">
                Publicar Showcase
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {images.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full border border-dashed border-white/10 rounded-[3rem] p-24 flex flex-col items-center justify-center text-center bg-white/[0.01]"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                <Upload className="text-hormozi-yellow" size={32} />
              </div>
              <h2 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter italic">Comience la transformación</h2>
              <p className="text-white/30 max-w-sm mb-12 text-sm leading-relaxed">Arrastre las fotografías arquitectónicas aquí. No importa el orden, nuestra IA las clasificará por piso.</p>
              <label className="cursor-pointer px-12 py-5 bg-white text-black font-black rounded-2xl uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] text-sm">
                Cargar Archivos
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, "1")} accept="image/*" />
              </label>
            </motion.div>
          ) : (
            <div className="space-y-24">
              {floors.map((floor) => {
                const floorImages = images.filter(img => img.floor === floor || (floor === "1" && img.floor === "unassigned"));
                if (floorImages.length === 0 && floor !== "1") return null;

                return (
                  <div key={floor} className="space-y-10">
                    <div className="flex items-center gap-6">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                        {floor === "Exterior" ? "Exteriores" : `Nivel ${floor}`}
                      </h3>
                      <div className="h-[1px] flex-1 bg-white/5" />
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">{floorImages.length} Activos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {floorImages.map((img) => (
                         <motion.div key={img.id} layout className="glass-luxury rounded-[2rem] overflow-hidden group">
                           <div className="aspect-[4/3] relative">
                             <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute top-6 right-6 flex gap-2">
                               <button onClick={() => removeImage(img.id)} className="p-3 bg-red-500/20 text-red-500 rounded-xl backdrop-blur-3xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                 <Trash2 size={16} />
                               </button>
                             </div>
                           </div>
                           
                           <div className="p-6 space-y-4">
                             <div className="flex gap-2">
                               <select 
                                 value={img.floor}
                                 onChange={(e) => setImages(images.map(i => i.id === img.id ? { ...i, floor: e.target.value } : i))}
                                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[10px] font-bold uppercase text-hormozi-yellow outline-none"
                               >
                                 <option value="1">Nivel 1</option>
                                 <option value="2">Nivel 2</option>
                                 <option value="3">Nivel 3</option>
                                 <option value="Exterior">Exterior</option>
                               </select>

                               <select 
                                 value={img.roomType}
                                 onChange={(e) => setImages(images.map(i => i.id === img.id ? { ...i, roomType: e.target.value } : i))}
                                 className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[10px] font-bold uppercase outline-none"
                               >
                                 <option value="unassigned">Tipo de Espacio...</option>
                                 <option value="sala">Sala / Living</option>
                                 <option value="cocina">Cocina Gourmet</option>
                                 <option value="principal">Master Suite</option>
                                 <option value="cuarto2">Suite Junior</option>
                                 <option value="baño">Baño / Spa</option>
                                 <option value="patio">Terraza / Deck</option>
                               </select>
                             </div>

                             <div className="flex gap-3">
                                <button 
                                  onClick={() => processAI(img.id, "clean")} 
                                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-hormozi-yellow hover:text-black transition-all"
                                >
                                  Virtual Cleaning
                                </button>
                                <button 
                                  onClick={() => processAI(img.id, "stage")} 
                                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                >
                                  Virtual Staging
                                </button>
                             </div>
                           </div>
                         </motion.div>
                       ))}

                       <label className="border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.02] p-12 transition-all">
                          <Upload size={24} className="text-white/20" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Añadir Activos</span>
                          <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, floor)} accept="image/*" />
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

