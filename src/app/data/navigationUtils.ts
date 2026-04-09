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
  const graph: Record<number, { to: number; edge: Edge }[]> = {};
  points.forEach(p => { graph[p.id] = []; });
  edges.forEach(edge => {
    graph[edge.from_point_id].push({ to: edge.to_point_id, edge });
    if (edge.is_bidirectional) {
      graph[edge.to_point_id].push({ to: edge.from_point_id, edge });
    }
  });

  const distances: Record<number, number> = {};
  const durations: Record<number, number> = {};
  const previous: Record<number, number | null> = {};
  const visited = new Set<number>();
  const queue: number[] = [];

  points.forEach(p => {
    distances[p.id] = Infinity;
    durations[p.id] = Infinity;
    previous[p.id] = null;
  });
  distances[startPointId] = 0;
  durations[startPointId] = 0;
  queue.push(startPointId);

  while (queue.length) {
    queue.sort((a, b) => distances[a] - distances[b]);
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (current === endPointId) break;

    for (const neighbor of graph[current] || []) {
      if (visited.has(neighbor.to)) continue;
      const newDist = distances[current] + neighbor.edge.distance_meters;
      const newDur = durations[current] + neighbor.edge.duration_minutes;
      if (newDist < distances[neighbor.to]) {
        distances[neighbor.to] = newDist;
        durations[neighbor.to] = newDur;
        previous[neighbor.to] = current;
        queue.push(neighbor.to);
      }
    }
  }

  if (distances[endPointId] === Infinity) return null;

  const pathPoints: Point[] = [];
  const pathEdges: Edge[] = [];
  let current = endPointId;
  while (current !== startPointId) {
    const prev = previous[current];
    if (prev === null) break;
    const point = points.find(p => p.id === current);
    if (point) pathPoints.unshift(point);
    const edge = edges.find(e =>
      (e.from_point_id === prev && e.to_point_id === current) ||
      (e.from_point_id === current && e.to_point_id === prev && e.is_bidirectional)
    );
    if (edge) pathEdges.unshift(edge);
    current = prev;
  }
  const startPoint = points.find(p => p.id === startPointId);
  if (startPoint) pathPoints.unshift(startPoint);

  return {
    points: pathPoints,
    edges: pathEdges,
    totalDistance: Math.round(distances[endPointId]),
    totalDuration: Math.round(durations[endPointId] * 10) / 10,
  };
}