import { buildings, floors, points, edges, panoramas, Building, Floor, Point, Edge, Panorama } from './navigationData';

// ============= ЭКСПОРТ ТИПОВ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ ФАЙЛАХ =============
export type { Building, Floor, Point, Edge, Panorama };

// ============= GETTERS =============

export const getBuildingById = (id: number): Building | undefined => {
  return buildings.find(b => b.id === id);
};

export const getFloorsByBuilding = (buildingId: number): Floor[] => {
  return floors.filter(f => f.building_id === buildingId).sort((a, b) => a.floor_number - b.floor_number);
};

export const getPointsByBuilding = (buildingId: number, floorNumber?: number): Point[] => {
  let result = points.filter(p => p.building_id === buildingId);
  if (floorNumber !== undefined) {
    const floorIds = floors.filter(f => f.building_id === buildingId && f.floor_number === floorNumber).map(f => f.id);
    result = result.filter(p => floorIds.includes(p.floor_id));
  }
  return result.sort((a, b) => a.id - b.id);
};

export const getPointsByFloor = (floorId: number): Point[] => {
  return points.filter(p => p.floor_id === floorId);
};

export const getEdgesByBuilding = (buildingId: number): Edge[] => {
  const buildingPoints = points.filter(p => p.building_id === buildingId).map(p => p.id);
  return edges.filter(e => buildingPoints.includes(e.from_point_id) && buildingPoints.includes(e.to_point_id));
};

export const getEdgesFromPoint = (pointId: number): Edge[] => {
  return edges.filter(e => e.from_point_id === pointId);
};

export const getPointById = (id: number): Point | undefined => {
  return points.find(p => p.id === id);
};

export const getPanoramaByPointId = (pointId: number): Panorama | undefined => {
  return panoramas.find(p => p.point_id === pointId);
};

export const getPanoramasByBuilding = (buildingId: number): Panorama[] => {
  const buildingPoints = points.filter(p => p.building_id === buildingId).map(p => p.id);
  return panoramas.filter(p => buildingPoints.includes(p.point_id));
};

// ============= АЛГОРИТМ ПОИСКА ПУТИ (Дейкстра) =============

interface PathNode {
  id: number;
  distance: number;
  duration: number;
  previous: number | null;
}

export interface PathResult {
  points: Point[];
  edges: Edge[];
  totalDistance: number;
  totalDuration: number;
}

export const findShortestPath = (
  buildingId: number,
  startPointId: number,
  endPointId: number
): PathResult | null => {
  const buildingPoints = points.filter(p => p.building_id === buildingId);
  const buildingEdges = getEdgesByBuilding(buildingId);
  
  // Строим граф
  const graph: Record<number, { to: number; edge: Edge }[]> = {};
  buildingPoints.forEach(p => { graph[p.id] = []; });
  
  buildingEdges.forEach(edge => {
    graph[edge.from_point_id].push({ to: edge.to_point_id, edge });
    if (edge.is_bidirectional) {
      graph[edge.to_point_id].push({ to: edge.from_point_id, edge });
    }
  });
  
  // Алгоритм Дейкстры
  const distances: Record<number, number> = {};
  const durations: Record<number, number> = {};
  const previous: Record<number, number | null> = {};
  const visited = new Set<number>();
  const queue: number[] = [];
  
  buildingPoints.forEach(p => {
    distances[p.id] = Infinity;
    durations[p.id] = Infinity;
    previous[p.id] = null;
  });
  
  distances[startPointId] = 0;
  durations[startPointId] = 0;
  queue.push(startPointId);
  
  while (queue.length > 0) {
    queue.sort((a, b) => distances[a] - distances[b]);
    const current = queue.shift()!;
    
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === endPointId) break;
    
    for (const neighbor of graph[current] || []) {
      if (visited.has(neighbor.to)) continue;
      
      const newDistance = distances[current] + neighbor.edge.distance_meters;
      const newDuration = durations[current] + neighbor.edge.duration_minutes;
      
      if (newDistance < distances[neighbor.to]) {
        distances[neighbor.to] = newDistance;
        durations[neighbor.to] = newDuration;
        previous[neighbor.to] = current;
        queue.push(neighbor.to);
      }
    }
  }
  
  if (distances[endPointId] === Infinity) {
    return null;
  }
  
  // Восстанавливаем путь
  const pathPoints: Point[] = [];
  const pathEdges: Edge[] = [];
  let current = endPointId;
  
  while (current !== startPointId) {
    const prev = previous[current];
    if (prev === null) break;
    
    const point = getPointById(current);
    if (point) pathPoints.unshift(point);
    
    const edge = buildingEdges.find(e => e.from_point_id === prev && e.to_point_id === current) ||
                 buildingEdges.find(e => e.from_point_id === current && e.to_point_id === prev && e.is_bidirectional);
    if (edge) pathEdges.unshift(edge);
    
    current = prev;
  }
  
  const startPoint = getPointById(startPointId);
  if (startPoint) pathPoints.unshift(startPoint);
  
  return {
    points: pathPoints,
    edges: pathEdges,
    totalDistance: Math.round(distances[endPointId]),
    totalDuration: Math.round(durations[endPointId] * 10) / 10,
  };
};