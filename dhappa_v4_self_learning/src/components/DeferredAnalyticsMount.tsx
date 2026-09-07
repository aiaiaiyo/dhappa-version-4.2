import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';

interface Props {
  active: boolean;
  label: string;
  children: React.ReactNode;
  delayMs?: number;
  keepAlive?: boolean;
}

/**
 * V4.3 heavy-screen lifecycle:
 * - First visit is deferred until after navigation paints.
 * - Leaving before first mount cancels the pending mount.
 * - After first mount, the expensive subtree stays alive by default.
 *   Re-visiting therefore preserves React state/useMemo caches instead of rebuilding it.
 * - While hidden, the last child element is frozen so unrelated tab changes do not
 *   propagate fresh element identities through the expensive subtree.
 */
export function DeferredAnalyticsMount({ active, label, children, delayMs = 90, keepAlive = true }: Props) {
  const [mountedOnce, setMountedOnce] = useState(false);
  const frozenChild = useRef(children);

  if (active) frozenChild.current = children;

  useEffect(() => {
    if (mountedOnce || !active) return;
    let cancelled = false;
    let timeoutId: number | undefined;
    let idleId: number | undefined;

    const mount = () => { if (!cancelled) setMountedOnce(true); };
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
    if (ric) idleId = ric(mount, { timeout: delayMs + 180 });
    else timeoutId = window.setTimeout(mount, delayMs);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const cic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
      if (idleId !== undefined && cic) cic(idleId);
    };
  }, [active, delayMs, mountedOnce]);

  if (!mountedOnce) {
    if (!active) return null;
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Activity className="h-4 w-4 animate-pulse text-cyan-300" />
          <span>Opening {label} without blocking navigation…</span>
        </div>
      </div>
    );
  }

  if (!keepAlive && !active) return null;

  return (
    <div
      hidden={!active}
      aria-hidden={!active}
      style={!active ? { display: 'none' } : undefined}
      data-analytics-keepalive={label}
    >
      {frozenChild.current}
    </div>
  );
}
