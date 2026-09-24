import React, { useLayoutEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useWishControl, LandedWishData } from '../context/WishControlContext';
import { CONFIG } from '../constants';

const FloatingWishBadge: React.FC<{ 
  wish: LandedWishData; 
  index: number; 
  total: number;
}> = ({ wish, index, total }) => {
  const [hovered, setHovered] = useState(false);
  // Auto-expand the latest 5 wishes, or when hovered
  const isRecent = index >= Math.max(0, total - 5);
  const isExpanded = isRecent || hovered;
  const bobDelay = (wish.id % 1000) / 500;

  return (
    <Html
      position={[wish.pos.x, wish.pos.y + 0.35, wish.pos.z]}
      center
      distanceFactor={13}
      zIndexRange={[60, 0]}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        transition: 'all 0.3s ease-out'
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group cursor-pointer select-none transition-transform duration-300 hover:scale-110 active:scale-95"
        style={{
          animation: 'wishBob 3s ease-in-out infinite alternate',
          animationDelay: `${bobDelay}s`
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-300 border"
          style={{
            backgroundColor: 'rgba(12, 4, 16, 0.78)',
            borderColor: wish.color || CONFIG.colors.wishLanded,
            boxShadow: `0 0 ${isExpanded ? '18px' : '8px'} ${wish.color ? wish.color + '88' : 'rgba(255,215,0,0.5)'}`
          }}
        >
          <span 
            className="text-xs transition-transform duration-300 group-hover:scale-125"
            style={{ color: wish.color || CONFIG.colors.wishLanded }}
          >
            ★
          </span>
          {isExpanded ? (
            <span className="text-xs font-mono font-medium tracking-wide text-pink-50 whitespace-nowrap drop-shadow-md">
              {wish.text}
            </span>
          ) : (
            <span className="text-[10px] font-mono tracking-widest uppercase text-pink-200/80 group-hover:text-pink-50">
              Wish #{index + 1}
            </span>
          )}
        </div>
      </div>
    </Html>
  );
};

const LandedWishes: React.FC = () => {
  const { permanentWishes } = useWishControl();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: CONFIG.colors.wishLanded,
    emissive: CONFIG.colors.wishLanded,
    emissiveIntensity: 4,
    roughness: 0.1,
    metalness: 0.8,
    toneMapped: false
  }), []);

  // Multi-faceted crystal octahedron geometry for ornaments
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.14, 0), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const count = permanentWishes.length;
    meshRef.current.count = count;
    
    if (count === 0) return;

    // Update matrices and instance colors
    const tempColor = new THREE.Color();
    for (let i = 0; i < count; i++) {
        const wish = permanentWishes[i];
        dummy.position.copy(wish.pos);
        dummy.scale.setScalar(1.0);
        dummy.rotation.set(0.4, (wish.id % 360) * (Math.PI / 180), 0.2);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        tempColor.set(wish.color || CONFIG.colors.wishLanded);
        meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [permanentWishes, dummy]);

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[geometry, material, 500]}
        frustumCulled={false}
      />
      {/* 3D Floating text badges for each wish on the tree branches */}
      {permanentWishes.map((wish, index) => (
        <FloatingWishBadge
          key={wish.id}
          wish={wish}
          index={index}
          total={permanentWishes.length}
        />
      ))}
    </group>
  );
};

export default LandedWishes;