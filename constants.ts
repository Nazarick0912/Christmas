export const CONFIG = {
  colors: {
    background: '#000000', // Solid Black
    treeCore: '#ffffff',   // White core for sparkle
    treeOuter: '#004d00',  // Deep Emerald Green halo
    treeEdge: '#002200',   // Darker edge
    ring: '#ffffff',       // Silver/White rings
    heart: '#FFD700',      // Golden Star
    snow: '#ffffff',
    wishCore: '#FF69B4',   // Warm Pink Core
    wishGlow: '#FF7F50',   // Coral Highlights
    wishLanded: '#FFD700', // Radiant Gold Star Ornament
  },
  counts: {
    treeParticles: 30000,
    snowParticles: 1500,
    ringParticles: 800,
    heartParticles: 2000,
    wishParticlesPerGroup: 500, // 500 tiny dots per wish as requested
  },
  dimensions: {
    treeHeight: 12,
    treeRadius: 4.5, 
    ringRadiusBase: 6,
  },
  bloom: {
    luminanceThreshold: 0.1,
    luminanceSmoothing: 0.9,
  }
};