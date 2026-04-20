import React, { useState, useRef } from 'react';
import { Camera, Eye } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as bodyPix from '@tensorflow-models/body-pix';

export const IntelligencePanel: React.FC = () => {
  const [isCVPredicting, setIsCVPredicting] = useState(false);
  const [crowdDensity, setCrowdDensity] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCV = async () => {
    try {
      setIsCVPredicting(true);
      
      // Ensure backend is initialized
      await tf.ready();
      // Try WebGL first, fallback to CPU
      try {
        await tf.setBackend('webgl');
      } catch (e) {
        await tf.setBackend('cpu');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });

      const detect = async () => {
        if (!videoRef.current || !canvasRef.current || !isCVPredicting) return;
        
        const segmentation = await net.segmentPerson(videoRef.current);
        const density = segmentation.allPoses.length;
        setCrowdDensity(density);

        requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.error(err);
      setIsCVPredicting(false);
    }
  };

  const stopCV = () => {
    setIsCVPredicting(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden min-h-[500px]">
      <div className="flex border-b border-white/10">
        <div className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-white/5 text-sky-400">
          <Eye className="w-4 h-4" /> CrowdPulse CV Analytics
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          {isCVPredicting ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
              <div className="absolute inset-0 grid-lines opacity-20"></div>
              <video ref={videoRef} className="w-full h-full object-cover grayscale opacity-50" />
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-sky-500/30 p-3 rounded-lg flex flex-col items-end">
                <div className="text-[9px] uppercase tracking-widest text-sky-400 mb-1">Density Index</div>
                <div className="text-3xl font-mono text-white leading-none">
                  {crowdDensity > 5 ? 'SURGE' : crowdDensity > 2 ? 'MED' : 'STABLE'}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-sky-500/20 border border-sky-500/30 rounded text-[10px] text-sky-400 font-mono">
                  <div className="w-1.5 h-1.5 rounded-full pulse-blue animate-pulse" /> CV_LIVE_STREAM
                </span>
              </div>
              <button 
                onClick={stopCV}
                className="absolute bottom-4 right-4 text-[10px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded transition-all uppercase tracking-widest font-bold"
              >
                Stop Feed
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/20" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em]">Activate CV Engine</h4>
                <p className="text-[10px] text-white/40 max-w-[240px] mx-auto italic">
                  Neural network for real-time crowd movement analytics.
                </p>
              </div>
              <button 
                onClick={startCV}
                className="px-8 py-3 bg-sky-500 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full accent-ring hover:scale-105 transition-all"
              >
                Start Engine
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
