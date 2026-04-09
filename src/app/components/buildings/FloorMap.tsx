import React, { useState } from 'react';
import { Point, Edge } from '../../data/navigationData';
import { FloorMapCanvas } from './FloorMapCanvas.tsx';
import './floorMapStyles.css';

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
  const [selectMode, setSelectMode] = useState<'from' | 'to'>('from');
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);

  // Логика определения этажей, связанных с точкой-лестницей
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
        if (targetFloor) connectedFloors.push(targetFloor);
      }
    }
    return [...new Set(connectedFloors)];
  };

  // Фильтрация точек текущего этажа
  const floorPoints = points.filter(p => p.x_coord !== null && p.y_coord !== null);
  
  // Фильтрация рёбер текущего этажа
  const floorEdges = edges.filter(edge => {
    const fromPoint = points.find(p => p.id === edge.from_point_id);
    const toPoint = points.find(p => p.id === edge.to_point_id);
    return fromPoint && toPoint && fromPoint.x_coord && toPoint.x_coord && !edge.floor_transition;
  });

  // Множества для быстрой проверки принадлежности к пути
  const pathPointIds = path ? new Set(path.points.map(p => p.id)) : new Set<number>();
  const pathEdgeIds = path ? new Set(path.edges.map(e => e.id)) : new Set<number>();

  // Обработчики
  const handlePointClick = (pointId: number) => {
    const point = points.find(p => p.id === pointId);
    const isStaircase = point?.type === 2 || point?.type === 4 || point?.type === 6;
    const connectedFloors = isStaircase ? getConnectedFloors(pointId) : [];
    
    if (isStaircase && connectedFloors.length > 0 && onFloorTransition) {
      if (connectedFloors.length === 1) {
        onFloorTransition(connectedFloors[0], pointId);
      }
    } else {
      onPointSelect(pointId, selectMode);
    }
  };

  if (floorPoints.length === 0) {
    return (
      <div className="floor-map-container">
        <div className="floor-map-empty">
          <p>Нет данных для этого этажа</p>
        </div>
      </div>
    );
  }

  return (
    <div className="floor-map-container">
      {/* Панель выбора режима */}
      <div className="floor-map-controls">
        <button
          onClick={() => setSelectMode('from')}
          className={`floor-map-control-btn ${
            selectMode === 'from' 
              ? 'floor-map-control-btn-from' 
              : 'floor-map-control-btn-from-inactive'
          }`}
        >
          🟦 Выбрать начало
        </button>
        <button
          onClick={() => setSelectMode('to')}
          className={`floor-map-control-btn ${
            selectMode === 'to' 
              ? 'floor-map-control-btn-to' 
              : 'floor-map-control-btn-to-inactive'
          }`}
        >
          🔴 Выбрать конец
        </button>
      </div>

      {/* SVG-холст с отрисовкой карты */}
      <FloorMapCanvas
        points={floorPoints}
        edges={floorEdges}
        selectedFromPoint={selectedFromPoint}
        selectedToPoint={selectedToPoint}
        currentPointId={currentPointId}
        hoveredPointId={hoveredPointId}
        pathPointIds={pathPointIds}
        pathEdgeIds={pathEdgeIds}
        getConnectedFloors={getConnectedFloors}
        onPointClick={handlePointClick}
        onPointHover={setHoveredPointId}
      />

      {/* Подсказка о режиме выбора */}
      <div className="floor-map-mode-hint">
        {selectMode === 'from' ? '🔵 Режим: выбор начальной точки' : '🔴 Режим: выбор конечной точки'}
      </div>

      {/* Подсказка о лестницах */}
      {points.some(p => p.type === 2 || p.type === 4 || p.type === 6) && (
        <div className="floor-map-staircase-hint">
          🪜 Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
        </div>
      )}
    </div>
  );
};