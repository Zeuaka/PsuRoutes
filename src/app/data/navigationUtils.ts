import { Point, Edge } from './navigationData';

export interface PathResult {
  points: Point[];
  edges: Edge[];
  totalDistance: number;
  totalDuration: number;
}

export function findShortestPath(
  points: Point[],
  edges: Edge[],
  startPointId: number,
  endPointId: number
): PathResult | null {
  // 1. Построение графа
  const graph: Record<number, { to: number; distance: number; duration: number; edge: Edge }[]> = {};
  points.forEach(p => { graph[p.id] = []; });
  edges.forEach(edge => {
    graph[edge.from_point_id].push({
      to: edge.to_point_id,
      distance: edge.distance_meters,
      duration: edge.duration_minutes,
      edge: edge,
    });
    if (edge.is_bidirectional) {
      graph[edge.to_point_id].push({
        to: edge.from_point_id,
        distance: edge.distance_meters,
        duration: edge.duration_minutes,
        edge: edge,
      });
    }
  });

  // 2. Инициализация Дейкстры
  const dist: Record<number, number> = {};
  const duration: Record<number, number> = {};
  const prev: Record<number, { id: number; edge: Edge | null }> = {};
  points.forEach(p => {
    dist[p.id] = Infinity;
    duration[p.id] = Infinity;
    prev[p.id] = { id: -1, edge: null };
  });
  dist[startPointId] = 0;
  duration[startPointId] = 0;

  const queue = [startPointId];
  const visited = new Set<number>();

  while (queue.length) {
    // Находим узел с минимальным расстоянием
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
      const newDur = duration[current] + neighbor.duration;
      if (newDist < dist[neighbor.to]) {
        dist[neighbor.to] = newDist;
        duration[neighbor.to] = newDur;
        prev[neighbor.to] = { id: current, edge: neighbor.edge };
        if (!queue.includes(neighbor.to)) {
          queue.push(neighbor.to);
        }
      }
    }
  }

  // 3. Если Дейкстра не нашла путь, пробуем BFS
  if (dist[endPointId] === Infinity) {
    console.warn('Дейкстра не сработала, используем BFS');
    return findShortestPathBFS(points, edges, startPointId, endPointId);
  }

  // 4. Восстановление пути
  const pathPoints: Point[] = [];
  const pathEdges: Edge[] = [];
  let cur = endPointId;
  while (cur !== startPointId) {
    const point = points.find(p => p.id === cur);
    if (point) pathPoints.unshift(point);
    const edge = prev[cur]?.edge;
    if (edge) pathEdges.unshift(edge);
    cur = prev[cur]?.id ?? startPointId;
  }
  const startPoint = points.find(p => p.id === startPointId);
  if (startPoint) pathPoints.unshift(startPoint);

  return {
    points: pathPoints,
    edges: pathEdges,
    totalDistance: Math.round(dist[endPointId]),
    totalDuration: Math.round(duration[endPointId] * 10) / 10,
  };
}


function findShortestPathBFS(
  points: Point[],
  edges: Edge[],
  startPointId: number,
  endPointId: number
): PathResult | null {
  const graph: Record<number, { to: number; edge: Edge }[]> = {};
  points.forEach(p => { graph[p.id] = []; });
  edges.forEach(edge => {
    graph[edge.from_point_id].push({ to: edge.to_point_id, edge });
    if (edge.is_bidirectional) {
      graph[edge.to_point_id].push({ to: edge.from_point_id, edge });
    }
  });

  const queue: number[] = [startPointId];
  const visited = new Set<number>();
  const prev: Record<number, { node: number; edge: Edge }> = {};

  while (queue.length) {
    const current = queue.shift()!;
    if (current === endPointId) break;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor.to) && !prev[neighbor.to]) {
        prev[neighbor.to] = { node: current, edge: neighbor.edge };
        queue.push(neighbor.to);
      }
    }
  }

  if (!prev[endPointId] && startPointId !== endPointId) return null;

  const pathPoints: Point[] = [];
  const pathEdges: Edge[] = [];
  let cur = endPointId;
  while (cur !== startPointId) {
    const point = points.find(p => p.id === cur);
    if (point) pathPoints.unshift(point);
    const edge = prev[cur]?.edge;
    if (edge) pathEdges.unshift(edge);
    cur = prev[cur]?.node ?? startPointId;
  }
  const startPoint = points.find(p => p.id === startPointId);
  if (startPoint) pathPoints.unshift(startPoint);

  const totalDistance = pathEdges.reduce((sum, e) => sum + e.distance_meters, 0);
  const totalDuration = pathEdges.reduce((sum, e) => sum + e.duration_minutes, 0);
  return {
    points: pathPoints,
    edges: pathEdges,
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration * 10) / 10,
  };
}