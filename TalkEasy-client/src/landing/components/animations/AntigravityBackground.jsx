import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion, useInView } from 'framer-motion';
import { cn } from '../../utils/cn';
import { isTouchDevice } from '../../hooks/useMediaQuery';

function Particles({ count, fieldColor, face }) {
  const pointsRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const shared = useRef(null);
  if (shared.current === null) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    shared.current = { positions, velocities: new Float32Array(count * 3) };
  }
  const { positions, velocities } = shared.current;

  useEffect(() => {
    if (face !== 0) return;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [face]);

  useFrame((state, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const arr = geom.attributes.position.array;
    const dt = Math.min(delta, 0.033);
    const mx = mouse.current.x * 16;
    const my = mouse.current.y * 10;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;
      const driftX = Math.sin(time * 0.15 + i * 0.03) * 0.02;
      const driftY = Math.cos(time * 0.12 + i * 0.04) * 0.02;

      velocities[ix] += (mx - arr[ix]) * 0.0016 * dt * 60 + driftX;
      velocities[iy] += (my - arr[iy]) * 0.0016 * dt * 60 + driftY;
      velocities[iz] += (0 - arr[iz]) * 0.0006 * dt * 60;

      velocities[ix] *= 0.945;
      velocities[iy] *= 0.945;
      velocities[iz] *= 0.945;

      arr[ix] += velocities[ix];
      arr[iy] += velocities[iy];
      arr[iz] += velocities[iz];
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={fieldColor}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function AntigravityBackground({ className, count, color = '#8b8b95', face = 0 }) {
  const reduce = useReducedMotion();
  const touch = isTouchDevice();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const particleCount = useMemo(() => {
    if (typeof window === 'undefined') return count;
    const w = window.innerWidth;
    if (w < 640) return Math.min(count, 700);
    if (w < 1024) return Math.min(count, 1200);
    return count;
  }, [count]);

  const enabled = !reduce && !touch && inView;

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden>
      {enabled && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 12], fov: 55 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <Particles count={particleCount} fieldColor={color} face={face} />
        </Canvas>
      )}
    </div>
  );
}