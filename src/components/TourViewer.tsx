"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Move, Maximize, Share2, ClipboardList, Check } from "lucide-react";

interface TourViewerProps {
  imageUrl: string;
  roomName: string;
}

export default function TourViewer({ imageUrl, roomName }: TourViewerProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);

  const surveyQuestions = [
    "¿Qué tan de una quiere comprar la casa?",
    "¿Tiene ya el crédito aprobado o es de contado?",
    "¿Cuántos quedarían viviendo ahí?",
  ];

  const nextStep = () => {
    if (surveyStep < surveyQuestions.length - 1) {
      setSurveyStep(surveyStep + 1);
    } else {
      setShowSurvey(false);
      alert("¡Listo! Ya agendamos su cita para que la vea en persona.");
    }
  };
  
  return (
    <div className="relative w-full h-[600px] bg-black rounded-3xl overflow-hidden border border-white/10 group">
      {/* 360 Pan Simulation */}
      <motion.div 
        animate={{ x: ["-10%", "10%"] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        className="absolute inset-0 w-[120%] h-full left-[-10%]"
      >
        <img 
          src={imageUrl} 
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
          alt={roomName}
        />
      </motion.div>

      {/* Survey Overlay */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-md w-full p-8 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl">
              <span className="text-hormozi-yellow text-[10px] uppercase font-bold tracking-widest mb-2 block">Sondeo de interés</span>
              <h4 className="text-2xl font-bold text-white mb-6 leading-tight">{surveyQuestions[surveyStep]}</h4>
              
              <div className="flex flex-col gap-3">
                 <button onClick={nextStep} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white text-left px-6 hover:bg-hormozi-yellow hover:text-black transition-all font-bold">
                    Opción A
                 </button>
                 <button onClick={nextStep} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white text-left px-6 hover:bg-hormozi-yellow hover:text-black transition-all font-bold">
                    Opción B
                 </button>
              </div>

              <div className="mt-8 flex gap-2">
                {surveyQuestions.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= surveyStep ? "bg-hormozi-yellow" : "bg-white/10"}`} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlays */}
      <div className="absolute inset-x-0 bottom-0 p-8 flex items-end justify-between bg-gradient-to-t from-black via-black/40 to-transparent">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-hormozi-yellow mb-2">Paseo virtual activo</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tighter uppercase italic">{roomName}</h3>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowSurvey(true)}
            className="px-6 py-4 bg-hormozi-yellow text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all"
          >
            <ClipboardList size={20} />
            <span>¡Me interesa!</span>
          </button>
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
         <div className="w-2 h-2 bg-hormozi-yellow rounded-full animate-pulse" />
         <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Mueva la imagen para conocer su casa</span>
      </div>
    </div>
  );
}
