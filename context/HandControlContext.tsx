import React, { createContext, useContext, useState, useRef, MutableRefObject } from 'react';

interface HandControlState {
  isUnleashed: boolean;
  isHandDetectedRef: MutableRefObject<boolean>;
  cursorPositionRef: MutableRefObject<{ x: number; y: number }>;
  cameraEnabled: boolean;
  setHandState: (unleashed: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  triggerUnleash: (unleashed: boolean) => void;
}

export const HandControlContext = createContext<HandControlState | null>(null);

export const HandControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnleashed, setIsUnleashed] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Refs for high-frequency data to prevent re-renders
  const isHandDetectedRef = useRef(false);
  const cursorPositionRef = useRef({ x: 0.5, y: 0.5 });
  const isHoldingKeyRef = useRef(false);

  const setHandState = (unleashed: boolean) => {
    // If keyboard or mouse button is holding unleashed, keep it unleashed
    if (isHoldingKeyRef.current) return;
    setIsUnleashed(prev => (prev !== unleashed ? unleashed : prev));
  };

  const triggerUnleash = (unleashed: boolean) => {
    isHoldingKeyRef.current = unleashed;
    setIsUnleashed(unleashed);
  };

  // Keyboard and Mouse Event Fallbacks
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        isHoldingKeyRef.current = true;
        setIsUnleashed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isHoldingKeyRef.current = false;
        // Revert to hand detection state if active, or false
        setIsUnleashed(false);
      }
    };

    // Mouse movement fallback for magnetic rotation when no hand is detected
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHandDetectedRef.current) {
        cursorPositionRef.current = {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <HandControlContext.Provider value={{ 
      isUnleashed, 
      setHandState,
      isHandDetectedRef,
      cursorPositionRef,
      cameraEnabled,
      setCameraEnabled,
      triggerUnleash
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