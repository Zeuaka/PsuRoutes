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
  // ========== КОРПУС 1 ==========
  // 1 этаж
  101001, 101006, 101007, 101002, 101008, 101009, 101010, 101011, 101012, 101013,
  101014, 101015, 101016, 101017, 101018,
  // 2 этаж
  11312, 102314, 11303, 11219, 11210, 11218, 11211, 11283, 11214, 11293, 11297, 11212,
  // 3 этаж
  11338, 11316, 11321, 11390, 11315, 11395, 11314, 11318, 11405, 11317, 11323,
  // 4 этаж
  11422, 11488, 11493, 11421, 11420, 11419, 11477, 11425, 11416, 11415, 11417, 11418,

  // ========== КОРПУС 2 ==========
  // 1 этаж
  200001, 200002, 200003, 200004, 200005, 200006, 200007, 200008, 200009,
  // 2 этаж
  201001, 201002, 201003, 201004, 201005, 201006, 201007, 201008, 201009, 201010,
  201011, 201012, 201013,
  // 3 этаж
  202002, 202003, 202004, 202005, 202006, 202007, 202008, 202009, 202010, 202011,
  // 4 этаж
  203001, 203002, 203003, 203004, 203005, 203006, 203007, 203008, 203009, 203010,
  203011, 203012,
  // 5 этаж
  204016, 204017, 204018, 204019, 204020, 204021, 204011, 204005, 204003, 204002, 204001,

  // ========== КОРПУС 3 ==========
  301001, 301002, 301003, 301004, 301010, 301011,
  302001, 302002, 302003, 302004, 302005,
  303002, 303011, 303021,

  // ========== КОРПУС 4 ==========
  401001, 401002, 401003, 401004, 401005,
  402001, 402002, 402003, 402004, 402011,

  // ========== КОРПУС 6 ==========
  // 1 этаж
  601020, 601021, 601022, 601029, 601033, 601038, 601040, 601042,
  // 2 этаж
  602022, 602029, 602032, 602035, 602040, 602043, 602045, 602047, 602053, 602059,
  // 3 этаж
  603035, 603036, 603042, 603046, 603048, 603052, 603059, 603063, 603066,
  // 4 этаж
  604036, 604037, 604041, 604047, 604053, 604056, 604060, 604066, 604068, 604071,

  // ========== КОРПУС 7 ==========
  // 1 этаж
  72001, 72002, 72003, 72004, 72005, 72006,
  // 2 этаж
  702134, 702136, 702137, 702141, 702142, 702144, 702147, 702153, 72129,
  // 3 этаж
  703007, 703009, 703011, 703012,
  // 4 этаж
  704002, 704004, 704006, 704007,

  // ========== КОРПУС 8 ==========
  // 1 этаж
  801005, 801014, 801021, 801033, 801036, 801044, 801046, 801059,
  // 2 этаж
  802010, 802019, 802022, 802040, 802047, 802055, 802069, 802078,
  // 3 этаж
  803006, 803017, 803025, 803042, 803049, 803057, 803059,
  // 4 этаж
  804006, 804012, 804021, 804039, 804046, 804055, 804057,
  // 5 этаж
  805005, 805013, 805023, 805039, 805046, 805055, 805060, 805076,
  // 6 этаж
  806005, 806014, 806023, 806041, 806047, 806056, 806057, 806075,
  // 7 этаж
  807004, 807009, 807015, 807026, 807030,

  // ========== КОРПУС 9 ==========
  901001, 901002, 901003, 901004, 901005, 901006,
  902001, 902002, 902003,

  // ========== КОРПУС 10 ==========
  1001002, 1001003, 1001004, 1001005, 1001006,
  1002001, 1002002, 1002003, 1002004,
  1003001, 1003002, 1003006, 1003007, 1003008,

  // ========== КОРПУС 11 ==========
  1101007, 1101010, 1101014, 1102001, 1102006, 1102013,

  // ========== КОРПУС 12 ==========
  // 1 этаж
  1201005, 1201006, 1201016, 1201033, 1201040, 1201044,
  // 2 этаж
  1202004, 1202022, 1202030, 1202037, 1202039, 1202044, 1202051, 1202058,
  // 3 этаж
  1203004, 1203035, 1203037, 1203043, 1203050,
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