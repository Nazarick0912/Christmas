import React, { useState } from 'react';
import PinkParticleTreeScene from './components/PinkParticleTreeScene';
import { HandControlProvider, useHandControl } from './context/HandControlContext';
import { WishControlProvider, useWishControl } from './context/WishControlContext';
import HandTracker from './components/HandTracker';

const ExpandEnergyButton: React.FC = () => {
  const { isUnleashed, triggerUnleash } = useHandControl();

  return (
    <button
      onMouseDown={() => triggerUnleash(true)}
      onMouseUp={() => triggerUnleash(false)}
      onMouseLeave={() => triggerUnleash(false)}
      onTouchStart={() => triggerUnleash(true)}
      onTouchEnd={() => triggerUnleash(false)}
      className={`pointer-events-auto px-5 py-2 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 flex items-center gap-2 select-none cursor-pointer ${
        isUnleashed
          ? 'bg-gradient-to-r from-pink-500/40 via-amber-500/40 to-pink-500/40 border-pink-400 text-pink-50 shadow-[0_0_25px_rgba(255,105,180,0.6)] scale-105'
          : 'bg-black/50 backdrop-blur-md border-pink-500/30 text-pink-200/80 hover:text-pink-100 hover:border-pink-400/60 hover:shadow-[0_0_15px_rgba(255,105,180,0.3)]'
      }`}
      title="Hold this button or press Spacebar to expand the tree energy!"
    >
      <span className={isUnleashed ? 'animate-spin' : ''}>⚡</span>
      <span>{isUnleashed ? 'ENERGY UNLEASHED' : 'Hold to Expand (or Spacebar)'}</span>
    </button>
  );
};

const WishInput: React.FC = () => {
  const { addWish, permanentWishes } = useWishControl();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addWish(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col items-center w-full px-4 gap-2">
      <form onSubmit={handleSubmit} className="pointer-events-auto flex items-end justify-center w-full max-w-lg">
        <div className="relative group flex items-center w-full">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your holiday wish..."
            maxLength={60}
            className="bg-black/50 backdrop-blur-xl text-pink-50 px-6 py-4 rounded-l-lg outline-none w-full font-mono text-sm placeholder-pink-400/40 transition-all duration-300 focus:bg-black/70 shadow-[0_0_20px_rgba(0,0,0,0.6)] border border-pink-500/20 border-r-0 focus:border-pink-500/50"
            style={{ fontFamily: "'Space Mono', monospace" }}
          />
          <button 
            type="submit"
            className="px-8 py-4 bg-pink-500/20 backdrop-blur-xl text-pink-100 rounded-r-lg hover:bg-pink-500/40 transition-all duration-300 border border-pink-500/20 border-l-0 hover:shadow-[0_0_20px_rgba(255,105,180,0.5)] active:scale-95 flex items-center gap-1.5"
          >
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Send</span>
            <span>✨</span>
          </button>
          
          {/* Animated Underline */}
          <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-pink-400 to-amber-300 transition-all duration-700 group-hover:w-full"></div>
        </div>
      </form>
      {permanentWishes.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-mono text-pink-200/80 tracking-wider">
          <span className="text-amber-300">★</span>
          <span>{permanentWishes.length} {permanentWishes.length === 1 ? 'wish' : 'wishes'} glowing on the branches</span>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [started, setStarted] = useState(false);

  return (
    <HandControlProvider>
      <WishControlProvider>
        <div className="relative w-full h-full bg-[#050205] overflow-hidden font-mono">
          
          {started && <HandTracker />}

          {/* Overlay UI */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between">
            
            {/* Header */}
            <header className="p-8 md:p-12 text-center md:text-left">
              <h1 
                className="text-4xl md:text-6xl font-normal tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-pink-100 via-pink-200 to-amber-100 drop-shadow-[0_0_20px_rgba(255,100,150,0.4)]"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                Merry Christmas
              </h1>
              <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
                 <div className="h-[1px] w-12 bg-pink-500/50"></div>
                 <p className="text-pink-200/50 text-xs tracking-[0.3em] uppercase font-mono">
                  Crystal Energy Edition
                 </p>
              </div>
            </header>
            
            {/* Footer / Controls / Input */}
            <footer className="w-full pb-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16">
              {started && (
                <>
                  <ExpandEnergyButton />
                  <WishInput />
                </>
              )}
              
              <p className="text-xs md:text-sm text-pink-100/70 tracking-widest uppercase mt-2 font-mono drop-shadow-md text-center px-4">
                Open Hand or Hold Spacebar to Expand • Drag to Orbit • Send a Wish
              </p>
            </footer>
          </div>

          {/* 3D Scene */}
          <div className="absolute inset-0 z-0">
            <PinkParticleTreeScene />
          </div>

          {/* Start Button Overlay */}
          {!started && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-1000 gap-8"
                 style={{ opacity: started ? 0 : 1, pointerEvents: started ? 'none' : 'auto' }}>
               
               <div className="text-center space-y-2">
                 <p className="text-pink-300/60 text-xs tracking-[0.5em] uppercase animate-pulse">Initialize Experience</p>
               </div>

               <button 
                 onClick={() => setStarted(true)}
                 className="group relative px-12 py-5 border border-pink-500/60 text-pink-100 transition-all duration-500 hover:border-pink-400 hover:shadow-[0_0_40px_rgba(255,0,100,0.3)] bg-black/50 overflow-hidden"
               >
                 <div className="absolute inset-0 w-full h-full bg-pink-500/10 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
                 <span className="relative text-sm tracking-[0.3em]">ENTER</span>
               </button>
            </div>
          )}
        </div>
      </WishControlProvider>
    </HandControlProvider>
  );
};

export default App;