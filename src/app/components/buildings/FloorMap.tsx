import React, { useState, useRef } from 'react';
import { Point, Edge } from '../../data/navigationData';
import { FloorMapCanvas } from './FloorMapCanvas';
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
  floorPlanUrl?: string | null;
  scale?: number;
  position?: { x: number; y: number };
  onZoomChange?: (scale: number, position: { x: number; y: number }) => void;
}

export const FloorMap = ({ 
  points, 
  edges, 
  floorNumber,
  floorPlanUrl,
  selectedFromPoint, 
  selectedToPoint,
  path,
  currentPointId,
  onPointSelect,
  onFloorTransition,
  allPoints = [],
  allEdges = [],
  scale: externalScale = 0.1,
  position: externalPosition = { x: 0, y: 0 },
  onZoomChange
}: FloorMapProps) => {
  const [selectMode, setSelectMode] = useState<'from' | 'to'>('from');
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Используем внешние значения, если они переданы, иначе внутренние
  const [internalScale, setInternalScale] = useState(0.1);
  const [internalPosition, setInternalPosition] = useState({ x: 0, y: 0 });

  const scale = onZoomChange ? externalScale : internalScale;
  const position = onZoomChange ? externalPosition : internalPosition;

  const updateZoom = (newScale: number, newPosition: { x: number; y: number }) => {
    if (onZoomChange) {
      onZoomChange(newScale, newPosition);
    } else {
      setInternalScale(newScale);
      setInternalPosition(newPosition);
    }
  };

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

  const floorPoints = points.filter(p => p.x_coord !== null && p.y_coord !== null);
  const floorEdges = edges.filter(edge => {
    const fromPoint = points.find(p => p.id === edge.from_point_id);
    const toPoint = points.find(p => p.id === edge.to_point_id);
    return fromPoint && toPoint && fromPoint.x_coord && toPoint.x_coord && !edge.floor_transition;
  });

  const pathPointIds = path ? new Set(path.points.map(p => p.id)) : new Set<number>();
  const pathEdgeIds = path ? new Set(path.edges.map(e => e.id)) : new Set<number>();

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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.05), 5);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newX = mouseX - (mouseX - position.x) * (newScale / scale);
      const newY = mouseY - (mouseY - position.y) * (newScale / scale);
      updateZoom(newScale, { x: newX, y: newY });
    } else {
      updateZoom(newScale, position);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateZoom(scale, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    updateZoom(0.1, { x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    updateZoom(Math.min(scale * 1.2, 5), position);
  };

  const handleZoomOut = () => {
    updateZoom(Math.max(scale / 1.2, 0.05), position);
  };

  // Убираем заглушку - всегда показываем карту, даже если нет точек
  return (
    <div className="floor-map-container">
      <div
        ref={containerRef}
        className="zoomable-content"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.75rem',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '100%',
            height: 'auto',
          }}
        >
          {floorPlanUrl && (
            <img
              src={floorPlanUrl}
              alt={`План ${floorNumber} этажа`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* SVG-холст с отрисовкой карты - рендерим даже если нет точек */}
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
        </div>
      </div>

      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-btn" title="Приблизить">+</button>
        <button onClick={handleReset} className="zoom-btn" title="Сбросить">⌂</button>
        <button onClick={handleZoomOut} className="zoom-btn" title="Отдалить">−</button>
      </div>

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

      <div className="floor-map-mode-hint">
        {selectMode === 'from' ? '🔵 Режим: выбор начальной точки' : '🔴 Режим: выбор конечной точки'}
        <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>
          🖱️ Колесико мыши - зум | Зажать ЛКМ - перемещение
        </span>
      </div>

      {points.some(p => p.type === 2 || p.type === 4 || p.type === 6) && (
        <div className="floor-map-staircase-hint">
          🪜 Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
        </div>
      )}
    </div>
  );
};