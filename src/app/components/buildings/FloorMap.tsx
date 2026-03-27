import React, { useState } from 'react';
import { Point, Edge } from '../../data/navigationUtils';

interface FloorMapProps {
  points: Point[];
  edges: Edge[];
  floorNumber: number;
  selectedFromPoint: number | null;
  selectedToPoint: number | null;
  path: { points: Point[]; edges: Edge[] } | null;
  currentPointId?: number;
  onPointSelect: (pointId: number, type: 'from' | 'to') => void;
  onFloorTransition?: (targetFloor: number, fromPointId?: number) => void;
  allPoints?: Point[];
  allEdges?: Edge[];
}

export const FloorMap = ({ 
  points, 
  edges, 
  floorNumber, 
  selectedFromPoint, 
  selectedToPoint,
  path,
  currentPointId,
  onPointSelect,
  onFloorTransition,
  allPoints = [],
  allEdges = []
}: FloorMapProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState<'from' | 'to'>('from');

  // Находим лестницы на текущем этаже
  const staircases = points.filter(p => p.type === 2 || p.type === 4 || p.type === 6);
  
  // Для каждой лестницы находим, на какие этажи она ведёт
  const getConnectedFloors = (pointId: number): number[] => {
    const connectedFloors: number[] = [];
    
    const connectedEdges = allEdges.filter(e => 
      e.from_point_id === pointId || e.to_point_id === pointId
    );
    
    for (const edge of connectedEdges) {
      const targetPointId = edge.from_point_id === pointId ? edge.to_point_id : edge.from_point_id;
      const targetPoint = allPoints.find(p => p.id === targetPointId);
      
      if (targetPoint && targetPoint.floor_id !== points.find(p => p.id === pointId)?.floor_id) {
        const targetFloor = allPoints.find(p => p.id === targetPointId)?.floor_id;
        if (targetFloor) {
          connectedFloors.push(targetFloor);
        }
      }
    }
    
    return [...new Set(connectedFloors)];
  };

  // Фильтруем точки для текущего этажа
  const floorPoints = points.filter(p => {
    return p.x_coord !== null && p.y_coord !== null;
  });

  // Фильтруем связи, где обе точки на этом этаже и не межэтажные
  const floorEdges = edges.filter(edge => {
    const fromPoint = points.find(p => p.id === edge.from_point_id);
    const toPoint = points.find(p => p.id === edge.to_point_id);
    return fromPoint && toPoint && fromPoint.x_coord && toPoint.x_coord && !edge.floor_transition;
  });

  // Точки, которые входят в найденный путь
  const pathPointIds = path ? new Set(path.points.map(p => p.id)) : new Set<number>();
  const pathEdgeIds = path ? new Set(path.edges.map(e => e.id)) : new Set<number>();

  // Получаем координаты для отображения
  const getPointPosition = (point: Point) => ({
    x: point.x_coord || 50,
    y: point.y_coord || 50
  });

  if (floorPoints.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-gray-400">Нет данных для этого этажа</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Режим выбора */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-1 z-20 flex gap-1">
        <button
          onClick={() => setSelectMode('from')}
          className={`px-3 py-1 text-xs rounded-md transition-all ${
            selectMode === 'from' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🟦 Выбрать начало
        </button>
        <button
          onClick={() => setSelectMode('to')}
          className={`px-3 py-1 text-xs rounded-md transition-all ${
            selectMode === 'to' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🔴 Выбрать конец
        </button>
      </div>

      {/* SVG канвас */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full absolute top-0 left-0"
        style={{ minHeight: '500px' }}
      >
        {/* Рисуем связи */}
        {floorEdges.map(edge => {
          const fromPoint = points.find(p => p.id === edge.from_point_id);
          const toPoint = points.find(p => p.id === edge.to_point_id);
          
          if (!fromPoint?.x_coord || !toPoint?.x_coord) return null;
          
          const from = getPointPosition(fromPoint);
          const to = getPointPosition(toPoint);
          
          const isInPath = pathEdgeIds.has(edge.id);
          
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isInPath ? '#22c55e' : '#9ca3af'}
              strokeWidth={isInPath ? 0.8 : 0.3}
              strokeDasharray={isInPath ? 'none' : '1 0.5'}
              className="transition-all duration-200"
            />
          );
        })}
        
        {/* Рисуем точки */}
        {floorPoints.map(point => {
          const pos = getPointPosition(point);
          const isSelectedFrom = selectedFromPoint === point.id;
          const isSelectedTo = selectedToPoint === point.id;
          const isInPath = pathPointIds.has(point.id);
          const isCurrent = currentPointId === point.id;
          const isHovered = hoveredPoint === point.id;
          const isStaircase = point.type === 2 || point.type === 4 || point.type === 6;
          const connectedFloors = getConnectedFloors(point.id);
          
          let fillColor = '#9ca3af';
          let strokeColor = '#6b7280';
          let radius = 1.5;
          
          if (isCurrent) {
            fillColor = '#f97316';
            strokeColor = '#c2410c';
            radius = 2.8;
          } else if (isSelectedFrom) {
            fillColor = '#3b82f6';
            strokeColor = '#1e40af';
            radius = 2.5;
          } else if (isSelectedTo) {
            fillColor = '#ef4444';
            strokeColor = '#b91c1c';
            radius = 2.5;
          } else if (isInPath) {
            fillColor = '#22c55e';
            strokeColor = '#15803d';
            radius = 2;
          } else if (isStaircase) {
            fillColor = '#f59e0b';
            strokeColor = '#d97706';
            radius = 2;
          } else if (isHovered) {
            fillColor = '#f59e0b';
            radius = 2;
          }
          
          return (
            <g
              key={point.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: isStaircase ? 'pointer' : 'pointer' }}
              onClick={() => {
                if (isStaircase && connectedFloors.length > 0 && onFloorTransition) {
                  if (connectedFloors.length === 1) {
                    onFloorTransition(connectedFloors[0], point.id);
                  }
                } else {
                  onPointSelect(point.id, selectMode);
                }
              }}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                r={radius}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.2"
                className="transition-all duration-150"
              />
              <text
                x="2"
                y="-1"
                fontSize="2"
                fill="#374151"
                className="select-none"
                style={{ pointerEvents: 'none' }}
              >
                {point.name.length > 15 ? point.name.slice(0, 12) + '...' : point.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Подсказка о режиме выбора */}
      <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs z-10">
        {selectMode === 'from' ? '🔵 Режим: выбор начальной точки' : '🔴 Режим: выбор конечной точки'}
      </div>
      
      {/* Подсказка о лестницах */}
      {staircases.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-orange-100 backdrop-blur-sm rounded-lg px-2 py-1 text-xs z-10 text-orange-700">
          🪜 Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
        </div>
      )}
    </div>
  );
};