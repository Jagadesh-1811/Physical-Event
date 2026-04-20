/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { LayoutDashboard, Map as MapIcon, Shield, Menu, Bell, Signal, Search, AlertTriangle } from 'lucide-react';
import { StadiumMap } from './components/Map';
import { LiveMap } from './components/LiveMap';
import { VenueStats } from './components/Stats';
import { IntelligencePanel } from './components/Intelligence';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface VenueMetadata {
  name: string;
  id: string;
  coords: { lat: number; lng: number };
  capacity: number;
  gates: string[];
  weather: string;
  currentStage: string;
}

interface VenueState {
  crowdDensity: number[];
  waitTimes: {
    foodA: number;
    foodB: number;
    restroom1: number;
    restroom2: number;
  };
  alerts: string[];
  metadata: VenueMetadata;
}

export default function App() {
  const [state, setState] = useState<VenueState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [criticalSector, setCriticalSector] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'osm' | 'topo'>('osm');

  useEffect(() => {
    const socket = io();

    // Initial fetch fallback in case socket missed first emit
    const fetchInitialState = async () => {
      try {
        const res = await axios.get('/api/venue/active');
        if (res.data && !state) {
          setState(res.data);
        }
      } catch (err) {
        console.error("Pulse Link Failed - Retrying...", err);
      }
    };

    fetchInitialState();

    socket.on('connect', () => setIsConnected(true));
    socket.on('venue-update', (updatedState: VenueState) => {
      setState(updatedState);
      
      const criticalIdx = updatedState.crowdDensity.findIndex(d => d > 0.85);
      setCriticalSector(criticalIdx !== -1 ? criticalIdx : null);
    });

    socket.on('disconnect', () => setIsConnected(false));

    // Polling as last resort
    const polling = setInterval(fetchInitialState, 15000);

    return () => {
      socket.disconnect();
      clearInterval(polling);
    };
  }, []);

    const syncLocationWithGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.post('/api/venue/switch', {
            lat: latitude,
            lng: longitude
          });
          if (res.data.status === 'switched') {
            // Updated metadata will arrive via Socket.IO
            console.log("Calibration successful. Switched to:", res.data.venue.name);
          }
        } catch (err) {
          console.error("No real stadium identified within 20km search radius.");
          alert("No sports venues identified near your current location via OpenStreetMap. Please try again from a sports-active zone.");
        }
      }, (err) => {
        console.error("GPS access denied");
        alert("Please enable GPS permissions to sync with local venues.");
      });
    }
  };

  if (!state) return (
    <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      <div className="text-sky-400 font-mono text-sm tracking-[0.3em] animate-pulse uppercase">Initializing Core Feed...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Live Ticker */}
      <div className="ticker-wrap h-8 flex items-center">
        <div className="ticker text-[10px] uppercase font-mono tracking-widest text-sky-400/80">
          <span className="mx-8 font-bold text-white">[ SYSTEM BROADCAST ]</span>
          <span className="mx-8">VENUE: {state.metadata.name}</span>
          <span className="mx-8">Current Capacity: {state.metadata.capacity} attendees</span>
          <span className="mx-8">Weather: {state.metadata.weather} (Live Data)</span>
          <span className="mx-8 text-orange-400">!! Movement Pattern Detected: {state.metadata.currentStage} !!</span>
          <span className="mx-8">CV Engine Engine Version 4.2.0.8-Alpha Status: Operational</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <AnimatePresence>
          {criticalSector !== null && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-orange-500/20 border border-orange-500/50 p-4 rounded-xl flex items-center justify-between glow-border border-l-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500 rounded-lg animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">High Density Alert: Sector {criticalSector + 1}</h3>
                    <p className="text-[10px] text-white/60">Automated rerouting protocols active. Recommending exit via {state.metadata.gates[criticalSector % state.metadata.gates.length]}.</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-orange-400/60 uppercase">Action: Reroute</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-xl accent-ring">
              S
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white uppercase">{state.metadata.name} Live Hub</h1>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-sky-400" : "bg-red-500")} />
                <p className="text-xs text-sky-400 font-mono tracking-wider uppercase">
                  {isConnected ? 'NODE_SECURE // VENUE_SYNC_ACTIVE' : 'OFFLINE // RECONNECTING'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass px-6 py-2 hidden md:flex items-center space-x-8">
            <button 
              onClick={syncLocationWithGPS}
              className="group flex flex-col items-center hover:scale-105 transition-transform"
            >
              <p className="text-[10px] uppercase opacity-50 tracking-widest mb-0.5 group-hover:text-sky-400">Sync Location</p>
              <p className="text-sm font-bold flex items-center gap-1"><Signal className="w-3 h-3 text-sky-400" /> GPS</p>
            </button>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase opacity-50 tracking-widest mb-0.5">CV Backend</p>
              <p className="text-sm font-bold text-sky-400">READY</p>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase opacity-50 tracking-widest mb-0.5">Alerts</p>
              <p className="text-sm font-bold text-orange-400">{criticalSector !== null ? '01' : '00'}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] uppercase opacity-50 tracking-widest mb-0.5">Weather</p>
              <p className="text-sm font-bold uppercase text-sky-400 truncate max-w-[120px]">{state.metadata.weather.split('/')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-white/40 hover:text-sky-400 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button className="p-2 text-white/40 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {criticalSector !== null && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#1e1b4b]" />}
              </button>
            </div>
            <button className="p-2 glass hover:bg-white/5 transition-all text-white/80">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] mx-auto w-full">
          {/* Left Column: Visual Analytics */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex-1 glass relative overflow-hidden border-sky-500/20 group min-h-[400px]">
              <div className="absolute inset-0 grid-lines pointer-events-none opacity-50"></div>
              
              <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full pulse-blue"></span>
                    <span className="text-[10px] font-mono uppercase tracking-tighter text-sky-400">
                      {viewMode === 'osm' ? 'Satellite // OpenStreetMap Feed' : 'Interior // Venue Topography'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewMode('osm')}
                      className={cn("px-2 py-1 text-[9px] rounded font-bold uppercase transition-all", viewMode === 'osm' ? "bg-sky-500 text-white" : "bg-white/5 text-white/40")}
                    >OSM</button>
                    <button 
                      onClick={() => setViewMode('topo')}
                      className={cn("px-2 py-1 text-[9px] rounded font-bold uppercase transition-all", viewMode === 'topo' ? "bg-sky-500 text-white" : "bg-white/5 text-white/40")}
                    >Topo</button>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center min-h-[350px]">
                  {viewMode === 'osm' ? (
                    <LiveMap center={state.metadata.coords} density={state.crowdDensity} venueName={state.metadata.name} />
                  ) : (
                    <StadiumMap density={state.crowdDensity} />
                  )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <StatBlock label="Session State" value={state.metadata.currentStage} color="text-sky-400" sub="PATTERN_LOCK" />
                  <StatBlock label="Coordinates" value={`${state.metadata.coords.lat.toFixed(2)}, ${state.metadata.coords.lng.toFixed(2)}`} sub="GEO_SYNC" />
                  <StatBlock label="Capacity" value={state.metadata.capacity.toLocaleString()} sub="VERIFIED" />
                  <StatBlock label="Weather Source" value="Open-Meteo" sub="LIVE_STREAM" />
                </div>
              </div>
            </div>

            <VenueStats waitTimes={state.waitTimes} />
          </section>

          {/* Right Column: Intelligence & Logic */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <IntelligencePanel />
            
            <div className="glass p-5 border-l-2 border-l-sky-500">
              <div className="flex items-center gap-3 mb-3">
                <Signal className="w-4 h-4 text-sky-400" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/80">Venue Information</h4>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] opacity-40 uppercase tracking-widest">Entry Points</span>
                  <div className="flex flex-wrap gap-2">
                    {state.metadata.gates.map((g, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-sky-400/80">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/60 italic px-1">
                  "Currently monitoring {state.metadata.name}. Use the 'Sync Location' feature to calibrate system to your specific venue coordinates."
                </p>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 flex justify-between items-center text-[10px] font-mono text-sky-400/60 uppercase tracking-widest">
          <div className="flex space-x-6">
            <span>LOCATION_AWARE: TRUE</span>
            <span>DATA_VERSION: 1.2.0</span>
            <span>ENVIRONMENT: {state.metadata.weather.split('/')[1]}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            <span className="text-white">ENCRYPTED DATA LINK ACTIVE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, color }: { label: string; value: string; sub: string, color?: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-lg flex flex-col gap-0.5 border border-white/5 group hover:bg-white/10 transition-colors">
      <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
      <span className={cn("text-lg font-mono font-bold", color || "text-white")}>{value}</span>
      <span className="text-[8px] font-mono text-white/20">{sub}</span>
    </div>
  );
}
