// src/app/components/buildings/PointEditor.tsx
import { ArrowLeft, Plus, Save, X, MapPin, Trash2, Copy, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Link, Unlink, Calculator } from 'lucide-react';
import { Card } from '../ui/card';
import { useState, useEffect, useRef } from 'react';
import { FloorMap } from './FloorMap';
import { useBuildingData } from '../../hooks/useBuildingData';
import { Point, PointType, Edge } from '../../data/navigationData';
import './pointEditorStyles.css';

interface PointEditorProps {
  buildingId: number;
  buildingName: string;
  onBack: () => void;
}

interface TempPoint {
  id: number;
  x: number;
  y: number;
  name: string;
  type: PointType;
  description: string;
  floor_number: number;
}

interface TempEdge {
  id: number;
  from_point_id: number;
  to_point_id: number;
  distance_meters: number;
  direction_text: string;
  floor_transition: boolean;
}

// Конфигурация масштаба для разных корпусов (пиксели в метры)
// Рассчитывается как: реальная_ширина_корпуса / ширина_на_плане_в_пикселях
const buildingScaleConfig: Record<number, number> = {
  1: 0.2148,
  2: 0.2148,
  3: 0.2148,
  4: 0.2148,
  5: 0.2148,
  6: 0.2148,
  7: 0.2148,
  8: 0.2148,
  9: 0.2148,
  10: 0.2148,
  11: 0.2148,
  12: 0.2148,
  13: 0.2148,
};

export const PointEditor = ({ buildingId, buildingName, onBack }: PointEditorProps) => {
  const { floors, points: allPoints, edges: allEdges, loading } = useBuildingData(buildingId);
  
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [tempPoints, setTempPoints] = useState<TempPoint[]>([]);
  const [tempEdges, setTempEdges] = useState<TempEdge[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [pointName, setPointName] = useState('');
  const [pointType, setPointType] = useState<PointType>(1);
  const [pointDescription, setPointDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'points' | 'edges'>('points');
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [edgeFromPoint, setEdgeFromPoint] = useState<number | null>(null);
  const [edgeToPoint, setEdgeToPoint] = useState<number | null>(null);
  const [edgeDistance, setEdgeDistance] = useState<number>(5);
  const [edgeDirection, setEdgeDirection] = useState('');
  const [edgeFloorTransition, setEdgeFloorTransition] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [planDimensions, setPlanDimensions] = useState({ width: 400, height: 400 });
  
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const pointsListRef = useRef<HTMLDivElement>(null);
  
  const currentFloor = floors.find(f => f.floor_number === selectedFloor);
  const floorPlanUrl = currentFloor?.floor_plan_url;
  const floorId = currentFloor?.id || 0;
  
  // Загружаем размеры плана
  useEffect(() => {
    if (floorPlanUrl) {
      const img = new Image();
      img.onload = () => {
        setPlanDimensions({ width: img.width, height: img.height });
        console.log(`План этажа ${selectedFloor}: ${img.width} x ${img.height} px`);
      };
      img.src = floorPlanUrl;
    }
  }, [floorPlanUrl, selectedFloor]);
  
  // Получаем коэффициент пересчёта для текущего корпуса
  const getMetersPerPixel = (): number => {
    return buildingScaleConfig[buildingId] || 0.1;
  };
  
  // Функция для расчёта расстояния между двумя точками по их координатам
const calculateDistance = (point1Id: number, point2Id: number): number => {
  // Ищем точки среди всех доступных
  let point1 = allAvailablePoints.find(p => p.id === point1Id);
  let point2 = allAvailablePoints.find(p => p.id === point2Id);
  
  if (!point1 || !point2) return 0;
  
  // Получаем координаты (в процентах)
  let x1 = point1.x_coord !== undefined ? point1.x_coord : point1.x;
  let y1 = point1.y_coord !== undefined ? point1.y_coord : point1.y;
  let x2 = point2.x_coord !== undefined ? point2.x_coord : point2.x;
  let y2 = point2.y_coord !== undefined ? point2.y_coord : point2.y;
  
  // Переводим проценты в пиксели
  const px1 = (x1 / 100) * planDimensions.width;
  const py1 = (y1 / 100) * planDimensions.height;
  const px2 = (x2 / 100) * planDimensions.width;
  const py2 = (y2 / 100) * planDimensions.height;
  
  // Вычисляем евклидово расстояние в пикселях
  const pixelDistance = Math.sqrt(Math.pow(px2 - px1, 2) + Math.pow(py2 - py1, 2));
  
  // Коэффициент пересчёта пикселей в метры
  const metersPerPixel = getMetersPerPixel();
  const meters = pixelDistance * metersPerPixel;
  
  // Округляем до 2 знаков после запятой (сантиметры)
  return Math.round(meters * 100) / 100;
};
  
  // Автоматический расчёт расстояния при выборе точек
  const handleEdgePointsSelect = (fromId: number | null, toId: number | null) => {
    setEdgeFromPoint(fromId);
    setEdgeToPoint(toId);
    
    if (fromId && toId && fromId !== toId) {
      setIsCalculating(true);
      const distance = calculateDistance(fromId, toId);
      setEdgeDistance(distance);
      setIsCalculating(false);
    }
  };
  
  // Получаем точки из БД на текущем этаже
  const existingPointsOnFloor = allPoints.filter(p => p.floor_id === floorId && p.building_id === buildingId);
  
  // Все доступные точки (существующие + временные)
  const allAvailablePoints = [...existingPointsOnFloor, ...tempPoints.map(p => ({
    ...p,
    building_id: buildingId,
    floor_id: floorId,
    is_active: true,
    panorama_id: null,
    x_coord: p.x,
    y_coord: p.y,
  }))];
  
  // Преобразование существующих точек в формат для отображения на карте
  const existingDisplayPoints: Point[] = existingPointsOnFloor.map(p => ({
    id: p.id,
    building_id: p.building_id,
    floor_id: p.floor_id,
    type: p.type,
    name: p.name,
    x_coord: p.x_coord,
    y_coord: p.y_coord,
    description: p.description,
    panorama_id: p.panorama_id,
    is_active: p.is_active,
  }));
  
  // Преобразование временных точек в формат для отображения на карте
  const tempDisplayPoints: Point[] = tempPoints.map(p => ({
    id: p.id,
    building_id: buildingId,
    floor_id: floorId,
    type: p.type,
    name: p.name,
    x_coord: p.x,
    y_coord: p.y,
    description: p.description,
    panorama_id: null,
    is_active: true,
  }));
  
  // Объединяем существующие точки с временными для отображения на карте
  const displayPoints: Point[] = [...existingDisplayPoints, ...tempDisplayPoints];
  
  // Преобразование рёбер для отображения на карте
  const displayEdges: Edge[] = tempEdges.map(e => ({
    id: e.id,
    from_point_id: e.from_point_id,
    to_point_id: e.to_point_id,
    distance_meters: e.distance_meters,
    direction_text: e.direction_text,
    floor_transition: e.floor_transition,
  }));
  
  // Получаем следующие ID для точек
  const getNextPointId = () => {
    const allIds = [...allPoints.map(p => p.id), ...tempPoints.map(p => p.id)];
    const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
    return maxId + 1;
  };
  
  // Получаем следующие ID для рёбер
  const getNextEdgeId = () => {
    const allIds = [...allEdges.map(e => e.id), ...tempEdges.map(e => e.id)];
    const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
    return maxId + 1;
  };
  
  // Получение имени точки по ID
  const getPointNameById = (id: number) => {
    const point = allAvailablePoints.find(p => p.id === id);
    return point?.name || `Точка ${id}`;
  };
  
  // Обработчик клика по карте для добавления точки
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== 'points') return;
    
    const zoomableContent = mapWrapperRef.current?.querySelector('.zoomable-content');
    if (!zoomableContent) {
      alert('Не найден контейнер карты');
      return;
    }
    
    const rect = zoomableContent.getBoundingClientRect();
    
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      return;
    }
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.min(Math.max(x, 0), 100);
    y = Math.min(Math.max(y, 0), 100);
    
    const newPoint: TempPoint = {
      id: getNextPointId(),
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      name: `Новая точка ${tempPoints.length + 1}`,
      type: 1,
      description: '',
      floor_number: selectedFloor,
    };
    
    setTempPoints([newPoint, ...tempPoints]);
    setSelectedPointId(newPoint.id);
    setPointName(newPoint.name);
    setPointType(newPoint.type);
    setPointDescription(newPoint.description);
    
    setTimeout(() => {
      if (pointsListRef.current) {
        pointsListRef.current.scrollTop = 0;
      }
    }, 100);
  };
  
  // Добавление ребра с автоматическим расчётом расстояния
  const addEdge = () => {
    if (!edgeFromPoint || !edgeToPoint) {
      alert('Выберите начальную и конечную точки');
      return;
    }
    
    if (edgeFromPoint === edgeToPoint) {
      alert('Нельзя создать ребро от точки к самой себе');
      return;
    }
    
    const edgeExists = tempEdges.some(e => 
      (e.from_point_id === edgeFromPoint && e.to_point_id === edgeToPoint) ||
      (e.from_point_id === edgeToPoint && e.to_point_id === edgeFromPoint)
    );
    
    if (edgeExists) {
      alert('Такое ребро уже существует');
      return;
    }
    
    const newEdge: TempEdge = {
      id: getNextEdgeId(),
      from_point_id: edgeFromPoint,
      to_point_id: edgeToPoint,
      distance_meters: edgeDistance,
      direction_text: edgeDirection,
      floor_transition: edgeFloorTransition,
    };
    
    setTempEdges([...tempEdges, newEdge]);
    setEdgeFromPoint(null);
    setEdgeToPoint(null);
    setEdgeDistance(5);
    setEdgeDirection('');
    setEdgeFloorTransition(false);
    setShowEdgeForm(false);
  };
  
  // Удаление ребра
  const deleteEdge = (id: number) => {
    setTempEdges(tempEdges.filter(e => e.id !== id));
    if (selectedEdgeId === id) setSelectedEdgeId(null);
  };
  
  // Калибровка координат выбранной точки
  const adjustCoordinate = (axis: 'x' | 'y', direction: 'up' | 'down', step: number = 0.5) => {
    if (!selectedPointId) return;
    
    setTempPoints(prev => prev.map(p => {
      if (p.id !== selectedPointId) return p;
      
      let newX = p.x;
      let newY = p.y;
      
      if (axis === 'x') {
        newX = direction === 'up' ? p.x + step : p.x - step;
        newX = Math.min(Math.max(newX, 0), 100);
      } else {
        newY = direction === 'up' ? p.y + step : p.y - step;
        newY = Math.min(Math.max(newY, 0), 100);
      }
      
      return { ...p, x: Math.round(newX * 100) / 100, y: Math.round(newY * 100) / 100 };
    }));
  };
  
  // Ручной ввод координат
  const handleManualCoordinate = (axis: 'x' | 'y', value: string) => {
    if (!selectedPointId) return;
    
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setTempPoints(prev => prev.map(p => {
      if (p.id !== selectedPointId) return p;
      
      if (axis === 'x') {
        const newX = Math.min(Math.max(numValue, 0), 100);
        return { ...p, x: Math.round(newX * 100) / 100 };
      } else {
        const newY = Math.min(Math.max(numValue, 0), 100);
        return { ...p, y: Math.round(newY * 100) / 100 };
      }
    }));
  };
  
  // Удаление временной точки
  const deletePoint = (id: number) => {
    const isExistingPoint = allPoints.some(p => p.id === id);
    if (isExistingPoint) {
      alert('Нельзя удалить точку из базы данных через этот редактор. Используйте SQL напрямую.');
      return;
    }
    
    setTempPoints(tempPoints.filter(p => p.id !== id));
    setTempEdges(tempEdges.filter(e => e.from_point_id !== id && e.to_point_id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(null);
      setPointName('');
      setPointType(1);
      setPointDescription('');
    }
  };
  
  // Обновление точки
  const updatePoint = () => {
    if (!selectedPointId) return;
    
    const isExistingPoint = allPoints.some(p => p.id === selectedPointId);
    if (isExistingPoint) return;
    
    setTempPoints(tempPoints.map(p => 
      p.id === selectedPointId 
        ? { ...p, name: pointName, type: pointType, description: pointDescription }
        : p
    ));
  };
  
  useEffect(() => {
    updatePoint();
  }, [pointName, pointType, pointDescription, selectedPointId]);
  
  // Генерация SQL для вставки точек
  const generatePointsSQL = () => {
    if (tempPoints.length === 0) return '';
    
    const sqlLines = tempPoints.map(point => {
      const nameEscaped = point.name.replace(/'/g, "''");
      const descEscaped = point.description.replace(/'/g, "''");
      return `(${point.id}, ${buildingId}, ${floorId}, ${point.type}, '${nameEscaped}', ${point.x}, ${point.y}, '${descEscaped}', NULL, true)`;
    });
    
    return `-- ТОЧКИ\nINSERT INTO points (id, building_id, floor_id, type, name, x_coord, y_coord, description, panorama_id, is_active) VALUES \n${sqlLines.join(',\n')}\nON CONFLICT (id) DO NOTHING;`;
  };
  
  // Генерация SQL для вставки рёбер
  const generateEdgesSQL = () => {
    if (tempEdges.length === 0) return '';
    
    const sqlLines = tempEdges.map(edge => {
      const directionEscaped = edge.direction_text.replace(/'/g, "''");
      return `(${edge.id}, ${edge.from_point_id}, ${edge.to_point_id}, ${edge.distance_meters}, '${directionEscaped}', ${edge.floor_transition})`;
    });
    
    return `\n\n-- РЁБРА\nINSERT INTO edges (id, from_point_id, to_point_id, distance_meters, direction_text, floor_transition) VALUES \n${sqlLines.join(',\n')}\nON CONFLICT (id) DO NOTHING;`;
  };
  
  const generateSQL = () => {
    return generatePointsSQL() + generateEdgesSQL();
  };
  
  const handleCopySQL = () => {
    const sql = generateSQL();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const selectedPoint = tempPoints.find(p => p.id === selectedPointId);
  
  if (loading) {
    return (
      <div className="point-editor-spinner">
        <div className="point-editor-spinner-inner">
          <div className="point-editor-spinner-circle"></div>
          <p>Загрузка данных корпуса...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="point-editor-container">
      {/* Шапка */}
      <div className="point-editor-header">
        <div className="point-editor-header-content">
          <button onClick={onBack} className="point-editor-back-btn">
            <ArrowLeft size={20} />
            <span>Назад к карте</span>
          </button>
          <div className="point-editor-title">
            <h1>{buildingName}</h1>
            <p>Режим добавления точек и рёбер</p>
          </div>
          <div className="point-editor-badge">
            <Plus size={16} />
            <span>Кликните на план для добавления точки</span>
          </div>
        </div>
      </div>
      
      <div className="point-editor-main-layout">
        {/* Левая колонка - карта */}
        <div className="point-editor-map-area">
          <Card className="point-editor-card">
            <div className="point-editor-card-inner">
              {/* Переключатель этажей */}
              <div className="point-editor-floor-tabs">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloor(floor.floor_number)}
                    className={`point-editor-floor-btn ${
                      selectedFloor === floor.floor_number
                        ? 'point-editor-floor-btn-active'
                        : 'point-editor-floor-btn-inactive'
                    }`}
                  >
                    {floor.floor_number} этаж
                  </button>
                ))}
              </div>
              
              {/* Карта с возможностью клика */}
              <div 
                className="point-editor-clickable-map"
                ref={mapWrapperRef}
                onClick={handleMapClick}
              >
                <FloorMap
                  points={displayPoints}
                  edges={displayEdges}
                  floorNumber={selectedFloor}
                  floorPlanUrl={floorPlanUrl}
                  selectedFromPoint={null}
                  selectedToPoint={null}
                  path={null}
                  onPointSelect={() => {}}
                  onFloorTransition={setSelectedFloor}
                  allPoints={displayPoints}
                  allEdges={displayEdges}
                  hideControls={true}
                />
                <div className="point-editor-click-hint">
                  <MapPin size={20} />
                  <span>Нажмите на план для добавления точки</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Правая колонка */}
        <div className="point-editor-sidebar">
          {/* Вкладки */}
          <div className="point-editor-tabs">
            <button 
              className={`point-editor-tab ${activeTab === 'points' ? 'active' : ''}`}
              onClick={() => setActiveTab('points')}
            >
              <MapPin size={14} /> Точки ({tempPoints.length + existingPointsOnFloor.length})
            </button>
            <button 
              className={`point-editor-tab ${activeTab === 'edges' ? 'active' : ''}`}
              onClick={() => setActiveTab('edges')}
            >
              <Link size={14} /> Рёбра ({tempEdges.length})
            </button>
          </div>
          
          {/* Вкладка Точки */}
          {activeTab === 'points' && (
            <>
              <div className="point-editor-points-list-scrollable" ref={pointsListRef}>
                {/* Новые точки */}
                {tempPoints.length > 0 && (
                  <div className="point-editor-new-section">
                    <div className="point-editor-section-title">✨ Новые точки</div>
                    {tempPoints.map(point => (
                      <div
                        key={point.id}
                        className={`point-editor-point-item ${selectedPointId === point.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedPointId(point.id);
                          setPointName(point.name);
                          setPointType(point.type);
                          setPointDescription(point.description || '');
                        }}
                      >
                        <div className="point-editor-point-preview">
                          <div className="point-editor-point-color" style={{ backgroundColor: point.type === 1 ? '#22c55e' : point.type === 2 ? '#3b82f6' : point.type === 3 ? '#f59e0b' : point.type === 4 ? '#ef4444' : point.type === 5 ? '#8b5cf6' : point.type === 6 ? '#ec4899' : point.type === 7 ? '#06b6d4' : '#9ca3af' }} />
                          <div className="point-editor-point-info">
                            <div className="point-editor-point-name">{point.name}</div>
                            <div className="point-editor-point-coords">X: {point.x}, Y: {point.y}</div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deletePoint(point.id); }} className="point-editor-delete-btn">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Существующие точки */}
                {existingPointsOnFloor.length > 0 && (
                  <div className="point-editor-existing-section">
                    <div className="point-editor-section-title">📌 Существующие точки</div>
                    {existingPointsOnFloor.map(point => (
                      <div
                        key={point.id}
                        className="point-editor-point-item existing"
                        onClick={() => alert(`Точка из БД:\nID: ${point.id}\nНазвание: ${point.name}\nX: ${point.x_coord}, Y: ${point.y_coord}\nТип: ${point.type}`)}
                      >
                        <div className="point-editor-point-preview">
                          <div className="point-editor-point-color" style={{ backgroundColor: point.type === 1 ? '#22c55e' : point.type === 2 ? '#3b82f6' : point.type === 3 ? '#f59e0b' : point.type === 4 ? '#ef4444' : point.type === 5 ? '#8b5cf6' : point.type === 6 ? '#ec4899' : point.type === 7 ? '#06b6d4' : '#9ca3af' }} />
                          <div className="point-editor-point-info">
                            <div className="point-editor-point-name">{point.name}</div>
                            <div className="point-editor-point-coords">X: {point.x_coord}, Y: {point.y_coord}</div>
                          </div>
                        </div>
                        <div className="point-editor-point-badge">БД</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {tempPoints.length === 0 && existingPointsOnFloor.length === 0 && (
                  <div className="point-editor-empty">
                    <MapPin size={40} />
                    <p>Нет точек на этом этаже</p>
                  </div>
                )}
              </div>
              
              {/* Форма редактирования точки */}
              {selectedPointId && selectedPoint && (
                <div className="point-editor-edit-form">
                  <h3>Редактирование точки</h3>
                  <div className="point-editor-form-group">
                    <label>Название</label>
                    <input type="text" value={pointName} onChange={(e) => setPointName(e.target.value)} className="point-editor-input" />
                  </div>
                  <div className="point-editor-form-group">
                    <label>Тип точки</label>
                    <select value={pointType} onChange={(e) => setPointType(Number(e.target.value) as PointType)} className="point-editor-select">
                      <option value={1}>1 - Аудитория / Столовая / Холл</option>
                      <option value={2}>2 - Центральная лестница</option>
                      <option value={3}>3 - Точка с направлением</option>
                      <option value={4}>4 - Лестница к направлению</option>
                      <option value={5}>5 - Точка с противоположным направлением</option>
                      <option value={6}>6 - Лестница к противоположному направлению</option>
                      <option value={7}>7 - Переход между корпусами</option>
                      <option value={8}>8 - Центральная точка (для поиска)</option>
                    </select>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Описание</label>
                    <textarea value={pointDescription} onChange={(e) => setPointDescription(e.target.value)} className="point-editor-textarea" rows={2} />
                  </div>
                  
                  <div className="point-editor-calibration">
                    <label className="calibration-label">Координаты</label>
                    <div className="calibration-row">
                      <span className="calibration-axis">X:</span>
                      <button onClick={() => adjustCoordinate('x', 'down', 0.5)} className="calib-btn"><ChevronLeft size={16} /></button>
                      <input type="number" value={selectedPoint.x} onChange={(e) => handleManualCoordinate('x', e.target.value)} className="calibration-input" step="0.5" min="0" max="100" />
                      <button onClick={() => adjustCoordinate('x', 'up', 0.5)} className="calib-btn"><ChevronRight size={16} /></button>
                    </div>
                    <div className="calibration-row">
                      <span className="calibration-axis">Y:</span>
                      <button onClick={() => adjustCoordinate('y', 'down', 0.5)} className="calib-btn"><ChevronLeft size={16} /></button>
                      <input type="number" value={selectedPoint.y} onChange={(e) => handleManualCoordinate('y', e.target.value)} className="calibration-input" step="0.5" min="0" max="100" />
                      <button onClick={() => adjustCoordinate('y', 'up', 0.5)} className="calib-btn"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Вкладка Рёбра */}
          {activeTab === 'edges' && (
            <>
              <div className="point-editor-edges-list">
                <div className="point-editor-edges-header">
                  <h3>Добавленные рёбра</h3>
                  <button onClick={() => setShowEdgeForm(!showEdgeForm)} className="point-editor-add-edge-btn">
                    <Link size={14} /> {showEdgeForm ? 'Отмена' : 'Добавить ребро'}
                  </button>
                </div>
                
                {tempEdges.length === 0 ? (
                  <div className="point-editor-empty">
                    <Link size={40} />
                    <p>Нет добавленных рёбер</p>
                  </div>
                ) : (
                  tempEdges.map(edge => (
                    <div key={edge.id} className="point-editor-edge-item">
                      <div className="point-editor-edge-info">
                        <span className="point-editor-edge-connection">{getPointNameById(edge.from_point_id)} → {getPointNameById(edge.to_point_id)}</span>
                        <span className="point-editor-edge-distance">📏 {edge.distance_meters} м</span>
                        {edge.direction_text && <span className="point-editor-edge-direction">🧭 {edge.direction_text}</span>}
                        {edge.floor_transition && <span className="point-editor-edge-transition">🪜 Межэтажный</span>}
                      </div>
                      <button onClick={() => deleteEdge(edge.id)} className="point-editor-delete-btn"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
              
              {showEdgeForm && (
                <div className="point-editor-add-edge-form">
                  <h3>Новое ребро</h3>
                  <div className="point-editor-form-group">
                    <label>Откуда</label>
                    <select 
                      value={edgeFromPoint || ''} 
                      onChange={(e) => handleEdgePointsSelect(Number(e.target.value), edgeToPoint)}
                      className="point-editor-select"
                    >
                      <option value="">Выберите точку</option>
                      {allAvailablePoints.map(point => (
                        <option key={point.id} value={point.id}>{point.name} (ID: {point.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Куда</label>
                    <select 
                      value={edgeToPoint || ''} 
                      onChange={(e) => handleEdgePointsSelect(edgeFromPoint, Number(e.target.value))}
                      className="point-editor-select"
                    >
                      <option value="">Выберите точку</option>
                      {allAvailablePoints.map(point => (
                        <option key={point.id} value={point.id}>{point.name} (ID: {point.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Расстояние (м)</label>
                    <div className="distance-input-wrapper">
                      <input 
                        type="number" 
                        value={edgeDistance} 
                        onChange={(e) => setEdgeDistance(parseFloat(e.target.value))} 
                        className="point-editor-input" 
                        step="0.5" 
                        min="0" 
                      />
                      {isCalculating && (
                        <span className="calculating-spinner">
                          <Calculator size={16} className="animate-spin" />
                        </span>
                      )}
                    </div>
                    {edgeFromPoint && edgeToPoint && edgeFromPoint !== edgeToPoint && (
                      <div className="auto-calc-hint">
                        <Calculator size={12} />
                        <span>Расстояние рассчитано автоматически</span>
                      </div>
                    )}
                  </div>
                  <div className="point-editor-form-group">
                    <label>Текст направления</label>
                    <input type="text" value={edgeDirection} onChange={(e) => setEdgeDirection(e.target.value)} className="point-editor-input" placeholder="Например: К лестнице" />
                  </div>
                  <div className="point-editor-form-group checkbox">
                    <label><input type="checkbox" checked={edgeFloorTransition} onChange={(e) => setEdgeFloorTransition(e.target.checked)} /> Межэтажный переход</label>
                  </div>
                  <button onClick={addEdge} className="point-editor-save-edge-btn"><Plus size={16} /> Добавить ребро</button>
                </div>
              )}
            </>
          )}
          
          {/* SQL вывод */}
          <div className="point-editor-sql-section">
            <div className="point-editor-sql-header">
              <h3>SQL для вставки</h3>
              <button onClick={handleCopySQL} className="point-editor-copy-btn">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Скопировано!' : 'Копировать SQL'}
              </button>
            </div>
            <pre className="point-editor-sql-code">{generateSQL() || '-- Добавьте точки и рёбра'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};