import { Point, Edge } from './navigationData';

export interface PathResult {
  points: Point[];
  edges: Edge[];
  totalDistance: number;
  totalDuration: number;
  edgesDuration?: number[];
}

function getPointSpeed(point: Point): number {
  if (point.type === 4 || point.type === 6) {
    return 2; // км/ч для лестниц
  }
  return 4; // км/ч для обычных точек
}

function calculateDuration(edge: Edge, fromPoint: Point, toPoint: Point): number {
  const distance = Number(edge.distance_meters) || 0;
  const speed = getPointSpeed(fromPoint);
  const durationMinutes = (distance / 1000 / speed) * 60;
  return durationMinutes;
}

export function findShortestPath(
  points: Point[],
  edges: Edge[],
  startPointId: number,
  endPointId: number
): PathResult | null {
  const pointMap = new Map(points.map(p => [p.id, p]));
  
  // Построение графа
  const graph: Record<number, { to: number; distance: number; duration: number; edge: Edge }[]> = {};
  points.forEach(p => { graph[p.id] = []; });
  
  edges.forEach(edge => {
    const fromPoint = pointMap.get(edge.from_point_id);
    const toPoint = pointMap.get(edge.to_point_id);
    
    if (!fromPoint || !toPoint) return;
    
    const distance = Number(edge.distance_meters) || 0;
    const duration = calculateDuration(edge, fromPoint, toPoint);
    
    graph[edge.from_point_id].push({
      to: edge.to_point_id,
      distance: distance,
      duration: duration,
      edge: edge,
    });
    
    // Обратное направление
    const backDuration = calculateDuration(edge, toPoint, fromPoint);
    graph[edge.to_point_id].push({
      to: edge.from_point_id,
      distance: distance,
      duration: backDuration,
      edge: edge,
    });
  });

  // Дейкстра
  const dist: Record<number, number> = {};
  const dur: Record<number, number> = {};
  const prev: Record<number, { id: number; edge: Edge | null }> = {};
  
  points.forEach(p => {
    dist[p.id] = Infinity;
    dur[p.id] = Infinity;
    prev[p.id] = { id: -1, edge: null };
  });
  
  dist[startPointId] = 0;
  dur[startPointId] = 0;
  
  const queue = [startPointId];
  const visited = new Set<number>();

  while (queue.length) {
    let current = queue[0];
    let minDist = dist[current];
    for (let i = 1; i < queue.length; i++) {
      const id = queue[i];
      if (dist[id] < minDist) {
        minDist = dist[id];
        current = id;
      }
    }
    const index = queue.indexOf(current);
    queue.splice(index, 1);

    if (visited.has(current)) continue;
    visited.add(current);
    if (current === endPointId) break;

    for (const neighbor of graph[current] || []) {
      if (visited.has(neighbor.to)) continue;
      
      const newDist = dist[current] + neighbor.distance;
      const newDur = dur[current] + neighbor.duration;
      
      if (newDist < dist[neighbor.to]) {
        dist[neighbor.to] = newDist;
        dur[neighbor.to] = newDur;
        prev[neighbor.to] = { id: current, edge: neighbor.edge };
        if (!queue.includes(neighbor.to)) {
          queue.push(neighbor.to);
        }
      }
    }
  }

  if (dist[endPointId] === Infinity) {
    console.warn('Путь не найден');
    return null;
  }

  // Восстановление пути
  const pathPoints: Point[] = [];
  const pathEdges: Edge[] = [];
  let cur = endPointId;
  
  while (cur !== startPointId) {
    const point = pointMap.get(cur);
    if (point) pathPoints.unshift(point);
    const edge = prev[cur]?.edge;
    if (edge) pathEdges.unshift(edge);
    cur = prev[cur]?.id ?? startPointId;
  }
  const startPoint = pointMap.get(startPointId);
  if (startPoint) pathPoints.unshift(startPoint);

  // Подсчёт сумм и массива времени по шагам
  let totalDistance = 0;
  let totalDuration = 0;
  const edgesDuration: number[] = [];

  for (let i = 0; i < pathEdges.length; i++) {
    const edge = pathEdges[i];
    const fromPoint = pathPoints[i];
    const toPoint = pathPoints[i + 1];
    
    if (fromPoint && toPoint) {
      const distance = Number(edge.distance_meters) || 0;
      const duration = calculateDuration(edge, fromPoint, toPoint);
      
      totalDistance += distance;
      totalDuration += duration;
      edgesDuration.push(duration);
    }
  }

  return {
    points: pathPoints,
    edges: pathEdges,
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration * 10) / 10,
    edgesDuration: edgesDuration,
  };
}