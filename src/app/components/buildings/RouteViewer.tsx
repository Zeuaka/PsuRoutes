import { ArrowLeft, Navigation, ChevronLeft, ChevronRight, Home, Camera } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import { FloorMap } from './FloorMap';
import { PanoramaViewer } from './PanoramaViewer';
import { Point, Edge, Floor, Panorama } from '../../data/navigationData';
import './routeViewerStyles.css';

interface RouteViewerProps {
  buildingId: number;
  buildingName: string;
  path: { points: Point[]; edges: Edge[]; totalDistance: number; totalDuration: number };
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

  const currentPoint = path.points[currentStep];
  const currentFloorObj = currentPoint ? floors.find(f => f.id === currentPoint.floor_id) : null;
  const hasCurrentPanorama = currentPoint ? panoramas.some(p => p.point_id === currentPoint.id) : false;
  
  // Получаем URL плана этажа для текущего этажа
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
    if (minutes < 1) return `${Math.round(minutes * 60)} сек`;
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return secs > 0 ? `${mins} мин ${secs} сек` : `${mins} мин`;
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
      {/* Шапка */}
      <div className="route-viewer-header">
        <div className="route-viewer-header-content">
          <button onClick={onBack} className="route-viewer-back-btn">
            <ArrowLeft size={20} />
            <span>Назад к корпусу</span>
          </button>
          <div className="route-viewer-title">
            <h1>{buildingName}</h1>
            <p>Навигация по маршруту</p>
          </div>
          <div className="route-viewer-step-counter">
            <span>Шаг {currentStep + 1} из {path.points.length}</span>
          </div>
        </div>
      </div>

      {/* Карта */}
      <div className="route-viewer-map-area">
        <Card className="route-viewer-card">
          <div className="route-viewer-card-inner">
            <div className="route-viewer-floor-tabs">
              {floors.map(floor => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor.floor_number)}
                  className={`route-viewer-floor-btn ${
                    selectedFloor === floor.floor_number
                      ? 'route-viewer-floor-btn-active'
                      : 'route-viewer-floor-btn-inactive'
                  }`}
                >
                  {floor.floor_number} этаж
                </button>
              ))}
            </div>
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
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Нижняя панель */}
      <div className="route-viewer-bottom-panel">
        <div className="route-viewer-bottom-content">
          <div className="route-viewer-step-card">
            <div className="route-viewer-step-nav">
              <button onClick={goToPrevStep} disabled={currentStep === 0} className="route-viewer-nav-btn">
                <ChevronLeft size={16} />
              </button>
              <div className="route-viewer-current-point">
                <div className="route-viewer-current-point-label">Текущая точка</div>
                <div className="route-viewer-current-point-name">{currentPoint?.name}</div>
                <div className="route-viewer-current-point-floor">Этаж {currentFloorObj?.floor_number}</div>
              </div>
              <button onClick={goToNextStep} disabled={currentStep === path.points.length - 1} className="route-viewer-nav-btn">
                <ChevronRight size={16} />
              </button>
            </div>
            
            {hasCurrentPanorama && (
              <button onClick={() => handleOpenPanorama(currentPoint!.id)} className="route-viewer-panorama-btn">
                <Camera size={16} />
                <span>360° панорама этой точки</span>
              </button>
            )}
            
            {currentPoint?.description && (
              <div className="route-viewer-point-description">
                📍 {currentPoint.description}
              </div>
            )}
            
            {currentStep < path.edges.length && path.edges[currentStep] && (
              <div className="route-viewer-direction">
                <div className="route-viewer-direction-text">
                  <Navigation size={12} className="inline mr-1" />
                  {path.edges[currentStep].direction_text || 'Продолжайте движение'}
                </div>
                <span className="route-viewer-direction-stats">
                  📏 {path.edges[currentStep].distance_meters} м • ⏱️ {formatTime(path.edges[currentStep].duration_minutes)}
                </span>
              </div>
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
          </div>

          <button onClick={onNewRoute} className="route-viewer-new-route-btn">
            <Home size={16} />
            Построить новый маршрут
          </button>
        </div>
      </div>
    </div>
  );
};