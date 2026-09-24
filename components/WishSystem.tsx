import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWishControl } from '../context/WishControlContext';
import { CONFIG } from '../constants';

const MAX_WISHES = 20;
const BURST_COUNT = 100;
const TRAIL_LENGTH = 120; 
const CLUSTER_COUNT = 50; 

const WishSystem: React.FC = () => {
  const { wishesRef, activeWishes, treeDataRef, registerLanded, removeActiveWish } = useWishControl();
  
  const poolRefs = useRef<(THREE.Group | null)[]>([]);
  const burstRefs = useRef<(THREE.Points | null)[]>([]);
  const trailRefs = useRef<(THREE.Points | null)[]>([]);
  
  const clusterGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CLUSTER_COUNT * 3);
    const sizes = new Float32Array(CLUSTER_COUNT);
    const randoms = new Float32Array(CLUSTER_COUNT);

    for (let i = 0; i < CLUSTER_COUNT; i++) {
        // COMPACT: Reduce radius from 0.4 to 0.15 for a denser ball
        const r = Math.pow(Math.random(), 0.5) * 0.15; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        // BIGGER: Increase size from 0.01-0.04 to 0.06-0.14
        sizes[i] = 0.06 + Math.random() * 0.08;
        
        randoms[i] = Math.random() * 10.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    return geo;
  }, []);
  
  const flyingShaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
        uColor: { value: new THREE.Color('#FF69B4') }, 
        uTime: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      attribute float aRandom;
      varying float vRandom;
      
      void main() {
        vRandom = aRandom;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Scale size by depth
        gl_PointSize = aSize * (1500.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying float vRandom;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) discard;
        
        float strength = 1.0 - (length(coord) * 2.0);
        strength = pow(strength, 1.5);
        
        float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + vRandom);
        
        gl_FragColor = vec4(uColor, strength * twinkle);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }), []);
  
  const trailMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(CONFIG.colors.wishGlow) }
    },
    vertexShader: `
      attribute float scale;
      varying float vAlpha;
      void main() {
        vAlpha = scale; 
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = scale * 150.0 * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 1.5);
        gl_FragColor = vec4(color, glow * vAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  const burstData = useMemo(() => {
    const data = [];
    for (let i = 0; i < MAX_WISHES; i++) {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(BURST_COUNT * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const vels = new Float32Array(BURST_COUNT * 3);
        for(let j=0; j<BURST_COUNT; j++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 2.0 + Math.random() * 4.0;
            
            vels[j*3] = Math.sin(phi) * Math.cos(theta) * speed;
            vels[j*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
            vels[j*3+2] = Math.cos(phi) * speed;
        }
        data.push({ geo, vels });
    }
    return data;
  }, []);

  const trailData = useMemo(() => {
    const data = [];
    for (let i = 0; i < MAX_WISHES; i++) {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(TRAIL_LENGTH * 3);
        const scales = new Float32Array(TRAIL_LENGTH);
        const lifes = new Float32Array(TRAIL_LENGTH); 
        
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        data.push({ geo, lifes, cursor: 0 });
    }
    return data;
  }, []);

  useFrame((state) => {
    const now = Date.now() / 1000;
    const activeWishes = wishesRef.current;
    
    flyingShaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    activeWishes.forEach((wish, index) => {
      const group = poolRefs.current[index];
      const burstPoints = burstRefs.current[index];
      const trailPoints = trailRefs.current[index];
      const tData = trailData[index];
      
      if (!group || !burstPoints || !trailPoints) return;

      const elapsed = now - wish.startTime;
      const progress = Math.min(elapsed / wish.duration, 1.0);
      
      if (progress < 1.0) {
        group.visible = true;
        
        // Bezier Curves
        const p0 = wish.startPos;
        const p3 = wish.endPos;
        const seed = wish.id * 0.123; 
        const sideDir = Math.sin(seed) > 0 ? 1 : -1;
        const sideMag = 5 + (Math.abs(Math.sin(seed * 2)) * 5); 
        
        const p1x = p0.x + (sideDir * sideMag);
        const p1y = p0.y + (p3.y - p0.y) * 0.3; 
        const p1z = p0.z + 8; 

        const p2x = p3.x + (sideDir * sideMag * 0.3); 
        const p2y = p0.y + (p3.y - p0.y) * 0.8; 
        const p2z = p3.z + 2; 

        const t = progress;
        const k = 1 - t;
        const a = k * k * k;         
        const b = 3 * k * k * t;     
        const c = 3 * k * t * t;     
        const d = t * t * t;         

        group.position.x = a * p0.x + b * p1x + c * p2x + d * p3.x;
        group.position.y = a * p0.y + b * p1y + c * p2y + d * p3.y;
        group.position.z = a * p0.z + b * p1z + c * p2z + d * p3.z;

        const clusterPoints = group.children[0] as THREE.Points;
        const light = group.children[1] as THREE.PointLight;
        
        clusterPoints.visible = true;
        
        light.color.set('#FF69B4');
        light.intensity = 2;
        group.scale.setScalar(1.0);
        
        burstPoints.visible = false;

        const cursor = tData.cursor;
        const posAttr = tData.geo.attributes.position.array as Float32Array;
        
        const jitter = 0.1;
        posAttr[cursor * 3] = group.position.x + (Math.random() - 0.5) * jitter;
        posAttr[cursor * 3 + 1] = group.position.y + (Math.random() - 0.5) * jitter;
        posAttr[cursor * 3 + 2] = group.position.z + (Math.random() - 0.5) * jitter;
        
        tData.lifes[cursor] = 1.0; 
        tData.cursor = (cursor + 1) % TRAIL_LENGTH;
        
      } else {
        // Landed
        group.visible = true;
        group.position.copy(wish.endPos);
        
        if (!wish.landed) {
          wish.landed = true;
          // Trigger the golden star shine without bursting tree body particles
          treeDataRef.current.starShine = 1.0;
        }

        // --- PERSISTENCE LOGIC ---
        // If not yet handled, register it as permanent star on the tree branch
        if (!wish.handled) {
          const targetPos = wish.localPos ? wish.localPos.clone() : wish.endPos.clone();
          registerLanded(targetPos, wish.text, wish.id, wish.color);
          wish.handled = true;
        }

        // Hide the flying cluster
        const clusterPoints = group.children[0] as THREE.Points;
        clusterPoints.visible = false;

        // NOTE: We do NOT show a landed mesh here anymore.
        // The LandedWishes component handles the permanent star.
        
        const light = group.children[1] as THREE.PointLight;
        light.color.set(CONFIG.colors.wishLanded);
        light.intensity = 0.5;
        
        // Fade out light quickly
        const timeSinceLand = elapsed - wish.duration;
        light.intensity = Math.max(0, 2.0 - timeSinceLand * 2.0);

        // Burst Logic
        const explosionDuration = 1.0;

        if (timeSinceLand < explosionDuration) {
             burstPoints.visible = true;
             const positions = burstPoints.geometry.attributes.position.array as Float32Array;
             const vels = burstData[index].vels;
             
             for(let k=0; k<BURST_COUNT; k++) {
                 positions[k*3] = vels[k*3] * timeSinceLand;
                 positions[k*3+1] = vels[k*3+1] * timeSinceLand;
                 positions[k*3+2] = vels[k*3+2] * timeSinceLand;
             }
             burstPoints.geometry.attributes.position.needsUpdate = true;
             
             const opacity = 1.0 - (timeSinceLand / explosionDuration);
             (burstPoints.material as THREE.PointsMaterial).opacity = Math.max(0, opacity);
        } else {
             burstPoints.visible = false;
             // Hide flying group once landed burst finishes
             group.visible = false;
             removeActiveWish(wish.id);
        }
      }

      trailPoints.visible = true;
      const scaleAttr = tData.geo.attributes.scale.array as Float32Array;
      let hasVisibleTrail = false;
      
      for(let k=0; k<TRAIL_LENGTH; k++) {
          if (tData.lifes[k] > 0) {
              tData.lifes[k] -= 0.034; 
              scaleAttr[k] = Math.max(0, tData.lifes[k] * 0.8); 
              hasVisibleTrail = true;
          } else {
              scaleAttr[k] = 0;
          }
      }
      
      if (!hasVisibleTrail && progress >= 1.0) {
          trailPoints.visible = false;
      }
      
      tData.geo.attributes.position.needsUpdate = true;
      tData.geo.attributes.scale.needsUpdate = true;
    });

    for (let i = activeWishes.length; i < MAX_WISHES; i++) {
      const group = poolRefs.current[i];
      if (group) group.visible = false;
      const trail = trailRefs.current[i];
      if (trail) trail.visible = false;
    }
  });

  return (
    <>
      {Array.from({ length: MAX_WISHES }).map((_, i) => {
        const activeWish = activeWishes[i];
        return (
          <React.Fragment key={i}>
            <group ref={(el) => { poolRefs.current[i] = el; }} visible={false}>
              <points 
                geometry={clusterGeometry}
                material={flyingShaderMaterial}
              />
              <pointLight distance={4} decay={2} intensity={2} color="#FF69B4" />
              <points 
                ref={(el) => { burstRefs.current[i] = el as unknown as THREE.Points; }}
                geometry={burstData[i].geo}
                visible={false}
              >
                 <pointsMaterial 
                    size={0.15} 
                    color={CONFIG.colors.heart}
                    transparent 
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                 />
              </points>

              {/* Floating 3D text badge following the active wish in flight */}
              {activeWish && (
                <Html
                  position={[0, 0.45, 0]}
                  center
                  distanceFactor={13}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-pink-400/60 shadow-[0_0_20px_rgba(255,105,180,0.8)] text-pink-50 text-xs font-mono whitespace-nowrap animate-pulse">
                    <span className="text-amber-300">✨</span>
                    <span className="font-semibold tracking-wide">{activeWish.text}</span>
                  </div>
                </Html>
              )}
            </group>
            <points
                ref={(el) => { trailRefs.current[i] = el as unknown as THREE.Points; }}
                geometry={trailData[i].geo}
                material={trailMaterial}
                frustumCulled={false} 
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default WishSystem;