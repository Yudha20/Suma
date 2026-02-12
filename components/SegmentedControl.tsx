'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
};

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ x: number; t: number } | null>(null);
  const downOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [railWidth, setRailWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [thumbX, setThumbX] = useState(0);
  const [stretch, setStretch] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [pointerHeld, setPointerHeld] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  const DRAG_THRESHOLD = 4;

  const activeIndex = useMemo(() => {
    const index = options.findIndex((o) => o.value === value);
    return index < 0 ? 0 : index;
  }, [options, value]);

  const trackWidth = Math.max(0, railWidth - 8);
  const segmentWidth = options.length > 0 ? trackWidth / options.length : 0;
  const scaleX = 1 + stretch * 0.14;
  const scaleY = 1 - stretch * 0.06;

  /* ── Measure rail ────────────────────────────── */

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setRailWidth(element.getBoundingClientRect().width);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* ── Snap thumb to active segment (click path) ─ */

  useEffect(() => {
    if (!segmentWidth || dragging) {
      return;
    }
    setThumbX(activeIndex * segmentWidth);
  }, [activeIndex, segmentWidth, dragging]);

  /* ── Stretch decay ───────────────────────────── */

  useEffect(() => {
    if (stretch <= 0 || dragging) {
      return;
    }
    let frame = 0;
    const decay = () => {
      setStretch((prev) => {
        const next = prev * 0.82;
        return next < 0.02 ? 0 : next;
      });
      frame = window.requestAnimationFrame(decay);
    };
    frame = window.requestAnimationFrame(decay);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [stretch, dragging]);

  /* ── Pressed (tap) micro-animation ───────────── */

  useEffect(() => {
    if (!pressed) {
      return;
    }
    const timeout = setTimeout(() => setPressed(false), 180);
    return () => clearTimeout(timeout);
  }, [pressed]);

  /* ── Settling (post-drag snap-back) ──────────── */

  useEffect(() => {
    if (!settling) {
      return;
    }
    const timeout = setTimeout(() => setSettling(false), 400);
    return () => clearTimeout(timeout);
  }, [settling]);

  /* ── Bouncing (re-tap on active segment) ──────── */

  useEffect(() => {
    if (!bouncing) {
      return;
    }
    const timeout = setTimeout(() => setBouncing(false), 400);
    return () => clearTimeout(timeout);
  }, [bouncing]);

  /* ── Drag helpers ────────────────────────────── */

  const updateFromClientX = (clientX: number) => {
    const element = rootRef.current;
    if (!element || !segmentWidth) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const localX = Math.max(4, Math.min(clientX - rect.left, rect.width - 4));
    const contentX = Math.max(0, Math.min(localX - 4, trackWidth));
    const nextThumbX = Math.max(0, Math.min(contentX - segmentWidth / 2, trackWidth - segmentWidth));
    setThumbX(nextThumbX);

    const nextIndex = Math.max(0, Math.min(Math.floor(contentX / segmentWidth), options.length - 1));
    const nextValue = options[nextIndex]?.value;
    if (nextValue !== undefined && nextValue !== value) {
      onChange(nextValue);
    }

    const now = performance.now();
    const last = pointerRef.current;
    if (last) {
      const dt = Math.max(8, now - last.t);
      const velocity = Math.abs(clientX - last.x) / dt;
      setStretch(Math.max(0, Math.min(velocity / 1.4, 1)));
    }
    pointerRef.current = { x: clientX, t: now };
  };

  /** Resolve which segment index lives under a clientX coordinate */
  const indexFromClientX = (clientX: number): number => {
    const element = rootRef.current;
    if (!element || !segmentWidth) {
      return activeIndex;
    }
    const rect = element.getBoundingClientRect();
    const localX = Math.max(4, Math.min(clientX - rect.left, rect.width - 4));
    const contentX = Math.max(0, Math.min(localX - 4, trackWidth));
    return Math.max(0, Math.min(Math.floor(contentX / segmentWidth), options.length - 1));
  };

  /* ── Pointer events ──────────────────────────── */

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    downOriginRef.current = { x: event.clientX, y: event.clientY };
    pointerRef.current = { x: event.clientX, t: performance.now() };
    setPointerHeld(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = downOriginRef.current;
    if (!origin) {
      return;
    }

    if (!dragging) {
      const dx = Math.abs(event.clientX - origin.x);
      const dy = Math.abs(event.clientY - origin.y);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return; /* Still within dead zone — treat as tap */
      }
      /* Crossed threshold — enter drag mode, capture pointer */
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      updateFromClientX(event.clientX);
      return;
    }

    updateFromClientX(event.clientX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const wasDragging = dragging;
    const origin = downOriginRef.current;

    downOriginRef.current = null;
    pointerRef.current = null;
    setDragging(false);
    setPointerHeld(false);

    if (wasDragging) {
      /* Was a real drag — snap back to nearest segment */
      if (segmentWidth) {
        setSettling(true);
        setThumbX(activeIndex * segmentWidth);
      }
    } else if (origin) {
      /* Was a tap (never crossed drag threshold) — select the tapped segment */
      const tappedIndex = indexFromClientX(event.clientX);
      const tappedValue = options[tappedIndex]?.value;
      if (tappedValue !== undefined && tappedValue !== value) {
        setPressed(true);
        onChange(tappedValue);
      } else if (tappedValue === value) {
        /* Re-tapped the already-active segment — elastic bounce */
        setBouncing(true);
      }
    }
  };

  /* ── CSS state class ─────────────────────────── */

  const railClass = [
    'neu-segment-rail',
    dragging ? 'is-dragging' : '',
    settling ? 'is-settling' : '',
    pressed ? 'is-pressed' : '',
    pointerHeld && !dragging ? 'is-held' : '',
    bouncing ? 'is-bouncing' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-2">
      <span className="neu-label">{label}</span>
      <div
        ref={rootRef}
        className={railClass}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          downOriginRef.current = null;
          pointerRef.current = null;
          setDragging(false);
          setPointerHeld(false);
        }}
        style={{ touchAction: 'none' }}
        role="radiogroup"
        aria-label={label}
      >
        <div
          className="neu-segment-liquid-trail"
          style={{
            width: segmentWidth,
            transform: `translateX(${thumbX}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity: dragging ? 0.55 : 0
          }}
          aria-hidden="true"
        />
        <div
          className="neu-segment-thumb"
          style={{
            width: segmentWidth,
            transform: `translateX(${thumbX}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            scale: pointerHeld && !dragging ? '0.985 1.015' : undefined
          }}
          aria-hidden="true"
        >
          <div className="neu-segment-thumb-sheen" />
        </div>
        {options.map((option, index) => {
          const active = option.value === value;
          const hideSeam = index > 0 && (index === activeIndex || index === activeIndex + 1);
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-active={active}
              data-hide-seam={hideSeam || undefined}
              className="neu-segment geist-mono"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
