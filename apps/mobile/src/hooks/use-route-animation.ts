import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { pathAt, type MapRoute } from '@/utils/route';

const MS_PER_LEG = 1200;
const MAX_DURATION_MS = 6000;
/** Harita her karede yeniden çizilmesin diye çizgi saniyede en fazla 30 kez güncellenir. */
const FRAME_MS = 33;

/** Rota çizgilerini birlikte ilerletir; telefonun "Hareketi Azalt" ayarında hemen tamamlar. */
export function useRouteAnimation(routes: MapRoute[]) {
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState(0);
  const longest = Math.max(0, ...routes.map((route) => route.stops.length));

  useEffect(() => {
    if (longest < 2) return;
    const duration = Math.min((longest - 1) * MS_PER_LEG, MAX_DURATION_MS);
    let frame: number | undefined;
    let cancelled = false;
    let startedAt: number | undefined;
    let lastDrawn = 0;

    function tick(now: number) {
      if (cancelled) return;
      startedAt ??= now;
      const next = Math.min((now - startedAt) / duration, 1);
      if (next === 1 || now - lastDrawn >= FRAME_MS) {
        lastDrawn = now;
        setProgress(next);
      }
      if (next < 1) frame = requestAnimationFrame(tick);
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          setProgress(1);
        } else {
          setProgress(0);
          frame = requestAnimationFrame(tick);
        }
      });

    return () => {
      cancelled = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [longest, routes, run]);

  const paths = useMemo(
    () => routes.map((route) => pathAt(route.stops.map((stop) => stop.coordinates), progress)),
    [routes, progress]
  );

  return { paths, canReplay: longest > 1, replay: () => setRun((value) => value + 1) };
}
