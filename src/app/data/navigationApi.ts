// src/app/data/navigationApi.ts
import { Building, Floor, Point, Edge, Panorama } from './navigationData';

const API_BASE = 'http://localhost:5000/api';
// Адрес фронтенда (Vite). В продакшене замените на переменную окружения.
const FRONTEND_BASE = 'http://localhost:5173';

// Вспомогательная функция для преобразования путей к панорамам
function fixPanoramaPath(path: string): string {
  if (!path) return path;
  // Если это уже полный URL, возвращаем как есть
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Если путь начинается с /, добавляем базовый URL фронтенда
  if (path.startsWith('/')) {
    return `${FRONTEND_BASE}${path}`;
  }
  return path;
}

export async function fetchBuildingById(id: number): Promise<Building | null> {
  const res = await fetch(`${API_BASE}/buildings/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchFloorsByBuilding(buildingId: number): Promise<Floor[]> {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/floors`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPointsByBuilding(buildingId: number): Promise<Point[]> {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/points`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEdgesByBuilding(buildingId: number): Promise<Edge[]> {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/edges`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPanoramasByBuilding(buildingId: number): Promise<Panorama[]> {
  const res = await fetch(`${API_BASE}/buildings/${buildingId}/panoramas`);
  if (!res.ok) return [];
  const data: Panorama[] = await res.json();
  // Преобразуем пути у каждой панорамы
  return data.map(p => ({
    ...p,
    image_path: fixPanoramaPath(p.image_path),
  }));
}

export async function fetchPanoramaByPointId(pointId: number): Promise<Panorama | undefined> {
  const res = await fetch(`${API_BASE}/panoramas/by-point/${pointId}`);
  if (!res.ok) return undefined;
  const data: Panorama = await res.json();
  if (data && data.image_path) {
    data.image_path = fixPanoramaPath(data.image_path);
  }
  return data;
}