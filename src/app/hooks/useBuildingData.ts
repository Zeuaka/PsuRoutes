import { useState, useEffect } from 'react';
import { Floor, Point, Edge, Panorama } from '../data/navigationData';
import {
  fetchFloorsByBuilding,
  fetchPointsByBuilding,
  fetchEdgesByBuilding,
  fetchPanoramasByBuilding,
} from '../data/navigationApi';

export function useBuildingData(buildingId: number | null) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (buildingId === null) {
      setLoading(false);
      setFloors([]);
      setPoints([]);
      setEdges([]);
      setPanoramas([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Используем buildingId как number, потому что выше проверили на null
        const [floorsData, pointsData, edgesData, panoramasData] = await Promise.all([
          fetchFloorsByBuilding(buildingId!),
          fetchPointsByBuilding(buildingId!),
          fetchEdgesByBuilding(buildingId!),
          fetchPanoramasByBuilding(buildingId!),
        ]);
        if (!cancelled) {
          setFloors(floorsData);
          setPoints(pointsData);
          setEdges(edgesData);
          setPanoramas(panoramasData);
        }
      } catch (err) {
        if (!cancelled) setError('Ошибка загрузки данных');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [buildingId]);

  return { floors, points, edges, panoramas, loading, error };
}