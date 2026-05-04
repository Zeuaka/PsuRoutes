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
  const hasCurrentPanorama = currentPoint ? panoramas.some(p => p.point_id === currentPoint.id) : false;
  
  const floorPlanUrl = currentFloorObj?.floor_plan_url;
  
  const pointsOnCurrentFloor = allPoints.filter(p => {
    const pointFloor = floors.find(f => f.id === p.floor_id);
    return pointFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor);
  });

  const edgesOnCurrentFloor = path.edges.filter(edge => {
    const fromPoint = allPoints.find(p => p.id === edge.from_point_id);
    const toPoint = allPoints.find(p => p.id === edge.to_point_id);
    const fromFloor = fromPoint ? floors.find(f => f.id === fromPoint.floor_id) : null;
    const toFloor = toPoint ? floors.find(f => f.id === toPoint.floor_id) : null;
    return fromFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor) &&
           toFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor);
  });

  const enhancedPath = {
    ...path,
    points: path.points.map((point, idx) => ({
      ...point,
      isCurrent: idx === currentStep
    }))
  };

  const goToNextStep = () => {
    if (currentStep < path.points.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      const nextPoint = path.points[nextStep];
      const nextPointFloor = floors.find(f => f.id === nextPoint.floor_id);
      if (nextPointFloor) setSelectedFloor(nextPointFloor.floor_number);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const prevPoint = path.points[prevStep];
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
        return hasConnection;
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
    point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase()))
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

          <div className="route-viewer-floor-select-sidebar">
            <label className="floor-select-label">Выберите этаж:</label>
            <div className="floor-select-wrapper">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="floor-select-dropdown"
              >
                {floors.map(floor => (
                  <option key={floor.id} value={floor.floor_number}>
                    {floor.floor_number} этаж
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="floor-select-icon" />
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
                  floorNumber={currentFloorObj?.floor_number || selectedFloor}
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
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};