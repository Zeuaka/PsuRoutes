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
  routePointIds?: Set<number>;
  buildingId?: number;
}

// Конфигурация размеров точек для разных корпусов
// scaleX и scaleY - коэффициенты компенсации искажения эллипса
// При значении 1 - круг, при >1 - вытягивание по оси
const pointSizeConfig: Record<number, { 
  baseRadius: number; 
  textSize: number; 
  strokeWidth: number;
  scaleX: number;  // компенсация растяжения по горизонтали
  scaleY: number;  // компенсация растяжения по вертикали
}> = {
  1: { baseRadius: 1.2, textSize: 0, strokeWidth: 0.2, scaleX: 1, scaleY: 0.65 },
  2: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  3: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  4: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  5: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  6: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  7: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  8: { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 },
  9: { baseRadius: 1.0, textSize: 2.0, strokeWidth: 0.18, scaleX: 1, scaleY: 1 },
  10: { baseRadius: 2, textSize: 0, strokeWidth: 0.2, scaleX: 0.5, scaleY: 1 },
  11: { baseRadius: 1.0, textSize: 2.0, strokeWidth: 0.18, scaleX: 1, scaleY: 1 },
  12: { baseRadius: 1.0, textSize: 2.0, strokeWidth: 0.18, scaleX: 1, scaleY: 1 },
  16: { baseRadius: 1.0, textSize: 2.0, strokeWidth: 0.18, scaleX: 1, scaleY: 1 },
};

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
  routePointIds,
  buildingId = 1,
}) => {
  // Получаем базовые размеры для корпуса
  const getBaseSizes = () => {
    return pointSizeConfig[buildingId] || { baseRadius: 1.2, textSize: 2.5, strokeWidth: 0.2, scaleX: 1, scaleY: 1 };
  };

  const getPointPosition = (point: Point) => {
    let x = point.x_coord ?? 50;
    let y = point.y_coord ?? 50;
    
    if (x > 100 || y > 100) {
      x = (x / planDimensions.width) * 100;
      y = (y / planDimensions.height) * 100;
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

    const baseConfig = getBaseSizes();
    let radiusX = baseConfig.baseRadius;
    let radiusY = baseConfig.baseRadius;
    let strokeWidth = baseConfig.strokeWidth;
    let textSize = baseConfig.textSize;

    let fill = '#9ca3af';
    let stroke = '#6b7280';

    if (isCurrent) {
      fill = '#f97316';
      stroke = '#c2410c';
      radiusX = baseConfig.baseRadius * 1.6;
      radiusY = baseConfig.baseRadius * 1.6;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isSelectedFrom) {
      fill = '#3b82f6';
      stroke = '#1e40af';
      radiusX = baseConfig.baseRadius * 1.5;
      radiusY = baseConfig.baseRadius * 1.5;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isSelectedTo) {
      fill = '#ef4444';
      stroke = '#b91c1c';
      radiusX = baseConfig.baseRadius * 1.5;
      radiusY = baseConfig.baseRadius * 1.5;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isInPath) {
      fill = '#22c55e';
      stroke = '#15803d';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isStaircase) {
      fill = '#f59e0b';
      stroke = '#d97706';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isHovered) {
      fill = '#f59e0b';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isDragged) {
      fill = '#8b5cf6';
      stroke = '#6d28d9';
      radiusX = baseConfig.baseRadius * 1.6;
      radiusY = baseConfig.baseRadius * 1.6;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    }

    // Применяем коэффициенты компенсации искажения
    radiusX = radiusX * baseConfig.scaleX;
    radiusY = radiusY * baseConfig.scaleY;

    const textX = (radiusX + 0.8) * (baseConfig.scaleX);
    const textY = (radiusY - 1.5) * (baseConfig.scaleY);

    return { fill, stroke, radiusX, radiusY, strokeWidth, textX, textY, textSize };
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

        const baseConfig = getBaseSizes();
        const lineWidth = isInPath ? baseConfig.baseRadius * 1.0 : baseConfig.baseRadius * 0.5;

        return (
          <line
            key={`edge-${edge.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isInPath ? '#22c55e' : '#9ca3af'}
            strokeWidth={lineWidth}
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
            <ellipse
              rx={style.radiusX}
              ry={style.radiusY}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              className="floor-map-circle"
            />
            <text
              x={style.textX}
              y={style.textY}
              fontSize={style.textSize}
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