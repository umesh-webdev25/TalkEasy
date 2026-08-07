import { useState, useCallback } from 'react';

export function useMousePosition(ref) {
  const [pos, setPos] = useState({ x: 0, y: 0, cx: 0, cy: 0 });

  const onMouseMove = useCallback(
    (e) => {
      const rect = ref.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left ?? 0);
      const y = e.clientY - (rect?.top ?? 0);
      const w = rect?.width || 1;
      const h = rect?.height || 1;
      setPos({ x, y, cx: x / w, cy: y / h });
    },
    [ref],
  );

  return { pos, onMouseMove };
}