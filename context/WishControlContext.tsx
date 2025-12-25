import React, { createContext, useContext, useRef, MutableRefObject, useState } from 'react';
import { CONFIG } from '../constants';
import * as THREE from 'three';

export interface WishData {
  id: number;
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  landed: boolean;
  handled: boolean; // Tracks if the landing has been registered permanently
}

export interface TreeData {
  burst: number; // 0.0 to 1.0
}

interface WishControlState {
  wishesRef: MutableRefObject<WishData[]>;
  treeDataRef: MutableRefObject<TreeData>;
  permanentWishes: THREE.Vector3[];
  addWish: (text: string) => void;
  registerLanded: (pos: THREE.Vector3) => void;
}

export const WishControlContext = createContext<WishControlState | null>(null);

export const WishControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wishesRef = useRef<WishData[]>([]);
  const treeDataRef = useRef<TreeData>({ burst: 0 });
  const [permanentWishes, setPermanentWishes] = useState<THREE.Vector3[]>([]);

  const addWish = (text: string) => {
    // Sound effect removed as requested

    const H = CONFIG.dimensions.treeHeight;
    const startPos = new THREE.Vector3(0, -5, 5);
    const endPos = new THREE.Vector3(0, H / 2, 0);

    const newWish: WishData = {
      id: Date.now(),
      startTime: Date.now() / 1000,
      duration: 2.5,
      startPos,
      endPos,
      landed: false,
      handled: false
    };

    wishesRef.current.push(newWish);
    
    if (wishesRef.current.length > 20) {
        wishesRef.current.shift();
    }
  };

  const registerLanded = (pos: THREE.Vector3) => {
    setPermanentWishes(prev => [...prev, pos]);
  };

  return (
    <WishControlContext.Provider value={{ wishesRef, treeDataRef, permanentWishes, addWish, registerLanded }}>
      {children}
    </WishControlContext.Provider>
  );
};

export const useWishControl = () => {
  const context = useContext(WishControlContext);
  if (!context) {
    throw new Error('useWishControl must be used within a WishControlProvider');
  }
  return context;
};