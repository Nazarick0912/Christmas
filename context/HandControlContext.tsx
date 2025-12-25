import React, { createContext, useContext, useState, useRef, MutableRefObject } from 'react';

interface HandControlState {
  isUnleashed: boolean;
  isHandDetectedRef: MutableRefObject<boolean>;
  cursorPositionRef: MutableRefObject<{ x: number; y: number }>;
  setHandState: (unleashed: boolean) => void;
}

export const HandControlContext = createContext<HandControlState | null>(null);

export const HandControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnleashed, setIsUnleashed] = useState(false);
  
  // Refs for high-frequency data to prevent re-renders
  const isHandDetectedRef = useRef(false);
  const cursorPositionRef = useRef({ x: 0.5, y: 0.5 });

  const setHandState = (unleashed: boolean) => {
    // Only update state if changed
    setIsUnleashed(prev => {
        if (prev !== unleashed) return unleashed;
        return prev;
    });
  };

  return (
    <HandControlContext.Provider value={{ 
      isUnleashed, 
      setHandState,
      isHandDetectedRef,
      cursorPositionRef
    }}>
      {children}
    </HandControlContext.Provider>
  );
};

export const useHandControl = () => {
  const context = useContext(HandControlContext);
  if (!context) {
    throw new Error('useHandControl must be used within a HandControlProvider');
  }
  return context;
};