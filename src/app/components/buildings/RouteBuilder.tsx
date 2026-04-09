// src/components/buildings/RouteBuilder.tsx
import { ArrowLeft, Navigation, Search, Target, CheckCircle, Camera } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import { PanoramaViewer } from './PanoramaViewer';
import { FloorMap } from './FloorMap';
import { RouteViewer } from './RouteViewer';
import { useBuildingData } from '../../hooks/useBuildingData';
import { findShortestPath, PathResult } from '../../data/navigationUtils';
import { Point } from '../../data/navigationData';

interface RouteBuilderProps {
  buildingId: number;
  buildingName: string;
  onBack: () => void;
}

export const RouteBuilder = ({ buildingId, buildingName, onBack }: RouteBuilderProps) => {
  const { floors, points: allPoints, edges: allEdges, panoramas, loading } = useBuildingData(buildingId);

  const [showPanorama, setShowPanorama] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<number | undefined>();
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedFromPoint, setSelectedFromPoint] = useState<number | null>(null);
  const [selectedToPoint, setSelectedToPoint] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'from' | 'to'>('from');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [showRouteViewer, setShowRouteViewer] = useState(false);

  const hasPanorama = panoramas.length > 0;
  const searchResults = allPoints.filter(point =>
    point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFloorTransition = (targetFloor: number) => {
    setSelectedFloor(targetFloor);
  };

  const handleSearchSelect = (point: Point) => {
    if (searchTarget === 'from') {
      setSelectedFromPoint(point.id);
    } else {
      setSelectedToPoint(point.id);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handlePointSelect = (pointId: number, type: 'from' | 'to') => {
    if (type === 'from') setSelectedFromPoint(pointId);
    else setSelectedToPoint(pointId);
  };

  const handleFindPath = () => {
    if (selectedFromPoint && selectedToPoint && allPoints.length && allEdges.length) {
      const result = findShortestPath(allPoints, allEdges, selectedFromPoint, selectedToPoint);
      if (result) {
        setPathResult(result);
        setShowRouteViewer(true);
      } else {
        alert('Путь не найден');
      }
    }
  };

  const handleResetPath = () => {
    setSelectedFromPoint(null);
    setSelectedToPoint(null);
    setPathResult(null);
  };

  const openSearch = (target: 'from' | 'to') => {
    setSearchTarget(target);
    setSearchQuery('');
    setShowSearchResults(true);
  };

  const getPointName = (pointId: number | null) => {
    if (!pointId) return null;
    const point = allPoints.find(p => p.id === pointId);
    return point?.name || null;
  };

  const handleOpenPanorama = (pointId?: number) => {
    setSelectedPointId(pointId);
    setShowPanorama(true);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных корпуса...</p>
        </div>
      </div>
    );
  }

  if (showRouteViewer && pathResult) {
    return (
      <RouteViewer
        buildingId={buildingId}
        buildingName={buildingName}
        path={pathResult}
        onBack={() => setShowRouteViewer(false)}
        onNewRoute={() => {
          setShowRouteViewer(false);
          handleResetPath();
        }}
      />
    );
  }

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
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к корпусу</span>
          </button>
          <div>
            <h1 className="text-xl font-bold">{buildingName}</h1>
            <p className="text-xs text-green-100">Построение маршрута</p>
          </div>
        </div>
      </div>

      {/* Карта */}
      <div className="flex-1 min-h-0 p-4">
        <Card className="h-full shadow-md overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Переключатель этажей */}
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

            {/* Карта */}
            <div className="flex-1 relative min-h-0">
              <FloorMap
                points={allPoints.filter(p => {
                  const pf = floors.find(f => f.id === p.floor_id);
                  return pf?.floor_number === selectedFloor;
                })}
                edges={[]}
                floorNumber={selectedFloor}
                selectedFromPoint={selectedFromPoint}
                selectedToPoint={selectedToPoint}
                path={null}
                onPointSelect={handlePointSelect}
                onFloorTransition={handleFloorTransition}
                allPoints={allPoints}
                allEdges={allEdges}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Нижняя панель с выбором маршрута */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto p-4">
          {/* Кнопка 360° панорамы */}
          {hasPanorama && (
            <button
              onClick={() => handleOpenPanorama()}
              className="w-full mb-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-3 shadow-lg transition-all transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                <span className="font-semibold">360° виртуальный тур</span>
                <span className="text-xl">→</span>
              </div>
            </button>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-green-600" />
            Построить маршрут
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Откуда */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Откуда
              </label>
              <div
                className="p-2 border rounded-lg bg-white cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => openSearch('from')}
              >
                {selectedFromPoint ? (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">{getPointName(selectedFromPoint)}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ) : (
                  <span className="text-gray-400">Нажмите для выбора точки</span>
                )}
              </div>
              {selectedFromPoint && (
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Начальная точка выбрана
                </div>
              )}
            </div>

            {/* Куда */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                Куда
              </label>
              <div
                className="p-2 border rounded-lg bg-white cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => openSearch('to')}
              >
                {selectedToPoint ? (
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">{getPointName(selectedToPoint)}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ) : (
                  <span className="text-gray-400">Нажмите для выбора точки</span>
                )}
              </div>
              {selectedToPoint && (
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Конечная точка выбрана
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFindPath}
              disabled={!selectedFromPoint || !selectedToPoint}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Построить маршрут
            </button>
            <button
              onClick={handleResetPath}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Сбросить
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            💡 Выберите режим (начало/конец) в правом верхнем углу схемы и нажмите на точку<br />
            🪜 Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
          </p>
        </div>
      </div>

      {/* Модальное окно поиска */}
      {showSearchResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSearchResults(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">
                {searchTarget === 'from' ? 'Выберите начальную точку' : 'Выберите конечную точку'}
              </h3>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-auto max-h-[60vh] p-2">
              {searchResults.slice(0, 20).map(point => (
                <div
                  key={point.id}
                  className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => handleSearchSelect(point)}
                >
                  <div className="font-medium text-gray-800">{point.name}</div>
                  <div className="text-xs text-gray-500">
                    Этаж {floors.find(f => f.id === point.floor_id)?.floor_number}
                    {point.description && ` • ${point.description}`}
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <div className="p-4 text-center text-gray-500">Ничего не найдено</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};