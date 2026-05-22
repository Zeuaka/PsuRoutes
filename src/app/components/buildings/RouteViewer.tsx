import { Route, AlarmClock, Ruler, ArrowLeft, Navigation, ChevronLeft, ChevronRight, Home, Camera, Target, CheckCircle, Search, ArrowDownUp, ChevronDown, FlagTriangleRight, Footprints } from 'lucide-react';
import { Card } from '../ui/card';
import { useState, useEffect } from 'react';
import { FloorMap } from './FloorMap';
import { PanoramaViewer } from './PanoramaViewer';
import { Point, Edge, Floor, Panorama } from '../../data/navigationData';
import './routeViewerStyles.css';

interface RouteViewerProps {
  buildingId: number;
  buildingName: string;
  path: { 
    points: Point[]; 
    edges: Edge[]; 
    totalDistance: number; 
    totalDuration: number;
    edgesDuration?: number[];
  };
  floors: Floor[];
  allPoints: Point[];
  allEdges: Edge[];
  panoramas: Panorama[];
  onBack: () => void;
  onNewRoute: () => void;
}

// Хардкод маппинг точек с панорамами (из PanoramaViewer)
const panoramaPointIds: Set<number> = new Set([
  // Корпус 1 - 1 этаж
  101001, 101006, 101007, 101002, 101008, 101009, 101010, 101011, 101012, 101013,
  101014, 101015, 101016, 101017, 101018,
  // Корпус 1 - 2 этаж
  11312, 102314, 11303, 11219, 11210, 11218, 11211, 11283, 11214, 11293, 11297, 11212,
  // Корпус 1 - 3 этаж
  11338, 11316, 11321, 11390, 11315, 11395, 11314, 11318, 11405, 11317, 11323,
  // Корпус 1 - 4 этаж
  11422, 11488, 11493, 11421, 11420, 11419, 11477, 11425, 11416, 11415, 11417, 11418,
  // Корпус 10
  1001002, 1001004, 1001005, 1001003, 1001006,
]);

// Функция для проверки, является ли точка "важной" для телепортации
function isImportantPoint(point: Point): boolean {
  // Тип 1 - аудитории/холлы/столовые
  const isType1 = point.type === 1;
  // Лестницы (типы 2,4,6)
  const isStaircase = point.type === 2 || point.type === 4 || point.type === 6;
  // Переходы между корпусами (тип 7)
  const isTransition = point.type === 7;
  // Точки с панорамой (из хардкод маппинга)
  const hasPanorama = panoramaPointIds.has(point.id);
  
  return isType1 || isStaircase || isTransition || hasPanorama;
}

// Функция для получения следующей важной точки
function getNextImportantPoint(currentIndex: number, points: Point[]): number {
  for (let i = currentIndex + 1; i < points.length; i++) {
    if (isImportantPoint(points[i])) {
      return i;
    }
  }
  return currentIndex;
}

// Функция для получения предыдущей важной точки
function getPrevImportantPoint(currentIndex: number, points: Point[]): number {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (isImportantPoint(points[i])) {
      return i;
    }
  }
  return currentIndex;
}

export const RouteViewer = ({ 
  buildingId, 
  buildingName, 
  path, 
  floors, 
  allPoints, 
  allEdges, 
  panoramas,
  onBack, 
  onNewRoute 
}: RouteViewerProps) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [showPanorama, setShowPanorama] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<number | undefined>();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'from' | 'to'>('from');
  
  const [mapScale, setMapScale] = useState(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });

  const currentPoint = path.points[currentStep];
  const currentFloorObj = currentPoint ? floors.find(f => f.id === currentPoint.floor_id) : null;
  const hasCurrentPanorama = currentPoint ? panoramaPointIds.has(currentPoint.id) : false;
  const currentBuildingId = currentPoint?.building_id;
  
  const getFloorPlanUrl = () => {
    if (!currentFloorObj) return undefined;
    const floor = floors.find(f => f.id === currentPoint?.floor_id);
    return floor?.floor_plan_url;
  };
  
  const floorPlanUrl = getFloorPlanUrl();
  const routePointIds = new Set(path.points.map(p => p.id));
  
  const getPointsOnCurrentFloor = () => {
    const currentFloorId = currentPoint?.floor_id;
    if (!currentFloorId) return [];
    
    return allPoints.filter(p => 
      p.floor_id === currentFloorId && routePointIds.has(p.id)
    );
  };
  
  const getEdgesOnCurrentFloor = () => {
    const currentFloorId = currentPoint?.floor_id;
    if (!currentFloorId) return [];
    
    return path.edges.filter(edge => {
      const fromPoint = allPoints.find(p => p.id === edge.from_point_id);
      const toPoint = allPoints.find(p => p.id === edge.to_point_id);
      return fromPoint?.floor_id === currentFloorId && toPoint?.floor_id === currentFloorId;
    });
  };
  
  const pointsOnCurrentFloor = getPointsOnCurrentFloor();
  const edgesOnCurrentFloor = getEdgesOnCurrentFloor();

  const enhancedPath = {
    ...path,
    points: path.points.map((point, idx) => ({
      ...point,
      isCurrent: idx === currentStep
    }))
  };

  // Телепортируемся к следующей важной точке
  const goToNextStep = () => {
    const nextImportantIndex = getNextImportantPoint(currentStep, path.points);
    if (nextImportantIndex !== currentStep) {
      setCurrentStep(nextImportantIndex);
      const nextPoint = path.points[nextImportantIndex];
      const nextPointFloor = floors.find(f => f.id === nextPoint.floor_id);
      if (nextPointFloor) {
        setSelectedFloor(nextPointFloor.floor_number);
      }
    }
  };

  // Телепортируемся к предыдущей важной точке
  const goToPrevStep = () => {
    const prevImportantIndex = getPrevImportantPoint(currentStep, path.points);
    if (prevImportantIndex !== currentStep) {
      setCurrentStep(prevImportantIndex);
      const prevPoint = path.points[prevImportantIndex];
      if (prevPoint) {
        const prevPointFloor = floors.find(f => f.id === prevPoint.floor_id);
        if (prevPointFloor) setSelectedFloor(prevPointFloor.floor_number);
      }
    }
  };

  const handleFloorTransition = (targetFloor: number, fromPointId?: number) => {
    setSelectedFloor(targetFloor);
    if (fromPointId) {
      const nextPointOnTargetFloor = allPoints.find(p => {
        if (p.floor_id !== targetFloor) return false;
        const hasConnection = allEdges.some(e => 
          (e.from_point_id === fromPointId && e.to_point_id === p.id) ||
          (e.to_point_id === fromPointId && e.from_point_id === p.id)
        );
        return hasConnection && routePointIds.has(p.id);
      });
      if (nextPointOnTargetFloor) {
        const stepIndex = path.points.findIndex(p => p.id === nextPointOnTargetFloor.id);
        if (stepIndex !== -1) setCurrentStep(stepIndex);
      }
    }
  };

  const handleOpenPanorama = (pointId: number) => {
    setSelectedPointId(pointId);
    setShowPanorama(true);
  };

  const formatTime = (minutes: number) => {
    if (isNaN(minutes) || minutes === undefined) return '0 сек';
    if (minutes < 1) return `${Math.round(minutes * 60)} сек`;
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return secs > 0 ? `${mins} мин ${secs} сек` : `${mins} мин`;
  };

  const searchResults = allPoints.filter(point =>
    routePointIds.has(point.id) &&
    (point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleSearchSelect = (point: Point) => {
    const stepIndex = path.points.findIndex(p => p.id === point.id);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      const pointFloor = floors.find(f => f.id === point.floor_id);
      if (pointFloor) setSelectedFloor(pointFloor.floor_number);
    } else {
      alert('Эта точка не входит в построенный маршрут');
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const openSearch = (target: 'from' | 'to') => {
    setSearchTarget(target);
    setSearchQuery('');
    setShowSearchResults(true);
  };

  if (showPanorama) {
    return (
      <PanoramaViewer
        buildingId={buildingId.toString()}
        buildingName={buildingName}
        pointId={selectedPointId}
        onBack={() => setShowPanorama(false)}
      />
    );
  }

  const displayFloorNumber = currentFloorObj?.floor_number || selectedFloor;

  return (
    <div className="route-viewer-container">
      <div className="route-viewer-header">
        <div className="route-viewer-header-content">
          <button onClick={onBack} className="route-viewer-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="route-viewer-title">
            <h1>{buildingName}</h1>
            <p>Навигация по маршруту</p>
          </div>
        </div>
      </div>

      <div className="route-viewer-main-layout">
        <div className="route-viewer-sidebar">
          <h2 className="route-viewer-route-title">
            <Navigation size={20} className="text-[rgba(167,60,76)]" />
            Информация о маршруте
          </h2>
          
          {currentStep < path.edges.length && path.edges[currentStep] && (
            <div className="route-viewer-direction-card">
              <div className="route-viewer-direction-text">
                <Footprints size={14} className="direction-icon" />
                <span>{path.edges[currentStep].direction_text || 'Продолжайте движение'}</span>
              </div>
              <div className="route-viewer-direction-stats">
                <span className="stat-item">
                  <Ruler size={12} className="stat-icon" />
                  <span>{path.edges[currentStep].distance_meters} м</span>
                </span>
                {path.edgesDuration && path.edgesDuration[currentStep] !== undefined && (
                  <span className="stat-item">
                    <AlarmClock size={12} className="stat-icon" />
                    <span>{formatTime(path.edgesDuration[currentStep])}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="route-viewer-current-point-card">
            <div className="route-viewer-current-point-header">
              <span className="route-viewer-current-point-label">Текущая точка</span>
              <span className="route-viewer-step-badge">Шаг {currentStep + 1} из {path.points.length}</span>
            </div>
            <div className="route-viewer-current-point-name">{currentPoint?.name}</div>
            <div className="route-viewer-current-point-floor">Этаж {currentFloorObj?.floor_number}</div>
            {currentPoint?.description && (
              <div className="route-viewer-current-point-desc">
                {currentPoint.description}
              </div>
            )}
          </div>

          <div className="route-viewer-step-navigation">
            <button 
              onClick={goToPrevStep} 
              disabled={currentStep === 0} 
              className="route-viewer-step-nav-btn"
            >
              <ChevronLeft size={16} />
              Назад
            </button>
            <button 
              onClick={goToNextStep} 
              disabled={currentStep === path.points.length - 1} 
              className="route-viewer-step-nav-btn"
            >
              Вперед
              <ChevronRight size={16} />
            </button>
          </div>

          {hasCurrentPanorama && (
            <button 
              onClick={() => handleOpenPanorama(currentPoint!.id)} 
              className="route-viewer-panorama-btn"
            >
              <Camera size={16} />
              <span>360° панорама этой точки</span>
            </button>
          )}

          <div className="route-viewer-stats">
            <div className="route-viewer-stat-card">
              <div className="route-viewer-stat-label">Всего расстояние</div>
              <div className="route-viewer-stat-value">{path.totalDistance} м</div>
            </div>
            <div className="route-viewer-stat-card">
              <div className="route-viewer-stat-label">Общее время</div>
              <div className="route-viewer-stat-value">{formatTime(path.totalDuration)}</div>
            </div>
          </div>

          <p className="route-viewer-hint">
            <ArrowDownUp /> Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
          </p>

          <div className="route-viewer-floor-info">
            <label className="floor-info-label">Текущий этаж:</label>
            <div className="floor-info-wrapper">
              <div className="floor-info-display">
                <span className="floor-info-number">
                  {displayFloorNumber}
                  {currentBuildingId !== buildingId && (
                    <span className="floor-info-building">(Корпус {currentBuildingId})</span>
                  )}
                </span>
                <span className="floor-info-icon">
                  <ChevronDown size={16} style={{ opacity: 0.5 }} />
                </span>
              </div>
            </div>
            <div className="floor-info-hint">
              Используйте кнопки "Назад/Вперед" для перемещения
            </div>
          </div>
          
          <div className="route-viewer-actions">
            <button onClick={onNewRoute} className="route-viewer-new-route-btn-desktop">
              <Route size={16} />
              Построить новый маршрут
            </button>
          </div>
        </div>

        <div className="route-viewer-map-area">
          <Card className="route-viewer-card">
            <div className="route-viewer-card-inner">
              <div className="route-viewer-map-wrapper">
                <FloorMap
                  points={pointsOnCurrentFloor}
                  edges={edgesOnCurrentFloor}
                  floorNumber={displayFloorNumber}
                  floorPlanUrl={floorPlanUrl}
                  selectedFromPoint={null}
                  selectedToPoint={null}
                  path={enhancedPath}
                  currentPointId={currentPoint?.id}
                  onPointSelect={() => {}}
                  onFloorTransition={handleFloorTransition}
                  allPoints={allPoints}
                  allEdges={allEdges}
                  scale={mapScale}
                  position={mapPosition}
                  onZoomChange={(scale, position) => {
                    setMapScale(scale);
                    setMapPosition(position);
                  }}
                  buildingId={currentBuildingId || buildingId}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showSearchResults && (
        <div className="route-builder-modal-overlay" onClick={() => setShowSearchResults(false)}>
          <div className="route-builder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="route-builder-modal-header">
              <h3 className="route-builder-modal-title">
                {searchTarget === 'from' ? 'Выберите точку маршрута' : 'Выберите точку маршрута'}
              </h3>
              <div className="route-builder-search-container">
                <Search size={16} className="route-builder-search-icon" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="route-builder-search-input"
                  autoFocus
                />
              </div>
            </div>
            <div className="route-builder-modal-results">
              {searchResults.slice(0, 20).map(point => (
                <div
                  key={point.id}
                  className="route-builder-search-result"
                  onClick={() => handleSearchSelect(point)}
                >
                  <div className="route-builder-result-name">{point.name}</div>
                  <div className="route-builder-result-desc">
                    Этаж {floors.find(f => f.id === point.floor_id)?.floor_number || '?'}
                    {point.description && ` • ${point.description}`}
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <div className="route-builder-no-results">Ничего не найдено</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};