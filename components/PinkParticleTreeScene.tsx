import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useContextBridge } from '@react-three/drei';
import * as THREE from 'three';
import PinkTreeParticles from './PinkTreeParticles';
import SnowParticles from './SnowParticles';
import BaseRings from './BaseRings';
import TopDecoration from './TopDecoration';
import SceneEffects from './SceneEffects';
import WishSystem from './WishSystem';
import LandedWishes from './LandedWishes';
import SpiralHelix from './SpiralHelix';
import FloatingGifts from './FloatingGifts';
import { CONFIG } from '../constants';
import { HandControlContext, useHandControl } from '../context/HandControlContext';
import { WishControlContext } from '../context/WishControlContext';

const ScalableTreeGroup: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const { isUnleashed, isHandDetectedRef, cursorPositionRef } = useHandControl();

  useFrame((state) => {
    if (groupRef.current) {
      // 1. Hand Unleash Scale
      const targetScaleBase = isUnleashed ? 3.0 : 1.0;
      
      // 2. Breathing Animation (Sine wave ±5%)
      const time = state.clock.elapsedTime;
      const breathing = 1.0 + Math.sin(time * 1.5) * 0.05; // 0.95 to 1.05
      
      const targetScale = targetScaleBase * breathing;
      
      // Lerp scale
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.05;
      groupRef.current.scale.setScalar(newScale);

      // 3. Magnetic Rotation
      if (isHandDetectedRef.current) {
        let targetRotationY = (cursorPositionRef.current.x - 0.5) * Math.PI * 2;
        const currentRotationY = groupRef.current.rotation.y;
        
        // Handle wrapping (0 to 360 jump)
        const twoPi = Math.PI * 2;
        const cycle = Math.round((currentRotationY - targetRotationY) / twoPi);
        targetRotationY += cycle * twoPi;
        
        // Slower lerp for "Magnetic" inertia feel (0.02 instead of 0.05)
        groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.03;
      } else {
        // Auto rotate when idle
        groupRef.current.rotation.y += 0.005;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -CONFIG.dimensions.treeHeight / 2, 0]}>
      <PinkTreeParticles />
      <BaseRings />
    </group>
  );
};

const GL_CONFIG: any = { 
  antialias: false,
  alpha: false,
  stencil: false,
  depth: true,
  toneMapping: THREE.ReinhardToneMapping,
  toneMappingExposure: 1.5
};

const PinkParticleTreeScene: React.FC = () => {
  const ContextBridge = useContextBridge(HandControlContext, WishControlContext);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={GL_CONFIG}
      camera={{ position: [0, 4, 18], fov: 45 }}
    >
      <ContextBridge>
        <color attach="background" args={[CONFIG.colors.background]} />
        
        <PerspectiveCamera makeDefault position={[0, 4, 18]} />
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          zoomSpeed={1.5}
          enableDamping={true}
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={5}
          maxDistance={50}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />

        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ff00" />
        <pointLight position={[-10, 5, -10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
          <ScalableTreeGroup />
          <group position={[0, -CONFIG.dimensions.treeHeight / 2, 0]}>
             <TopDecoration />
          </group>
          <SpiralHelix />
          <FloatingGifts />
          <SnowParticles />
          <WishSystem />
          <LandedWishes />
          <SceneEffects />
        </Suspense>
      </ContextBridge>
    </Canvas>
  );
};

export default React.memo(PinkParticleTreeScene);