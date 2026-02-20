import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { usePerlinSettings } from '../hooks/usePerlinSettings';

const FIELD_OF_VIEW = 55;
const CAMERA_START = { x: 0, y: 200, z: 1000 };
const PLANE_SIZE = 5000;
const PLANE_SUBDIVISIONS = 200;
const LINE_COLOR = 0xffffff;
const LINE_OPACITY = 0.02;

function createPerlin() {
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const randomGrad = (): [number, number] => {
    const angle = Math.random() * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  };

  const GRID_SIZE = 512;
  const gradients: [number, number][][] = [];

  for (let x = 0; x < GRID_SIZE; x++) {
    gradients[x] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      gradients[x][y] = randomGrad();
    }
  }

  const dot = (ix: number, iy: number, x: number, y: number) => {
    const grad = gradients[ix & (GRID_SIZE - 1)][iy & (GRID_SIZE - 1)];
    return (x - ix) * grad[0] + (y - iy) * grad[1];
  };

  return (x: number, y: number) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = x0 + 1, y1 = y0 + 1;

    const sx = fade(x - x0);
    const sy = fade(y - y0);

    const ix0 = lerp(dot(x0, y0, x, y), dot(x1, y0, x, y), sx);
    const ix1 = lerp(dot(x0, y1, x, y), dot(x1, y1, x, y), sx);

    return lerp(ix0, ix1, sy);
  };
}

const PerlinBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = usePerlinSettings();
  const settingsRef = useRef(settings);

  // Keep ref up to date to avoid restarting animation frame loop
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    const noise = createPerlin();
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(CAMERA_START.x, CAMERA_START.y, CAMERA_START.z);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clean up just in case (e.g. strict mode)
    while (currentContainer.firstChild) {
      currentContainer.removeChild(currentContainer.firstChild);
    }
    currentContainer.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SUBDIVISIONS, PLANE_SUBDIVISIONS);
    const material = new THREE.MeshBasicMaterial({ color: LINE_COLOR, wireframe: true, transparent: true, opacity: LINE_OPACITY });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -(Math.PI / 2.3);
    scene.add(mesh);

    let t = 0, targetX = 0, targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const RANGE = 70;
      targetX = (e.clientX / window.innerWidth - 0.5) * RANGE;
      targetY = (e.clientY / window.innerHeight - 0.5) * RANGE;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const pos = geometry.attributes.position;
    let animationFrameId: number;

    const animate = () => {
      const { noiseScale, timeFlow, height } = settingsRef.current;
      t += 0.005;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) * 0.01;
        const y = pos.getY(i) * 0.01;
        pos.setZ(i, noise(x * noiseScale + t * timeFlow, y * noiseScale - t * timeFlow) * height);
      }
      pos.needsUpdate = true;

      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (-targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (currentContainer && renderer.domElement.parentNode === currentContainer) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default PerlinBackground;
