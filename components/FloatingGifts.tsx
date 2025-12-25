import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const FloatingGifts: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 8;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate random properties for each gift
  const instances = useMemo(() => {
    const pastelColors = [
      '#FFD700', // Gold
      '#FFB7C5', // Pink
      '#ADD8E6', // Light Blue
      '#E6E6FA', // Lavender
      '#98FB98', // Pale Green
    ];

    return Array.from({ length: count }).map((_, i) => ({
      angleOffset: (i / count) * Math.PI * 2, // Evenly spaced
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 1.5 + Math.random(),
      rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      rotationSpeed: 0.5 + Math.random() * 1.0,
      color: new THREE.Color(pastelColors[Math.floor(Math.random() * pastelColors.length)])
    }));
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    // Set initial colors
    instances.forEach((data, i) => {
      meshRef.current!.setColorAt(i, data.color);
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [instances]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const baseRadius = CONFIG.dimensions.treeRadius + 1.2; // Slightly wider than base
    const bottomY = -CONFIG.dimensions.treeHeight / 2 + 0.8; // Floating near bottom

    instances.forEach((data, i) => {
      // 1. Orbit Calculation
      const currentAngle = data.angleOffset + time * 0.2; // Slow orbit speed
      const x = Math.cos(currentAngle) * baseRadius;
      const z = Math.sin(currentAngle) * baseRadius;

      // 2. Bobbing Calculation
      const y = bottomY + Math.sin(time * data.bobSpeed + data.bobOffset) * 0.25;

      dummy.position.set(x, y, z);

      // 3. Tumble/Spin Calculation
      // Rotate around its own random axis
      dummy.rotation.set(
        time * data.rotationSpeed * data.rotationAxis.x,
        time * data.rotationSpeed * data.rotationAxis.y,
        time * data.rotationSpeed * data.rotationAxis.z
      );
      
      dummy.scale.setScalar(1.0);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial 
        roughness={0.2} 
        metalness={0.6}
        emissive="#333333"
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};

export default FloatingGifts;