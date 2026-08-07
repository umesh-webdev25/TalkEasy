import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion, useInView } from 'framer-motion';
import { cn } from '../../utils/cn';
import { isTouchDevice } from '../../hooks/useMediaQuery';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function CubeCluster({ count, cubeColor, face }) {
  const groupRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const cubes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        position: [rand(-11, 11), rand(-6, 6), rand(-6, 2)] ,
        rotation: [rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI)],
        size: rand(0.35, 1.1),
        speed: rand(0.2, 0.7),
        spin: rand(-0.6, 0.6),
      })),
    [count],
  );

  useEffect(() => {
    if (face !== 0) return;
    const onMove = (e) => {
      mouse.current.x = e.clientX / window.innerWidth - 0.5;
      mouse.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [face]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.rotation.y += 0.0016 + mouse.current.x * 0.0004;
    group.rotation.x += 0.0008 + mouse.current.y * 0.0003;

    group.children.forEach((child, i) => {
      const cube = cubes[i];
      if (!cube) return;
      child.rotation.x += cube.spin * 0.002;
      child.rotation.y += cube.spin * 0.002;
      child.position.y += Math.sin(t * cube.speed + cube.id) * 0.002;
    });
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube) => (
        <mesh key={cube.id} position={cube.position} rotation={cube.rotation}>
          <boxGeometry args={[cube.size, cube.size, cube.size]} />
          <meshBasicMaterial color={cubeColor} wireframe transparent opacity={0.22} />
        </mesh>
      ))}
    </group>
  );
}

export default function CubesBackground({ className, count = 24, color = '#8b8b95', face = 0 }) {
  const reduce = useReducedMotion();
  const touch = isTouchDevice();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const enabled = !reduce && !touch && inView;

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden>
      {enabled && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 14], fov: 55 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <CubeCluster count={count} cubeColor={color} face={face} />
        </Canvas>
      )}
    </div>
  );
}