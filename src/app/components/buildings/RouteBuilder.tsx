import { ArrowLeft, Navigation, Search, Target, CheckCircle, Camera, ChevronDown, Footprints, ArrowDownUp} from 'lucide-react';
import { Card } from '../ui/card';
import { useState, useEffect } from 'react';
import { PanoramaViewer } from './PanoramaViewer';
import { FloorMap } from './FloorMap';
import { RouteViewer } from './RouteViewer';
import { useBuildingData } from '../../hooks/useBuildingData';
import { fetchAllPoints } from '../../data/navigationApi';  // ← добавить импорт
import { findShortestPath, PathResult } from '../../data/navigationUtils';
import { Point } from '../../data/navigationData';
import './routeBuilderStyles.css';

interface RouteBuilderProps {
  buildingId: number;
  buildingName: string;
  onBack: () => void;
}

export const RouteBuilder = ({ buildingId, buildingName, onBack }: RouteBuilderProps) => {
  const { floors, points: allPoints, edges: allEdges, panoramas, loading, refreshData } = useBuildingData(buildingId);

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
  
  // Состояние для зума карты
  const [mapScale, setMapScale] = useState(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });

  // Состояние для режима редактирования
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPoints, setLocalPoints] = useState<Point[]>([]);
  
  // Все точки из всех зданий (для поиска "Куда")
  const [allBuildingsPoints, setAllBuildingsPoints] = useState<Point[]>([]);
  const [loadingAllPoints, setLoadingAllPoints] = useState(false);

  // Загружаем все точки для "Куда"
  useEffect(() => {
    const loadAllPoints = async () => {
      setLoadingAllPoints(true);
      try {
        const points = await fetchAllPoints();
        setAllBuildingsPoints(points);
      } catch (error) {
        console.error('Ошибка загрузки всех точек:', error);
      } finally {
        setLoadingAllPoints(false);
      }
    };
    loadAllPoints();
  }, []);

  // Синхронизируем localPoints с allPoints при загрузке
  useEffect(() => {
    setLocalPoints(allPoints);
  }, [allPoints]);

  const hasPanorama = panoramas.length > 0;
  
  // Результаты поиска в зависимости от цели
  const searchResults = searchTarget === 'from' 
  ? localPoints.filter(point =>
      (point.type === 1 || point.type === 8) &&  // ← только типы 1 и 8
      (point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase())))
    )
  : allBuildingsPoints.filter(point =>
      (point.type === 1 || point.type === 8) &&  // ← только типы 1 и 8
      (point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase())))
    );

  // Функция для получения названия здания для точки (для "Куда")
  const getPointBuildingInfo = (point: Point) => {
    if (searchTarget === 'to' && (point as any).building_name) {
      return `${(point as any).building_name}`;
    }
    return `Корпус ${point.building_id}`;
  };

  const handleFloorTransition = (targetFloor: number) => {
    setSelectedFloor(targetFloor);
  };

  const handleSearchSelect = (point: Point) => {
    if (searchTarget === 'from') {
      setSelectedFromPoint(point.id);
    } else {
      setSelectedToPoint(point.id);
      // Если выбранная точка из другого здания, показываем уведомление
      if (point.building_id !== buildingId) {
        console.log(`Выбрана точка из корпуса ${point.building_id}`);
      }
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handlePointSelect = (pointId: number, type: 'from' | 'to') => {
    if (type === 'from') setSelectedFromPoint(pointId);
    else setSelectedToPoint(pointId);
  };

  const handleFindPath = () => {
    if (selectedFromPoint && selectedToPoint && localPoints.length && allEdges.length) {
      const result = findShortestPath(localPoints, allEdges, selectedFromPoint, selectedToPoint);
      if (result) {
        setPathResult(result);
        setShowRouteViewer(true);
      } else {
        alert('Путь не найден. Возможно, конечная точка находится в другом корпусе.');
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
    const point = localPoints.find(p => p.id === pointId);
    return point?.name || null;
  };

  const handleOpenPanorama = (pointId?: number) => {
    setSelectedPointId(pointId);
    setShowPanorama(true);
  };

  // Функция для сохранения изменений координат в БД
  const savePointCoordinates = async (pointId: number, x: number, y: number) => {
    try {
      console.log('Сохраняем точку:', pointId, 'координаты:', x, y);
      
      const response = await fetch(`http://localhost:5000/api/points/${pointId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x_coord: x, y_coord: y })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Координаты сохранены в БД');
        setLocalPoints(prev => prev.map(p => 
          p.id === pointId ? { ...p, x_coord: x, y_coord: y } : p
        ));
      } else {
        console.error('❌ Ошибка сохранения:', data.error);
        alert('Ошибка сохранения координат: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  const handlePointDrag = (pointId: number, x: number, y: number) => {
    if (isEditMode) {
      setLocalPoints(prev => prev.map(p => 
        p.id === pointId ? { ...p, x_coord: x, y_coord: y } : p
      ));
    }
  };

  const currentFloor = floors.find(f => f.floor_number === selectedFloor);
  const floorPlanUrl = currentFloor?.floor_plan_url;

  if (loading || loadingAllPoints) {
    return (
      <div className="route-builder-spinner">
        <div className="route-builder-spinner-inner">
          <div className="route-builder-spinner-circle"></div>
          <p className="route-builder-spinner-text">Загрузка данных корпуса...</p>
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
        floors={floors}
        allPoints={localPoints}
        allEdges={allEdges}
        panoramas={panoramas}
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
    <div className="route-builder-container">
      <div className="route-builder-control-buttons">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`edit-mode-btn ${isEditMode ? 'edit-mode-active' : 'edit-mode-inactive'}`}
        >
          {isEditMode ? '✏️ Режим редактирования' : '👁️ Режим просмотра'}
        </button>
        <button
          onClick={() => refreshData()}
          className="refresh-btn"
        >
          🔄 Обновить данные
        </button>
      </div>

      <div className="route-builder-header">
        <div className="route-builder-header-content">
          <button onClick={onBack} className="route-builder-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="route-builder-title">
            <h1>{buildingName}</h1>
            <p>Построение маршрута</p>
          </div>
        </div>
      </div>

      <div className="route-builder-main-layout">
        <div className="route-builder-sidebar">
          <h2 className="route-builder-route-title">
            <Navigation size={20} className="text-[rgba(167,60,76)]" />
            Построить маршрут
          </h2>

          <div className="route-builder-points-grid">
            <div className="route-builder-point-block">
              <label className="route-builder-point-label">
                <Target size={16} className="text-[#696969]" />
                Откуда
              </label>
              <div
                className={`route-builder-point-selector ${
                  selectedFromPoint ? 'route-builder-point-selector-from' : ''
                }`}
                onClick={() => openSearch('from')}
              >
                {selectedFromPoint ? (
                  <div className="route-builder-point-selected">
                    <span className="route-builder-point-selected-from">
                      {getPointName(selectedFromPoint)}
                    </span>
                    <CheckCircle size={16} className="route-builder-point-check" />
                  </div>
                ) : (
                  <span className="route-builder-point-placeholder">Нажмите для выбора точки</span>
                )}
              </div>
            </div>

            <div className="route-builder-point-block">
              <label className="route-builder-point-label">
                <Target size={16} className="text-[rgba(167,60,76)]" />
                Куда
              </label>
              <div
                className={`route-builder-point-selector ${
                  selectedToPoint ? 'route-builder-point-selector-to' : ''
                }`}
                onClick={() => openSearch('to')}
              >
                {selectedToPoint ? (
                  <div className="route-builder-point-selected">
                    <span className="route-builder-point-selected-to">
                      {getPointName(selectedToPoint)}
                    </span>
                    <CheckCircle size={16} className="route-builder-point-check" />
                  </div>
                ) : (
                  <span className="route-builder-point-placeholder">Нажмите для выбора точки</span>
                )}
              </div>
            </div>
          </div>

          <div className="route-builder-actions">
            <button
              onClick={handleFindPath}
              disabled={!selectedFromPoint || !selectedToPoint}
              className="route-builder-build-btn"
            >
              Построить маршрут
            </button>
            <button onClick={handleResetPath} className="route-builder-reset-btn">
              Сбросить
            </button>
          </div>

          <p className="route-builder-hint">
            <ArrowDownUp/> Оранжевые точки — лестницы. Нажмите для перехода на другой этаж
          </p>

          <div className="route-builder-floor-select-sidebar">
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
        </div>

        <div className="route-builder-map-area">
          <Card className="route-builder-card">
            <div className="route-builder-card-inner">
              <div className="route-builder-map-wrapper">
                <FloorMap
                  points={localPoints.filter(p => {
                    const pf = floors.find(f => f.id === p.floor_id);
                    return pf?.floor_number === selectedFloor;
                  })}
                  edges={[]}
                  floorNumber={selectedFloor}
                  floorPlanUrl={floorPlanUrl}
                  selectedFromPoint={selectedFromPoint}
                  selectedToPoint={selectedToPoint}
                  path={null}
                  onPointSelect={handlePointSelect}
                  onFloorTransition={handleFloorTransition}
                  allPoints={localPoints}
                  allEdges={allEdges}
                  scale={mapScale}
                  position={mapPosition}
                  onZoomChange={(scale, position) => {
                    setMapScale(scale);
                    setMapPosition(position);
                  }}
                  isEditMode={isEditMode}
                  onPointDrag={handlePointDrag}
                  onPointSave={savePointCoordinates}
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
                {searchTarget === 'from' ? 'Выберите начальную точку' : 'Выберите конечную точку'}
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
                    {searchTarget === 'to' && point.building_id !== buildingId && (
                      <span className="text-blue-500 font-medium">
                        🏛️ {getPointBuildingInfo(point)} • 
                      </span>
                    )}
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