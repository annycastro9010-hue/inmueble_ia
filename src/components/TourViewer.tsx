"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Maximize, Share2, ClipboardList, MapPin, ArrowRight, X } from "lucide-react";

export interface Hotspot {
  x: number;
  y: number;
  targetSceneId: string;
  label: string;
}

export interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

interface TourViewerProps {
  scenes: Scene[];
  initialSceneId?: string;
  autoPlay?: boolean;
}

// Hook para detectar si una imagen es panorámica (ratio > 2:1)
function usePanoramicDetection(imageUrl: string) {
  const [isPanoramic, setIsPanoramic] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setIsPanoramic(ratio >= 2.0); // Panorámica si es 2x más ancha que alta
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return isPanoramic;
}

// Sub-componente para una escena individual con Ken Burns adaptativo
function SceneDisplay({ scene }: { scene: Scene }) {
  const isPanoramic = usePanoramicDetection(scene.imageUrl);

  // Si es panorámica: recorre el 20% de ancho. Si es normal: apenas el 4%.
  const travelX = isPanoramic ? ["-10%", "10%"] : ["-2%", "2%"];
  const containerWidth = isPanoramic ? "120%" : "104%";
  const containerLeft = isPanoramic ? "-10%" : "-2%";
  const scaleAnim = isPanoramic ? [1, 1.02] : [1, 1.06];
  const duration = isPanoramic ? 30 : 20; // Las panorámicas se mueven más lento

  return (
    <>
      <div className="absolute inset-0 bg-black overflow-hidden">
        {/* Fondo desenfocado para móviles para ver la imagen completa */}
        <div className="absolute inset-0 md:hidden overflow-hidden">
           <img
            src={scene.imageUrl}
            className="w-full h-full object-cover blur-3xl opacity-40 scale-110"
            alt=""
          />
        </div>
        
        <motion.div
          animate={{ x: travelX, scale: scaleAnim }}
          transition={{ duration, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          style={{ width: containerWidth, left: containerLeft }}
          className="absolute inset-0 h-full overflow-hidden"
        >
          <img
            src={scene.imageUrl}
            crossOrigin="anonymous"
            className="w-full h-full object-contain md:object-cover transition-all duration-1000"
            alt={scene.name}
          />
        </motion.div>
      </div>

      {/* Badge de Panorámica */}
      {isPanoramic && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 right-10 px-4 py-2 bg-hormozi-yellow text-black text-[9px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
          PANORÁMICA 360
        </motion.div>
      )}
    </>
  );
}

export default function TourViewer({ scenes, initialSceneId, autoPlay }: TourViewerProps) {
  const [currentSceneId, setCurrentSceneId] = useState(initialSceneId || scenes[0]?.id);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const currentScene = scenes.find((s) => s.id === currentSceneId) || scenes[0];

  const surveyQuestions = [
    "¿Qué tan pronto desea adquirir el inmueble?",
    "¿Cuenta con financiamiento aprobado o compra de contado?",
    "¿Para cuántas personas busca este espacio?",
  ];

  const nextStep = () => {
    if (surveyStep < surveyQuestions.length - 1) {
      setSurveyStep(surveyStep + 1);
    } else {
      setShowSurvey(false);
      alert("¡Gracias! Hemos recibido su interés. Un asesor se contactará pronto.");
      setSurveyStep(0);
    }
  };

  // Efecto de AutoPlay
  useEffect(() => {
    if (!autoPlay || scenes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSceneId((prev) => {
        const idx = scenes.findIndex((s) => s.id === prev);
        const nextIdx = (idx + 1) % scenes.length;
        return scenes[nextIdx].id;
      });
    }, 6000); // Cambia cada 6 segundos
    return () => clearInterval(interval);
  }, [autoPlay, scenes]);

  const goToScene = (id: string) => setCurrentSceneId(id);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("¡Link del Tour copiado al portapapeles! 🚀");
  };

  if (!currentScene) return null;

  return (
    <div
      ref={viewerRef}
      className="relative w-full h-full bg-black rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
    >
      {/* Escena con Ken Burns Adaptativo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          <SceneDisplay scene={currentScene} />

          {/* Hotspots */}
          <div className="absolute inset-0 pointer-events-none">
            {currentScene.hotspots.map((spot, idx) => (
              <motion.button
                key={`${currentScene.id}-spot-${idx}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.2 }}
                onClick={() => goToScene(spot.targetSceneId)}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                className="absolute pointer-events-auto p-2 group/spot"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-14 h-14 bg-hormozi-yellow/30 rounded-full animate-ping" />
                  <div className="relative bg-hormozi-yellow p-4 rounded-full text-black shadow-2xl group-hover/spot:scale-125 transition-all">
                    <ArrowRight size={20} className="-rotate-45" />
                  </div>
                  <div className="absolute top-full mt-4 bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 opacity-0 group-hover/spot:opacity-100 transition-all whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{spot.label}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Survey Overlay */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="max-w-md w-full p-6 md:p-10 bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl relative">
              <button
                onClick={() => setShowSurvey(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <span className="text-hormozi-yellow text-[10px] uppercase font-black tracking-[0.3em] mb-4 block">
                Cualificación de Comprador
              </span>
              <h4 className="text-3xl font-black text-white mb-8 leading-tight italic uppercase tracking-tighter">
                {surveyQuestions[surveyStep]}
              </h4>

              <div className="flex flex-col gap-4">
                <button
                  onClick={nextStep}
                  className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-left px-8 hover:bg-hormozi-yellow hover:text-black transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  Sí, estoy listo para actuar
                </button>
                <button
                  onClick={nextStep}
                  className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-left px-8 hover:bg-hormozi-yellow hover:text-black transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  Todavía estoy explorando opciones
                </button>
              </div>

              <div className="mt-12 flex gap-3">
                {surveyQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i <= surveyStep
                        ? "bg-hormozi-yellow shadow-[0_0_10px_rgba(255,255,0,0.5)]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles Inferiores */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-end justify-between bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none gap-4 md:gap-0">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 text-[8px] md:text-[10px] uppercase font-black tracking-[0.3em] md:tracking-[0.5em] text-hormozi-yellow mb-2 md:mb-4">
            <div className="w-1.5 h-1.5 bg-hormozi-yellow rounded-full animate-pulse" />
            <MapPin size={12} /> Recorrido Virtual
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic line-clamp-1">
            {currentScene.name}
          </h3>
        </div>

        <div className="flex gap-2 md:gap-4 pointer-events-auto">
          <button
            onClick={() => setShowSurvey(true)}
            className="px-6 md:px-8 py-3 md:py-5 bg-hormozi-yellow text-black rounded-full font-black flex items-center gap-2 md:gap-3 hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,0,0.2)] uppercase tracking-widest text-[9px] md:text-[10px]"
          >
            <ClipboardList size={22} />
            <span>Interesado</span>
          </button>

          <button
            onClick={handleShare}
            className="p-3 md:p-5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
            title="Compartir"
          >
            <Share2 size={22} />
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-3 md:p-5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
            title="Pantalla Completa"
          >
            <Maximize size={22} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs de Navegación */}
      <div className="absolute top-10 left-10 flex gap-3 pointer-events-auto">
        {scenes.map((s) => (
          <button
            key={s.id}
            onClick={() => goToScene(s.id)}
            className={`h-1.5 transition-all duration-700 rounded-full ${
              s.id === currentScene.id ? "w-12 bg-hormozi-yellow" : "w-6 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
