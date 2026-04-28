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
  viewBox?: string;
  isEditMode?: boolean;
  onPointMouseDown?: (e: React.MouseEvent, pointId: number) => void;
  draggedPointId?: number | null;
  planDimensions?: { width: number; height: number };
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
  viewBox = '0 0 100 100',
  isEditMode = false,
  onPointMouseDown,
  draggedPointId,
  planDimensions = { width: 400, height: 400 },
}) => {
  const getPointPosition = (point: Point) => {
    let x = point.x_coord ?? 50;
    let y = point.y_coord ?? 50;
    
    // Если координаты > 100, считаем что это пиксели, а не проценты
    if (x > 100 || y > 100) {
      // Масштабируем из пикселей в проценты (0-100)
      x = (x / planDimensions.width) * 100;
      y = (y / planDimensions.height) * 100;
      
      // Логирование для отладки (только для первых нескольких точек)
      if (point.id && point.id % 50 === 0) {
        console.log(`Точка ${point.id}: (${point.x_coord}, ${point.y_coord}) → (${x.toFixed(1)}, ${y.toFixed(1)}) | План: ${planDimensions.width}x${planDimensions.height}`);
      }
    }
    

    x = Math.min(Math.max(x, 0), 100);
    y = Math.min(Math.max(y, 0), 100);
    
    return { x, y };
  };

  const getPointStyle = (point: Point) => {
    const isSelectedFrom = selectedFromPoint === point.id;
    const isSelectedTo = selectedToPoint === point.id;
    const isInPath = pathPointIds.has(point.id);
    const isCurrent = currentPointId === point.id;
    const isHovered = hoveredPointId === point.id;
    const isStaircase = point.type === 2 || point.type === 4 || point.type === 6;
    const isDragged = draggedPointId === point.id;

    let fill = '#9ca3af';
    let stroke = '#6b7280';
    let radius = 1.2;
    let strokeWidth = 0.2;

    if (isCurrent) {
      fill = '#f97316';
      stroke = '#c2410c';
      radius = 2.0;
      strokeWidth = 0.3;
    } else if (isSelectedFrom) {
      fill = '#3b82f6';
      stroke = '#1e40af';
      radius = 1.8;
      strokeWidth = 0.3;
    } else if (isSelectedTo) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      radius = 1.8;
      strokeWidth = 0.3;
    } else if (isInPath) {
      fill = '#22c55e';
      stroke = '#15803d';
      radius = 1.5;
      strokeWidth = 0.3;
    } else if (isStaircase) {
      fill = '#f59e0b';
      stroke = '#d97706';
      radius = 1.5;
      strokeWidth = 0.3;
    } else if (isHovered) {
      fill = '#f59e0b';
      radius = 1.5;
      strokeWidth = 0.3;
    } else if (isDragged) {
      fill = '#8b5cf6';
      stroke = '#6d28d9';
      radius = 2.0;
      strokeWidth = 0.3;
    }

    const textX = radius + 0.8;
    const textY = radius - 1.5;

    return { fill, stroke, radius, strokeWidth, textX, textY };
  };

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto',
      }}
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
            strokeWidth={isInPath ? 1.2 : 0.6}
            strokeDasharray={isInPath ? 'none' : '2 1'}
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
            style={{ 
              cursor: isEditMode ? 'move' : 'pointer',
            }}
            onClick={() => {
              if (!isEditMode) {
                onPointClick(point.id);
              }
            }}
            onMouseEnter={() => onPointHover(point.id)}
            onMouseLeave={() => onPointHover(null)}
            onMouseDown={(e) => {
              if (isEditMode && onPointMouseDown) {
                e.stopPropagation();
                onPointMouseDown(e, point.id);
              }
            }}
          >
            <circle
              r={style.radius}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              className="floor-map-circle"
            />
            <text
              x={style.textX}
              y={style.textY}
              fontSize="2.5"
              fill="#374151"
              fontWeight="500"
              className="floor-map-text"
            >
              {point.name.length > 12 ? point.name.slice(0, 10) + '...' : point.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};