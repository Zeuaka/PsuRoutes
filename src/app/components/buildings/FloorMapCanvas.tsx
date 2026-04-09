import React from 'react';
import { Point, Edge } from '../../data/navigationData';

interface FloorMapCanvasProps {
  points: Point[];
  edges: Edge[];
  selectedFromPoint: number | null;
  selectedToPoint: number | null;
  currentPointId?: number;
  hoveredPointId: number | null;
  pathPointIds: Set<number>;
  pathEdgeIds: Set<number>;
  getConnectedFloors: (pointId: number) => number[];
  onPointClick: (pointId: number) => void;
  onPointHover: (pointId: number | null) => void;
}

export const FloorMapCanvas: React.FC<FloorMapCanvasProps> = ({
  points,
  edges,
  selectedFromPoint,
  selectedToPoint,
  currentPointId,
  hoveredPointId,
  pathPointIds,
  pathEdgeIds,
  getConnectedFloors,
  onPointClick,
  onPointHover,
}) => {
  const getPointPosition = (point: Point) => ({
    x: point.x_coord || 50,
    y: point.y_coord || 50,
  });

  const getPointStyle = (point: Point) => {
    const isSelectedFrom = selectedFromPoint === point.id;
    const isSelectedTo = selectedToPoint === point.id;
    const isInPath = pathPointIds.has(point.id);
    const isCurrent = currentPointId === point.id;
    const isHovered = hoveredPointId === point.id;
    const isStaircase = point.type === 2 || point.type === 4 || point.type === 6;

    let fill = '#9ca3af';
    let stroke = '#6b7280';
    let radius = 1.5;

    if (isCurrent) {
      fill = '#f97316';
      stroke = '#c2410c';
      radius = 2.8;
    } else if (isSelectedFrom) {
      fill = '#3b82f6';
      stroke = '#1e40af';
      radius = 2.5;
    } else if (isSelectedTo) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      radius = 2.5;
    } else if (isInPath) {
      fill = '#22c55e';
      stroke = '#15803d';
      radius = 2;
    } else if (isStaircase) {
      fill = '#f59e0b';
      stroke = '#d97706';
      radius = 2;
    } else if (isHovered) {
      fill = '#f59e0b';
      radius = 2;
    }

    return { fill, stroke, radius };
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="floor-map-svg"
    >
      {/* Рёбра */}
      {edges.map(edge => {
        const fromPoint = points.find(p => p.id === edge.from_point_id);
        const toPoint = points.find(p => p.id === edge.to_point_id);
        if (!fromPoint?.x_coord || !toPoint?.x_coord) return null;

        const from = getPointPosition(fromPoint);
        const to = getPointPosition(toPoint);
        const isInPath = pathEdgeIds.has(edge.id);

        return (
          <line
            key={`edge-${edge.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isInPath ? '#22c55e' : '#9ca3af'}
            strokeWidth={isInPath ? 0.8 : 0.3}
            strokeDasharray={isInPath ? 'none' : '1 0.5'}
            className="floor-map-line"
          />
        );
      })}

      {/* Точки */}
      {points.map(point => {
        const pos = getPointPosition(point);
        const style = getPointStyle(point);

        return (
          <g
            key={`point-${point.id}`}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onPointClick(point.id)}
            onMouseEnter={() => onPointHover(point.id)}
            onMouseLeave={() => onPointHover(null)}
          >
            <circle
              r={style.radius}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth="0.2"
              className="floor-map-circle"
            />
            <text
              x="2"
              y="-1"
              fontSize="2"
              fill="#374151"
              className="floor-map-text"
            >
              {point.name.length > 15 ? point.name.slice(0, 12) + '...' : point.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};