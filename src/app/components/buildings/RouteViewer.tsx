import { ArrowLeft, Navigation, ChevronLeft, ChevronRight, Home, Camera } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import { FloorMap } from './FloorMap';
import { PanoramaViewer } from './PanoramaViewer';
import { Point, Edge, Floor, Panorama } from '../../data/navigationData';

interface RouteViewerProps {
  buildingId: number;
  buildingName: string;
  path: { points: Point[]; edges: Edge[]; totalDistance: number; totalDuration: number };
  floors: Floor[];           // получаем из родителя
  allPoints: Point[];        // получаем из родителя
  allEdges: Edge[];          // получаем из родителя
  panoramas: Panorama[];     // получаем из родителя
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
  
  // Фильтруем точки для текущего этажа
  const pointsOnCurrentFloor = allPoints.filter(p => {
    const pointFloor = floors.find(f => f.id === p.floor_id);
    return pointFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor);
  });

  // Фильтруем связи для текущего этажа
  const edgesOnCurrentFloor = path.edges.filter(edge => {
    const fromPoint = allPoints.find(p => p.id === edge.from_point_id);
    const toPoint = allPoints.find(p => p.id === edge.to_point_id);
    const fromFloor = fromPoint ? floors.find(f => f.id === fromPoint.floor_id) : null;
    const toFloor = toPoint ? floors.find(f => f.id === toPoint.floor_id) : null;
    return fromFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor) &&
           toFloor?.floor_number === (currentFloorObj?.floor_number || selectedFloor);
  });

  // Создаём путь, где текущая точка подсвечивается особым цветом
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
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к корпусу</span>
          </button>
          <div>
            <h1 className="text-xl font-bold">{buildingName}</h1>
            <p className="text-xs text-green-100">Навигация по маршруту</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-lg">
            <span>Шаг {currentStep + 1} из {path.points.length}</span>
          </div>
        </div>
      </div>

      {/* Карта */}
      <div className="flex-1 min-h-0 p-4">
        <Card className="h-full shadow-md overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex gap-2 p-3 border-b flex-wrap bg-gray-50 flex-shrink-0">
              {floors.map(floor => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor.floor_number)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedFloor === floor.floor_number
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {floor.floor_number} этаж
                </button>
              ))}
            </div>
            <div className="flex-1 relative min-h-0">
              <FloorMap
                points={pointsOnCurrentFloor}
                edges={edgesOnCurrentFloor}
                floorNumber={currentFloorObj?.floor_number || selectedFloor}
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
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto p-4">
          <Card className="p-4 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={goToPrevStep} disabled={currentStep === 0} className="p-2 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center flex-1">
                <div className="text-xs text-gray-500">Текущая точка</div>
                <div className="font-semibold text-gray-800 text-base mt-1">{currentPoint?.name}</div>
                <div className="text-xs text-gray-400">Этаж {currentFloorObj?.floor_number}</div>
              </div>
              <button onClick={goToNextStep} disabled={currentStep === path.points.length - 1} className="p-2 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {hasCurrentPanorama && (
              <button onClick={() => handleOpenPanorama(currentPoint!.id)} className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm">
                <Camera className="w-4 h-4" />
                <span>360° панорама этой точки</span>
              </button>
            )}
            
            {currentPoint?.description && (
              <div className="mt-2 p-2 bg-white rounded-lg text-xs text-gray-600">📍 {currentPoint.description}</div>
            )}
            
            {currentStep < path.edges.length && path.edges[currentStep] && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                <Navigation className="w-3 h-3 inline mr-1" />
                {path.edges[currentStep].direction_text || 'Продолжайте движение'}
                <span className="block text-xs text-blue-500 mt-0.5">
                  📏 {path.edges[currentStep].distance_meters} м • ⏱️ {formatTime(path.edges[currentStep].duration_minutes)}
                </span>
              </div>
            )}
            
            <div className="mt-3 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="p-2 bg-white rounded-lg">
                <div className="text-gray-500 text-xs">Всего расстояние</div>
                <div className="font-semibold text-green-700">{path.totalDistance} м</div>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <div className="text-gray-500 text-xs">Общее время</div>
                <div className="font-semibold text-green-700">{formatTime(path.totalDuration)}</div>
              </div>
            </div>
          </Card>

          <button onClick={onNewRoute} className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Построить новый маршрут
          </button>
        </div>
      </div>
    </div>
  );
};