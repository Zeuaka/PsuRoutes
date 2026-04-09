// src/app/data/navigationApi.ts
import { Building, Floor, Point, Edge, Panorama } from './navigationData';

const API_BASE = '/api'; // настройте под свой бэкенд

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
  return res.json();
}

export async function fetchPanoramaByPointId(pointId: number): Promise<Panorama | undefined> {
  const res = await fetch(`${API_BASE}/panoramas/by-point/${pointId}`);
  if (!res.ok) return undefined;
  return res.json();
}