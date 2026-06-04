import React, { useMemo, useCallback } from 'react';
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
  edgeWidth: number;
  scaleX: number;  // компенсация растяжения по горизонтали
  scaleY: number;  // компенсация растяжения по вертикали
}> = {
  1: { baseRadius: 1, textSize: 0, strokeWidth: 0, edgeWidth: 5, scaleX: 1.15, scaleY: 0.5 }, // ок
  2: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 7, scaleX: 1.25, scaleY: 0.7 }, // ок
  3: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 14, scaleX: 3.25, scaleY: 1.1 }, // ок
  4: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 8, scaleX: 1.5, scaleY: 1.75 }, // ок
  5: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 5, scaleX: 0.8, scaleY: 0.5 }, // ок
  6: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 5, scaleX: 0.9, scaleY: 1.2 }, // ок
  7: { baseRadius: 1.2, textSize: 0, strokeWidth: 0, edgeWidth: 5, scaleX: 0.9, scaleY: 2 }, // ок
  8: { baseRadius: 1.3, textSize: 0, strokeWidth: 0, edgeWidth: 4.2, scaleX: 0.64, scaleY: 3 }, // ок
  9: { baseRadius: 1.0, textSize: 0, strokeWidth: 0, edgeWidth: 6, scaleX: 1.2, scaleY: 1.4 }, // ок
  10: { baseRadius: 2, textSize: 0, strokeWidth: 0, edgeWidth: 5, scaleX: 0.54, scaleY: 1 }, // ок
  11: { baseRadius: 1.0, textSize: 0, strokeWidth: 0, edgeWidth: 9, scaleX: 2.6, scaleY: 2 }, // ок
  12: { baseRadius: 1.0, textSize: 0, strokeWidth: 0, edgeWidth: 3.8, scaleX: 0.62, scaleY: 3 }, // ок
  16: { baseRadius: 1.0, textSize: 0, strokeWidth: 0, edgeWidth: 3.7, scaleX: 0.6, scaleY: 1.1 }, // ок
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
  const getBaseSizes = useCallback(() => {
    return pointSizeConfig[buildingId] || { 
      baseRadius: 1.2, 
      textSize: 2.5, 
      strokeWidth: 0.2, 
      edgeWidth: 0.5, 
      scaleX: 1, 
      scaleY: 1 
    };
  }, [buildingId]);

  const pointsPositions = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>();
    points.forEach(point => {
      let x = point.x_coord ?? 50;
      let y = point.y_coord ?? 50;
      
      if (x > 100 || y > 100) {
        x = (x / planDimensions.width) * 100;
        y = (y / planDimensions.height) * 100;
      }
      
      positions.set(point.id, {
        x: Math.min(Math.max(x, 0), 100),
        y: Math.min(Math.max(y, 0), 100)
      });
    });
    return positions;
  }, [points, planDimensions.width, planDimensions.height]);

  const pointsMap = useMemo(() => {
    return new Map(points.map(p => [p.id, p]));
  }, [points]);

  const edgesWithPositions = useMemo(() => {
    return edges.map(edge => {
      const fromPos = pointsPositions.get(edge.from_point_id);
      const toPos = pointsPositions.get(edge.to_point_id);
      if (!fromPos || !toPos) return null;
      return { edge, from: fromPos, to: toPos };
    }).filter(Boolean);
  }, [edges, pointsPositions]);

  const pathData = useMemo(() => {
    if (pathEdgeIds.size === 0) return null;

    const graph = new Map<number, Map<number, number>>();
    
    edges.forEach(edge => {
      if (pathEdgeIds.has(edge.id)) {
        if (!graph.has(edge.from_point_id)) graph.set(edge.from_point_id, new Map());
        if (!graph.has(edge.to_point_id)) graph.set(edge.to_point_id, new Map());
        
        graph.get(edge.from_point_id)!.set(edge.to_point_id, edge.id);
        graph.get(edge.to_point_id)!.set(edge.from_point_id, edge.id);
      }
    });

    if (graph.size === 0) return null;

    let startNode = currentPointId && graph.has(currentPointId) 
      ? currentPointId 
      : Array.from(graph.entries()).find(([_, neighbors]) => neighbors.size === 1)?.[0] 
        ?? graph.keys().next().value;

    const pathNodes: number[] = [startNode];
    const visitedEdges = new Set<number>();
    let currentNode = startNode;
    let prevNode: number | null = null;

    while (true) {
      const neighbors = graph.get(currentNode);
      if (!neighbors) break;
      
      let nextNode: number | null = null;
      for (const [neighbor, edgeId] of neighbors) {
        if (neighbor !== prevNode && !visitedEdges.has(edgeId)) {
          nextNode = neighbor;
          visitedEdges.add(edgeId);
          break;
        }
      }
      
      if (nextNode === null) break;
      
      pathNodes.push(nextNode);
      prevNode = currentNode;
      currentNode = nextNode;
    }

    if (pathNodes.length < 2) return null;
    
    let pathD = '';
    for (let i = 0; i < pathNodes.length; i++) {
      const pos = pointsPositions.get(pathNodes[i]);
      if (!pos) continue;
      
      if (i === 0) {
        pathD = `M ${pos.x} ${pos.y}`;
      } else {
        pathD += ` L ${pos.x} ${pos.y}`;
      }
    }
    
    return pathD;
  }, [pathEdgeIds, edges, currentPointId, pointsPositions]);

  const visiblePoints = useMemo(() => {
    return points.filter(point => {
      const isInPath = pathPointIds.has(point.id);
      const isCurrent = currentPointId === point.id;
      const isSelected = selectedFromPoint === point.id || selectedToPoint === point.id;
      
      return !(isInPath && !isCurrent && !isSelected);
    });
  }, [points, pathPointIds, currentPointId, selectedFromPoint, selectedToPoint]);

  const getPointStyle = useCallback((point: Point) => {
    const isSelectedFrom = selectedFromPoint === point.id;
    const isSelectedTo = selectedToPoint === point.id;
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
    let stroke = '#000000';

    if (isCurrent) {
      fill = '#ef4444';
      stroke = '#c2410c';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isSelectedFrom) {
      fill = '#676c74';
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
    } else if (isStaircase) {
      fill = '#fb8a18';
      stroke = '#d97706';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isHovered) {
      fill = '#7b818b';
      radiusX = baseConfig.baseRadius * 1.3;
      radiusY = baseConfig.baseRadius * 1.3;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    } else if (isDragged) {
      fill = '#7b818b';
      stroke = '#6d28d9';
      radiusX = baseConfig.baseRadius * 1;
      radiusY = baseConfig.baseRadius * 1;
      strokeWidth = baseConfig.strokeWidth * 1.5;
    }

    // Применяем коэффициенты компенсации искажения
    radiusX = radiusX * baseConfig.scaleX;
    radiusY = radiusY * baseConfig.scaleY;

    const textX = (radiusX + 0.8) * (baseConfig.scaleX);
    const textY = (radiusY - 1.5) * (baseConfig.scaleY);

    return { fill, stroke, radiusX, radiusY, strokeWidth, textX, textY, textSize };
  }, [
    selectedFromPoint, 
    selectedToPoint, 
    currentPointId, 
    hoveredPointId, 
    draggedPointId, 
    getBaseSizes
  ]);

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
      {edgesWithPositions.map((item) => {
        if (!item) return null;
        const { edge, from, to } = item;
        const isInPath = pathEdgeIds.has(edge.id);
        const baseConfig = getBaseSizes();
        const edgeWidth = baseConfig.edgeWidth || 0.5;
        
        return (
          <line
            key={`edge-${edge.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isInPath ? "#9ca3af" : "#9ca3af"}
            strokeWidth={isInPath ? edgeWidth * 1.5 : edgeWidth}
            strokeDasharray={isInPath ? "none" : "2 1"}
            strokeLinecap="round"
            className="floor-map-line"
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        );
      })}



      {visiblePoints.map(point => {
        const pos = pointsPositions.get(point.id);
        if (!pos) return null;
        
        const style = getPointStyle(point);
        if (!style) return null;

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
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />
            {style.textSize > 0 && (
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
            )}
          </g>
        );
      })}
    </svg>
  );
};