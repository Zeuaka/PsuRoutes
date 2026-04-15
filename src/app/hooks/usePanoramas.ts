// src/app/hooks/usePanoramas.ts
import { useState, useEffect } from 'react';
import { fetchPanoramasByBuilding } from '../data/navigationApi';
import { Panorama } from '../data/navigationData';

// Кэш для панорам по зданиям
const panoramasCache = new Map<number, Panorama[]>();

export function usePanoramas(buildingId: number | null) {
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [panoramaMap, setPanoramaMap] = useState<Map<number, Panorama>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если buildingId === null, не делаем запросы
    if (buildingId === null) {
      setPanoramas([]);
      setPanoramaMap(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPanoramas() {
      // Используем buildingId! - мы уже проверили, что он не null
      const safeId = buildingId!;
      
      // Проверяем кэш
      if (panoramasCache.has(safeId)) {
        const cached = panoramasCache.get(safeId)!;
        if (!cancelled) {
          setPanoramas(cached);
          const map = new Map<number, Panorama>();
          cached.forEach(p => map.set(p.point_id, p));
          setPanoramaMap(map);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchPanoramasByBuilding(safeId);
        if (!cancelled) {
          panoramasCache.set(safeId, data);
          setPanoramas(data);
          const map = new Map<number, Panorama>();
          data.forEach(p => map.set(p.point_id, p));
          setPanoramaMap(map);
        }
      } catch (err) {
        if (!cancelled) setError('Ошибка загрузки панорам');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPanoramas();
    return () => { cancelled = true; };
  }, [buildingId]);

  // Функция для получения панорамы по ID точки
  const getPanoramaByPointId = (pointId: number): Panorama | undefined => {
    return panoramaMap.get(pointId);
  };

  return { panoramas, panoramaMap, getPanoramaByPointId, loading, error };
}