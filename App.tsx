import React, { useState } from 'react';
import PinkParticleTreeScene from './components/PinkParticleTreeScene';
import { HandControlProvider } from './context/HandControlContext';
import { WishControlProvider, useWishControl } from './context/WishControlContext';
import HandTracker from './components/HandTracker';

const WishInput: React.FC = () => {
  const { addWish } = useWishControl();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addWish(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pointer-events-auto flex items-end justify-center w-full px-4">
      <div className="relative group flex items-center max-w-lg w-full">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your wish here..."
          className="bg-black/40 backdrop-blur-xl text-pink-50 px-6 py-4 rounded-l-lg outline-none w-full font-mono text-sm placeholder-pink-400/30 transition-all duration-300 focus:bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/5 border-r-0"
          style={{ fontFamily: "'Space Mono', monospace" }}
        />
        <button 
          type="submit"
          className="px-8 py-4 bg-pink-500/10 backdrop-blur-xl text-pink-200 rounded-r-lg hover:bg-pink-500/30 transition-all duration-300 border border-white/5 border-l-0 hover:shadow-[0_0_15px_rgba(255,105,180,0.3)]"
        >
          <span className="font-mono text-xs uppercase tracking-widest font-bold">Send</span>
        </button>
        
        {/* Animated Underline */}
        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-pink-500 to-transparent transition-all duration-700 group-hover:w-full"></div>
      </div>
    </form>
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
            
            {/* Footer / Input */}
            <footer className="w-full pb-12 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pt-20">
              {started && <WishInput />}
              
              <p className="text-sm text-pink-100/80 tracking-widest uppercase mt-4 font-bold drop-shadow-md">
                Open Hand to Expand • Make a Wish to Light the Tree
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