import React, { createContext, useContext, useRef, MutableRefObject, useState } from 'react';
import { CONFIG } from '../constants';
import * as THREE from 'three';

export interface WishData {
  id: number;
  text: string;
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3; // World target for flying comet
  localPos: THREE.Vector3; // Local tree target for landed decoration
  landed: boolean;
  handled: boolean; // Tracks if the landing has been registered permanently
  color: string;
}

export interface LandedWishData {
  id: number;
  text: string;
  pos: THREE.Vector3;
  timestamp: number;
  color: string;
}

export interface TreeData {
  burst: number; // 0.0 to 1.0
  starShine: number; // 0.0 to 1.0
}

interface WishControlState {
  wishesRef: MutableRefObject<WishData[]>;
  activeWishes: WishData[];
  treeDataRef: MutableRefObject<TreeData>;
  treeRotationRef: MutableRefObject<number>;
  permanentWishes: LandedWishData[];
  addWish: (text: string) => void;
  registerLanded: (pos: THREE.Vector3, text: string, id: number, color?: string) => void;
  removeActiveWish: (id: number) => void;
}

export const WishControlContext = createContext<WishControlState | null>(null);

export const WishControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wishesRef = useRef<WishData[]>([]);
  const [activeWishes, setActiveWishes] = useState<WishData[]>([]);
  const treeDataRef = useRef<TreeData>({ burst: 0, starShine: 0 });
  const treeRotationRef = useRef<number>(0);
  const [permanentWishes, setPermanentWishes] = useState<LandedWishData[]>([]);

  const addWish = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const H = CONFIG.dimensions.treeHeight; // 12
    const baseRadius = CONFIG.dimensions.treeRadius; // 4.5

    // Distribute randomly across the conical surface of the tree branches
    // Height: between 12% and 86% of the tree height
    const normalizedY = 0.12 + Math.random() * 0.74; 
    const yLocal = normalizedY * H;
    const coneRadius = baseRadius * (1.0 - normalizedY);
    // Sit naturally on the outer branch foliage
    const branchRadius = coneRadius * (0.75 + Math.random() * 0.3);

    const angle = Math.random() * Math.PI * 2;
    const localX = Math.cos(angle) * branchRadius;
    const localY = yLocal;
    const localZ = Math.sin(angle) * branchRadius;
    const localPos = new THREE.Vector3(localX, localY, localZ);

    // Calculate current world target position accounting for active tree rotation
    const currentRotY = treeRotationRef.current || 0;
    const cosR = Math.cos(currentRotY);
    const sinR = Math.sin(currentRotY);

    const worldX = localX * cosR - localZ * sinR;
    const worldY = localY - H / 2; // Tree base is at -H/2 in world coordinates
    const worldZ = localX * sinR + localZ * cosR;
    const endPos = new THREE.Vector3(worldX, worldY, worldZ);

    // Start position: in front of the camera in lower foreground
    const startPos = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      -3.5,
      8
    );

    const palette = ['#FFD700', '#FF69B4', '#FF85A2', '#FFB7C5', '#FFA07A', '#FCEADE'];
    const chosenColor = palette[Math.floor(Math.random() * palette.length)];

    const newWish: WishData = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      text: trimmed,
      startTime: Date.now() / 1000,
      duration: 2.6,
      startPos,
      endPos,
      localPos,
      landed: false,
      handled: false,
      color: chosenColor
    };

    wishesRef.current.push(newWish);
    if (wishesRef.current.length > 20) {
      wishesRef.current.shift();
    }
    setActiveWishes([...wishesRef.current]);
  };

  const registerLanded = (pos: THREE.Vector3, text: string, id: number, color?: string) => {
    const newLanded: LandedWishData = {
      id,
      text,
      pos,
      timestamp: Date.now(),
      color: color || '#FFD700'
    };

    setPermanentWishes(prev => {
      // Prevent duplicates if already registered
      if (prev.some(w => w.id === id)) return prev;
      return [...prev, newLanded];
    });
  };

  const removeActiveWish = (id: number) => {
    wishesRef.current = wishesRef.current.filter(w => w.id !== id);
    setActiveWishes([...wishesRef.current]);
  };

  return (
    <WishControlContext.Provider value={{ 
      wishesRef, 
      activeWishes, 
      treeDataRef, 
      treeRotationRef, 
      permanentWishes, 
      addWish, 
      registerLanded, 
      removeActiveWish 
    }}>
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