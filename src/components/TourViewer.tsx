"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Move, Maximize, Share2 } from "lucide-react";

interface TourViewerProps {
  imageUrl: string;
  roomName: string;
}

export default function TourViewer({ imageUrl, roomName }: TourViewerProps) {
  const containerRef = useRef(null);
  
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

      {/* UI Overlays */}
      <div className="absolute inset-x-0 bottom-0 p-8 flex items-end justify-between bg-gradient-to-t from-black via-black/40 to-transparent">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-hormozi-yellow mb-2">Virtual Tour Active</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tighter uppercase italic">{roomName}</h3>
        </div>

        <div className="flex gap-3">
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-hormozi-yellow hover:text-black transition-all">
            <Move size={20} />
          </button>
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-hormozi-yellow hover:text-black transition-all">
            <Maximize size={20} />
          </button>
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-hormozi-yellow hover:text-black transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
         <div className="w-2 h-2 bg-hormozi-yellow rounded-full animate-pulse" />
         <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Drag to explore property</span>
      </div>
    </div>
  );
}
