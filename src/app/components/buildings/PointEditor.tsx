// src/app/components/buildings/PointEditor.tsx
import { Ruler, Compass, Waypoints, CirclePlus, ArrowLeft, Plus, Save, X, MapPin, Trash2, Copy, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Link, Unlink, Calculator, ArrowUpDown, Info, Eye, Camera } from 'lucide-react';
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

interface PanoramaData {
  id: number;
  point_id: number;
  image_path: string;
  title: string;
  description: string;
  yaw: number;
  pitch: number;
}

// Конфигурация масштаба для разных корпусов
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
  16: 0.2148,
};

// Функция для генерации ID точки: корпус (2 цифры) + этаж (2 цифры) + порядковый (3 цифры)
const generatePointId = (buildingId: number, floorNumber: number, sequence: number): number => {
  return buildingId * 100000 + floorNumber * 1000 + sequence;
};

// Функция для генерации ID ребра: корпус (2 цифры) + этаж (2 цифры) + порядковый (4 цифры)
const generateEdgeId = (buildingId: number, floorNumber: number, sequence: number): number => {
  return buildingId * 1000000 + floorNumber * 10000 + sequence;
};

// Функция для генерации ID панорамы: корпус (2 цифры) + 99 + порядковый (4 цифры)
const generatePanoramaId = (buildingId: number, sequence: number): number => {
  return buildingId * 1000000 + 990000 + sequence;
};

export const PointEditor = ({ buildingId, buildingName, onBack }: PointEditorProps) => {
  const { floors, points: allPoints, edges: allEdges, loading } = useBuildingData(buildingId);
  
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [tempPoints, setTempPoints] = useState<TempPoint[]>([]);
  const [tempEdges, setTempEdges] = useState<TempEdge[]>([]);
  const [tempPanoramas, setTempPanoramas] = useState<PanoramaData[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const [pointName, setPointName] = useState('');
  const [pointType, setPointType] = useState<PointType>(1);
  const [pointDescription, setPointDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'points' | 'edges' | 'panoramas'>('points');
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [showPanoramaForm, setShowPanoramaForm] = useState(false);
  const [edgeFromPoint, setEdgeFromPoint] = useState<number | null>(null);
  const [edgeToPoint, setEdgeToPoint] = useState<number | null>(null);
  const [edgeDistance, setEdgeDistance] = useState<number>(5);
  const [edgeDirection, setEdgeDirection] = useState('');
  const [edgeFloorTransition, setEdgeFloorTransition] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [planDimensions, setPlanDimensions] = useState({ width: 400, height: 400 });
  const [selectedExistingPoint, setSelectedExistingPoint] = useState<Point | null>(null);
  const [showPointInfo, setShowPointInfo] = useState(false);
  
  // Состояния для формы панорамы
  const [panoramaPointId, setPanoramaPointId] = useState<number | null>(null);
  const [panoramaImagePath, setPanoramaImagePath] = useState('');
  const [panoramaTitle, setPanoramaTitle] = useState('');
  const [panoramaDescription, setPanoramaDescription] = useState('');
  const [panoramaYaw, setPanoramaYaw] = useState(0);
  const [panoramaPitch, setPanoramaPitch] = useState(0);
  
  // Состояние для всех точек переходов из всех корпусов
  const [allTransitionPoints, setAllTransitionPoints] = useState<Point[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  
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
  
  // Загружаем все точки переходов из всех корпусов
  useEffect(() => {
    const fetchAllTransitionPoints = async () => {
      setLoadingTransitions(true);
      try {
        const response = await fetch('http://localhost:5000/api/all-points');
        const allPointsData = await response.json();
        
        // Фильтруем только точки типа 6 (лестница) и 7 (переход между корпусами)
        const transitions = allPointsData.filter((p: Point) => 
          p.type === 6 || p.type === 7
        );
        setAllTransitionPoints(transitions);
        console.log(`Загружено ${transitions.length} точек переходов из всех корпусов`);
      } catch (error) {
        console.error('Ошибка загрузки точек переходов:', error);
      } finally {
        setLoadingTransitions(false);
      }
    };
    
    fetchAllTransitionPoints();
  }, []);
  
  // Получаем коэффициент пересчёта для текущего корпуса
  const getMetersPerPixel = (): number => {
    return buildingScaleConfig[buildingId] || 0.1733;
  };
  
  // Получаем точки из БД на текущем этаже
  const existingPointsOnFloor = allPoints.filter(p => p.floor_id === floorId && p.building_id === buildingId);
  
  // Получаем рёбра из БД на текущем этаже
  const existingEdgesOnFloor = allEdges.filter(e => {
    const fromPoint = allPoints.find(p => p.id === e.from_point_id);
    const toPoint = allPoints.find(p => p.id === e.to_point_id);
    return fromPoint?.floor_id === floorId && toPoint?.floor_id === floorId;
  });
  
  // Получаем существующие ID панорам из точек БД
  const existingPanoramaIds = allPoints
    .filter(p => p.panorama_id !== null && p.building_id === buildingId)
    .map(p => p.panorama_id || 0);
  
  // Получаем следующий порядковый номер для точки
  const getNextPointSequence = (floorNum: number): number => {
    const allPointsInFloor = [
      ...existingPointsOnFloor,
      ...tempPoints.filter(p => p.floor_number === floorNum)
    ];
    
    if (allPointsInFloor.length === 0) return 1;
    
    const maxSequence = Math.max(...allPointsInFloor.map(p => p.id % 1000));
    return maxSequence + 1;
  };
  
  // Получаем следующий порядковый номер для ребра (только для текущего этажа)
  const getNextEdgeSequence = (): number => {
    // Собираем ID существующих рёбер на текущем этаже
    const existingEdgeIds = existingEdgesOnFloor.map(e => e.id);
    // Собираем ID временных рёбер
    const tempEdgeIds = tempEdges.map(e => e.id);
    
    const allIds = [...existingEdgeIds, ...tempEdgeIds];
    
    if (allIds.length === 0) return 1;
    
    // Находим максимальный порядковый номер среди рёбер текущего этажа
    let maxSequence = 0;
    for (const id of allIds) {
      // Извлекаем порядковый номер (последние 4 цифры)
      const sequence = id % 10000;
      if (sequence > maxSequence) maxSequence = sequence;
    }
    
    return maxSequence + 1;
  };
  
  // Получаем следующий порядковый номер для панорамы (с учётом существующих)
  const getNextPanoramaSequence = (): number => {
    const existingIds = existingPanoramaIds;
    const tempIds = tempPanoramas.map(p => p.id);
    const allIds = [...existingIds, ...tempIds];
    
    if (allIds.length === 0) return 1;
    
    const maxId = Math.max(...allIds);
    const maxSequence = maxId % 10000;
    return maxSequence + 1;
  };
  
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
  
  // Все существующие точки из БД во всём здании (не временные)
  const allExistingPointsInBuilding = allPoints.filter(p => p.building_id === buildingId);
  
  // Функция для расчёта расстояния между двумя точками
  const calculateDistance = (point1Id: number, point2Id: number): number => {
    let point1 = allAvailablePoints.find(p => p.id === point1Id);
    let point2 = allAvailablePoints.find(p => p.id === point2Id);
    
    if (!point1 || !point2) return 0;
    
    let x1 = point1.x_coord !== undefined ? point1.x_coord : point1.x;
    let y1 = point1.y_coord !== undefined ? point1.y_coord : point1.y;
    let x2 = point2.x_coord !== undefined ? point2.x_coord : point2.x;
    let y2 = point2.y_coord !== undefined ? point2.y_coord : point2.y;
    
    const px1 = (x1 / 100) * planDimensions.width;
    const py1 = (y1 / 100) * planDimensions.height;
    const px2 = (x2 / 100) * planDimensions.width;
    const py2 = (y2 / 100) * planDimensions.height;
    
    const pixelDistance = Math.sqrt(Math.pow(px2 - px1, 2) + Math.pow(py2 - py1, 2));
    const metersPerPixel = getMetersPerPixel();
    const meters = pixelDistance * metersPerPixel;
    
    return Math.round(meters * 100) / 100;
  };
  
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
  
  // Преобразование существующих рёбер из БД в формат для отображения на карте
  const existingDisplayEdges: Edge[] = existingEdgesOnFloor.map(e => ({
    id: e.id,
    from_point_id: e.from_point_id,
    to_point_id: e.to_point_id,
    distance_meters: e.distance_meters,
    direction_text: e.direction_text,
    floor_transition: e.floor_transition,
  }));
  
  // Преобразование временных рёбер в формат для отображения на карте
  const tempDisplayEdges: Edge[] = tempEdges.map(e => ({
    id: e.id,
    from_point_id: e.from_point_id,
    to_point_id: e.to_point_id,
    distance_meters: e.distance_meters,
    direction_text: e.direction_text,
    floor_transition: e.floor_transition,
  }));
  
  // Объединяем существующие рёбра с временными для отображения на карте
  const displayEdges: Edge[] = [...existingDisplayEdges, ...tempDisplayEdges];
  
  // Получение имени точки по ID
  const getPointNameById = (id: number) => {
    const point = allAvailablePoints.find(p => p.id === id);
    return point?.name || `Точка ${id}`;
  };
  
  // Получение названия точки перехода по ID (из всех корпусов)
  const getTransitionPointNameById = (id: number) => {
    const point = allTransitionPoints.find(p => p.id === id);
    if (!point) return `Точка ${id}`;
    const buildingInfo = point.building_id === buildingId ? '' : ` (корпус ${point.building_id})`;
    return `${point.name}${buildingInfo}`;
  };
  
  // Получение следующего ID для точки
  const getNewPointId = (floorNum: number): number => {
    const nextSeq = getNextPointSequence(floorNum);
    return generatePointId(buildingId, floorNum, nextSeq);
  };
  
  // Получение следующего ID для ребра
  const getNewEdgeId = (): number => {
    const nextSeq = getNextEdgeSequence();
    return generateEdgeId(buildingId, selectedFloor, nextSeq);
  };
  
  // Получение следующего ID для панорамы
  const getNewPanoramaId = (): number => {
    const nextSeq = getNextPanoramaSequence();
    return generatePanoramaId(buildingId, nextSeq);
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
    
    const newId = getNewPointId(selectedFloor);
    const nextSeq = newId % 1000;
    
    const newPoint: TempPoint = {
      id: newId,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      name: `Точка ${nextSeq}`,
      type: 1,
      description: '',
      floor_number: selectedFloor,
    };
    
    setTempPoints([newPoint, ...tempPoints]);
    setSelectedPointId(newPoint.id);
    setPointName(newPoint.name);
    setPointType(newPoint.type);
    setPointDescription(newPoint.description);
    setSelectedExistingPoint(null);
    setShowPointInfo(false);
    
    setTimeout(() => {
      if (pointsListRef.current) {
        pointsListRef.current.scrollTop = 0;
      }
    }, 100);
  };
  
  // Обработчик выбора точки на карте (для просмотра информации)
  const handlePointSelectOnMap = (pointId: number) => {
    const existingPoint = allPoints.find(p => p.id === pointId);
    
    if (existingPoint) {
      setSelectedExistingPoint(existingPoint);
      setShowPointInfo(true);
      setSelectedPointId(null);
    } else {
      const tempPoint = tempPoints.find(p => p.id === pointId);
      if (tempPoint) {
        setSelectedPointId(tempPoint.id);
        setPointName(tempPoint.name);
        setPointType(tempPoint.type);
        setPointDescription(tempPoint.description || '');
        setSelectedExistingPoint(null);
        setShowPointInfo(false);
      }
    }
  };
  
  // Добавление обычного ребра
  const addEdge = () => {
    if (!edgeFromPoint || !edgeToPoint) {
      alert('Выберите начальную и конечную точки');
      return;
    }
    
    if (edgeFromPoint === edgeToPoint) {
      alert('Нельзя создать ребро от точки к самой себе');
      return;
    }
    
    const edgeExists = [...existingEdgesOnFloor, ...tempEdges].some(e => 
      (e.from_point_id === edgeFromPoint && e.to_point_id === edgeToPoint) ||
      (e.from_point_id === edgeToPoint && e.to_point_id === edgeFromPoint)
    );
    
    if (edgeExists) {
      alert('Такое ребро уже существует');
      return;
    }
    
    const newEdge: TempEdge = {
      id: getNewEdgeId(),
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
  
  // Добавление перехода (межэтажная связь) - теперь между любыми корпусами
  const addTransition = () => {
    if (!edgeFromPoint || !edgeToPoint) {
      alert('Выберите начальную и конечную точки перехода');
      return;
    }
    
    if (edgeFromPoint === edgeToPoint) {
      alert('Нельзя создать переход от точки к самой себе');
      return;
    }
    
    // Проверяем, что обе точки являются точками перехода (тип 6 или 7)
    // Используем allTransitionPoints для поиска, так как там точки из всех корпусов
    const fromPoint = allTransitionPoints.find(p => p.id === edgeFromPoint);
    const toPoint = allTransitionPoints.find(p => p.id === edgeToPoint);
    
    if (!fromPoint || !toPoint) {
      alert('Одна из точек не найдена в базе данных переходов');
      return;
    }
    
    if ((fromPoint.type !== 6 && fromPoint.type !== 7) || (toPoint.type !== 6 && toPoint.type !== 7)) {
      alert('Обе точки должны быть типа "Лестница" (тип 6) или "Переход между корпусами" (тип 7)');
      return;
    }
    
    // Проверяем существование перехода (во всех рёбрах, не только текущего этажа)
    const transitionExists = [...allEdges, ...tempEdges].some(e => 
      (e.from_point_id === edgeFromPoint && e.to_point_id === edgeToPoint) ||
      (e.from_point_id === edgeToPoint && e.to_point_id === edgeFromPoint)
    );
    
    if (transitionExists) {
      alert('Такой переход уже существует');
      return;
    }
    
    const newTransition: TempEdge = {
      id: getNewEdgeId(),
      from_point_id: edgeFromPoint,
      to_point_id: edgeToPoint,
      distance_meters: edgeDistance,
      direction_text: edgeDirection,
      floor_transition: true,
    };
    
    setTempEdges([...tempEdges, newTransition]);
    setEdgeFromPoint(null);
    setEdgeToPoint(null);
    setEdgeDistance(5);
    setEdgeDirection('');
    setShowTransitionForm(false);
    
    // Получаем названия корпусов для информативного сообщения
    const fromBuildingId = fromPoint.building_id;
    const toBuildingId = toPoint.building_id;
    const fromBuildingName = fromBuildingId === buildingId ? 'текущий корпус' : `корпус ${fromBuildingId}`;
    const toBuildingName = toBuildingId === buildingId ? 'текущий корпус' : `корпус ${toBuildingId}`;
    
    alert(`Переход создан\n${fromPoint.name} (${fromBuildingName}, этаж ${fromPoint.floor_id}) → ${toPoint.name} (${toBuildingName}, этаж ${toPoint.floor_id})`);
  };
  
  // Добавление панорамы
  const addPanorama = () => {
    if (!panoramaPointId) {
      alert('Выберите точку для панорамы');
      return;
    }
    
    if (!panoramaImagePath) {
      alert('Введите путь к изображению панорамы');
      return;
    }
    
    if (!panoramaTitle) {
      alert('Введите название панорамы');
      return;
    }
    
    const existingPanoramaForPoint = allPoints.some(p => p.id === panoramaPointId && p.panorama_id !== null);
    if (existingPanoramaForPoint) {
      alert('Для этой точки уже существует панорама в базе данных');
      return;
    }
    
    const panoramaExists = tempPanoramas.some(p => p.point_id === panoramaPointId);
    if (panoramaExists) {
      alert('Для этой точки уже добавлена панорама в текущей сессии');
      return;
    }
    
    const newPanorama: PanoramaData = {
      id: getNewPanoramaId(),
      point_id: panoramaPointId,
      image_path: panoramaImagePath,
      title: panoramaTitle,
      description: panoramaDescription,
      yaw: panoramaYaw,
      pitch: panoramaPitch,
    };
    
    setTempPanoramas([...tempPanoramas, newPanorama]);
    
    setPanoramaPointId(null);
    setPanoramaImagePath('');
    setPanoramaTitle('');
    setPanoramaDescription('');
    setPanoramaYaw(0);
    setPanoramaPitch(0);
    setShowPanoramaForm(false);
    
    alert(`Панорама "${panoramaTitle}" добавлена для точки ${getPointNameById(panoramaPointId)}`);
  };
  
  // Удаление панорамы
  const deletePanorama = (id: number) => {
    setTempPanoramas(tempPanoramas.filter(p => p.id !== id));
  };
  
  // Удаление ребра (только временного)
  const deleteEdge = (id: number) => {
    const isExistingEdge = existingEdgesOnFloor.some(e => e.id === id);
    if (isExistingEdge) {
      alert('Нельзя удалить ребро из базы данных через этот редактор. Используйте SQL напрямую.');
      return;
    }
    
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
  
  // Генерация SQL для вставки только новых точек
  const generatePointsSQL = () => {
    if (tempPoints.length === 0) return '';
    
    const sqlLines = tempPoints.map(point => {
      const nameEscaped = point.name.replace(/'/g, "''");
      const descEscaped = point.description.replace(/'/g, "''");
      return `(${point.id}, ${buildingId}, ${floorId}, ${point.type}, '${nameEscaped}', ${point.x}, ${point.y}, '${descEscaped}', NULL, true)`;
    });
    
    return `-- ТОЧКИ\nINSERT INTO points (id, building_id, floor_id, type, name, x_coord, y_coord, description, panorama_id, is_active) VALUES \n${sqlLines.join(',\n')}\nON CONFLICT (id) DO NOTHING;`;
  };
  
  // Генерация SQL для вставки только новых рёбер
  const generateEdgesSQL = () => {
    if (tempEdges.length === 0) return '';
    
    const sqlLines = tempEdges.map(edge => {
      const directionEscaped = edge.direction_text.replace(/'/g, "''");
      return `(${edge.id}, ${edge.from_point_id}, ${edge.to_point_id}, ${edge.distance_meters}, '${directionEscaped}', ${edge.floor_transition})`;
    });
    
    return `\n\n-- РЁБРА\nINSERT INTO edges (id, from_point_id, to_point_id, distance_meters, direction_text, floor_transition) VALUES \n${sqlLines.join(',\n')}\nON CONFLICT (id) DO NOTHING;`;
  };
  
  // Генерация SQL для вставки панорам
  const generatePanoramasSQL = () => {
    if (tempPanoramas.length === 0) return '';
    
    const sqlLines = tempPanoramas.map(panorama => {
      const titleEscaped = panorama.title.replace(/'/g, "''");
      const descEscaped = panorama.description.replace(/'/g, "''");
      const pathEscaped = panorama.image_path.replace(/'/g, "''");
      return `(${panorama.id}, ${panorama.point_id}, '${pathEscaped}', '${titleEscaped}', '${descEscaped}', ${panorama.yaw}, ${panorama.pitch})`;
    });
    
    return `\n\n-- ПАНОРАМЫ\nINSERT INTO panoramas (id, point_id, image_path, title, description, yaw, pitch) VALUES \n${sqlLines.join(',\n')}\nON CONFLICT (id) DO NOTHING;\n\n-- ОБНОВЛЕНИЕ ТОЧЕК (установка panorama_id)\n${tempPanoramas.map(panorama => `UPDATE points SET panorama_id = ${panorama.id} WHERE id = ${panorama.point_id};`).join('\n')}`;
  };
  
  const generateSQL = () => {
    return generatePointsSQL() + generateEdgesSQL() + generatePanoramasSQL();
  };
  
  const handleCopySQL = () => {
    const sql = generateSQL();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const selectedPoint = tempPoints.find(p => p.id === selectedPointId);
  
  // Функция для получения названия типа точки
  const getPointTypeName = (type: number): string => {
    const types: Record<number, string> = {
      1: 'Аудитория / Столовая / Холл',
      2: 'Центральная лестница',
      3: 'Точка с направлением',
      4: 'Лестница к направлению',
      5: 'Точка с противоположным направлением',
      6: 'Лестница к противоположному направлению',
      7: 'Переход между корпусами',
      8: 'Центральная точка (для поиска)',
    };
    return types[type] || 'Неизвестный тип';
  };
  
  // Все точки для выбора панорамы (существующие + временные)
  const allPointsForPanorama = [...allExistingPointsInBuilding, ...tempPoints.map(p => ({
    ...p,
    floor_id: floorId,
    building_id: buildingId,
    is_active: true,
    panorama_id: null,
    x_coord: p.x,
    y_coord: p.y,
  }))];
  
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
          </button>
          <div className="point-editor-title">
            <h1>{buildingName}</h1>
            <p>Режим добавления точек и рёбер</p>
          </div>
        </div>
      </div>
      
      <div className="point-editor-main-layout">
        {/* Левая колонка - карта */}
        <div className="point-editor-map-area">
          <Card className="point-editor-card">
            <div className="point-editor-card-inner">
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
                  onPointSelect={handlePointSelectOnMap}
                  onFloorTransition={setSelectedFloor}
                  allPoints={displayPoints}
                  allEdges={displayEdges}
                  hideControls={true}
                  buildingId={buildingId}
                />
                <div className="point-editor-click-hint">
                  <CirclePlus size={20} />
                  <span>Кликните на план для добавления точки</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Правая колонка */}
        <div className="point-editor-sidebar">
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
              <Link size={14} /> Рёбра ({tempEdges.length + existingEdgesOnFloor.length})
            </button>
            <button 
              className={`point-editor-tab ${activeTab === 'panoramas' ? 'active' : ''}`}
              onClick={() => setActiveTab('panoramas')}
            >
              <Camera size={14} /> Панорамы ({tempPanoramas.length})
            </button>
          </div>
          
          {/* Вкладка Точки */}
          {activeTab === 'points' && (
            <>
              <div className="point-editor-points-list-scrollable" ref={pointsListRef}>
                {tempPoints.length > 0 && (
                  <div className="point-editor-new-section">
                    <div className="point-editor-section-title">Новые точки</div>
                    {tempPoints.map(point => (
                      <div
                        key={point.id}
                        className={`point-editor-point-item ${selectedPointId === point.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedPointId(point.id);
                          setPointName(point.name);
                          setPointType(point.type);
                          setPointDescription(point.description || '');
                          setSelectedExistingPoint(null);
                          setShowPointInfo(false);
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
                
                {existingPointsOnFloor.length > 0 && (
                  <div className="point-editor-existing-section">
                    <div className="point-editor-section-title">Существующие точки</div>
                    {existingPointsOnFloor.map(point => (
                      <div
                        key={point.id}
                        className={`point-editor-point-item existing ${selectedExistingPoint?.id === point.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedExistingPoint(point);
                          setShowPointInfo(true);
                          setSelectedPointId(null);
                        }}
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
              
              {showPointInfo && selectedExistingPoint && (
                <div className="point-editor-info-modal">
                  <div className="point-editor-info-header">
                    <div className="point-editor-info-title">
                      <Info size={16} />
                      <h3>Информация о точке</h3>
                    </div>
                    <button onClick={() => setShowPointInfo(false)} className="point-editor-info-close">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="point-editor-info-content">
                    <div className="point-editor-info-field">
                      <label>ID:</label>
                      <span>{selectedExistingPoint.id}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Название:</label>
                      <span>{selectedExistingPoint.name}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Тип:</label>
                      <span>{getPointTypeName(selectedExistingPoint.type)}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Координаты:</label>
                      <span>X: {selectedExistingPoint.x_coord}, Y: {selectedExistingPoint.y_coord}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Описание:</label>
                      <span>{selectedExistingPoint.description || '—'}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Этаж:</label>
                      <span>{floors.find(f => f.id === selectedExistingPoint.floor_id)?.floor_number || '?'}</span>
                    </div>
                    <div className="point-editor-info-field">
                      <label>Активна:</label>
                      <span>{selectedExistingPoint.is_active ? 'Да' : 'Нет'}</span>
                    </div>
                    {selectedExistingPoint.panorama_id && (
                      <div className="point-editor-info-field">
                        <label>Панорама:</label>
                        <span>ID: {selectedExistingPoint.panorama_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  <div className="point-editor-buttons-group">
                    <button onClick={() => {
                      setShowEdgeForm(!showEdgeForm);
                      setShowTransitionForm(false);
                    }} className="point-editor-add-edge-btn">
                      <Link size={14} /> {showEdgeForm ? 'Отмена' : 'Добавить ребро'}
                    </button>
                    <button onClick={() => {
                      setShowTransitionForm(!showTransitionForm);
                      setShowEdgeForm(false);
                    }} className="point-editor-add-transition-btn">
                      <ArrowUpDown size={14} /> {showTransitionForm ? 'Отмена' : 'Переход'}
                    </button>
                  </div>
                </div>

                {tempEdges.length > 0 && (
                  <div className="point-editor-new-edges-section">
                    <div className="point-editor-section-title">Новые рёбра</div>
                    {tempEdges.map(edge => {
                      const fromPoint = allAvailablePoints.find(p => p.id === edge.from_point_id);
                      const toPoint = allAvailablePoints.find(p => p.id === edge.to_point_id);
                      const isInterFloor = fromPoint?.floor_number !== toPoint?.floor_number;
                      
                      return (
                        <div key={edge.id} className="point-editor-edge-item">
                          <div className="point-editor-edge-info">
                            <span className="point-editor-edge-connection">
                              {getPointNameById(edge.from_point_id)} → {getPointNameById(edge.to_point_id)}
                            </span>
                            <span className="point-editor-edge-distance">
                              <Ruler size={12} className="inline-icon" /> {edge.distance_meters} м
                            </span>
                            {edge.direction_text && (
                              <span className="point-editor-edge-direction">
                                <Compass size={12} className="inline-icon" /> {edge.direction_text}
                              </span>
                            )}
                            {isInterFloor && (
                              <span className="point-editor-edge-transition">
                                <Waypoints size={12} className="inline-icon" /> {fromPoint?.floor_number} → {toPoint?.floor_number} этаж
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEdge(edge.id);
                            }}
                            className="point-editor-delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                      })}
                      </div>
                      )}

                      {existingEdgesOnFloor.length > 0 && (
                        <div className="point-editor-existing-edges-section">
                          <div className="point-editor-section-title">Существующие рёбра</div>
                          {existingEdgesOnFloor.map(edge => (
                            <div key={edge.id} className="point-editor-edge-item existing">
                              <div className="point-editor-edge-info">
                                <span className="point-editor-edge-connection">
                                  {getPointNameById(edge.from_point_id)} → {getPointNameById(edge.to_point_id)}
                                </span>
                                <span className="point-editor-edge-distance">
                                  <Ruler size={12} className="inline-icon" /> {edge.distance_meters} м
                                </span>
                                {edge.direction_text && (
                                  <span className="point-editor-edge-direction">
                                    <Compass size={12} className="inline-icon" /> {edge.direction_text}
                                  </span>
                                )}
                                {edge.floor_transition && (
                                  <span className="point-editor-edge-transition">
                                    <Waypoints size={12} className="inline-icon" /> Межэтажный
                                  </span>
                                )}
                              </div>
                              <div className="point-editor-edge-badge">БД</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {existingEdgesOnFloor.length === 0 && tempEdges.length === 0 && (
                        <div className="point-editor-empty">
                          <Link size={40} />
                          <p>Нет рёбер на этом этаже</p>
                        </div>
                      )}
                    </div>
              
              {/* Форма добавления обычного ребра */}
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
                        <option key={point.id} value={point.id}>
                          {point.name} (ID: {point.id})
                        </option>
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
                        <option key={point.id} value={point.id}>
                          {point.name} (ID: {point.id})
                        </option>
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
              
              {/* Форма добавления перехода (межэтажная связь) */}
              {showTransitionForm && (
                <div className="point-editor-add-edge-form">
                  <h3>Создать переход <span className="text-sm text-gray-400">(между этажами/корпусами)</span></h3>
                  <div className="point-editor-form-group">
                    <label>Откуда (лестница/переход)</label>
                    <select 
                      value={edgeFromPoint || ''} 
                      onChange={(e) => handleEdgePointsSelect(Number(e.target.value), edgeToPoint)}
                      className="point-editor-select"
                    >
                      <option value="">Выберите точку перехода</option>
                      {loadingTransitions ? (
                        <option disabled>Загрузка...</option>
                      ) : (
                        allTransitionPoints.map(point => {
                          const pointFloor = floors.find(f => f.id === point.floor_id);
                          const isCurrentBuilding = point.building_id === buildingId;
                          return (
                            <option key={point.id} value={point.id}>
                              {point.name} (ID: {point.id}) - {isCurrentBuilding ? '' : `Корпус ${point.building_id}, `}этаж {pointFloor?.floor_number || '?'} - Тип: {point.type === 6 ? 'Лестница' : 'Переход'}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {loadingTransitions && <div className="auto-calc-hint">Загрузка точек из всех корпусов...</div>}
                  </div>
                  <div className="point-editor-form-group">
                    <label>Куда (лестница/переход)</label>
                    <select 
                      value={edgeToPoint || ''} 
                      onChange={(e) => handleEdgePointsSelect(edgeFromPoint, Number(e.target.value))}
                      className="point-editor-select"
                    >
                      <option value="">Выберите точку перехода</option>
                      {loadingTransitions ? (
                        <option disabled>Загрузка...</option>
                      ) : (
                        allTransitionPoints.map(point => {
                          const pointFloor = floors.find(f => f.id === point.floor_id);
                          const isCurrentBuilding = point.building_id === buildingId;
                          return (
                            <option key={point.id} value={point.id}>
                              {point.name} (ID: {point.id}) - {isCurrentBuilding ? '' : `Корпус ${point.building_id}, `}этаж {pointFloor?.floor_number || '?'} - Тип: {point.type === 6 ? 'Лестница' : 'Переход'}
                            </option>
                          );
                        })
                      )}
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
                    </div>
                    <div className="auto-calc-hint text-gray-400">
                      <ArrowUpDown size={12} />
                      <span>Переход будет автоматически помечен как межэтажный</span>
                    </div>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Текст направления</label>
                    <input 
                      type="text" 
                      value={edgeDirection} 
                      onChange={(e) => setEdgeDirection(e.target.value)} 
                      className="point-editor-input" 
                      placeholder="Например: Перейти в соседний корпус" 
                    />
                  </div>
                  <button onClick={addTransition} className="point-editor-save-transition-btn">
                    <ArrowUpDown size={16} /> Создать переход
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Вкладка Панорамы */}
          {activeTab === 'panoramas' && (
            <>
              <div className="point-editor-panoramas-list">
                <div className="point-editor-panoramas-header">
                  <button onClick={() => setShowPanoramaForm(!showPanoramaForm)} className="point-editor-add-panorama-btn">
                    <Camera size={14} /> {showPanoramaForm ? 'Отмена' : 'Добавить панораму'}
                  </button>
                </div>
                
                {tempPanoramas.length > 0 && (
                  <div className="point-editor-new-panoramas-section">
                    <div className="point-editor-section-title">Новые панорамы</div>
                    {tempPanoramas.map(panorama => (
                      <div key={panorama.id} className="point-editor-panorama-item">
                        <div className="point-editor-panorama-info">
                          <div className="point-editor-panorama-title">
                            <Camera size={14} />
                            <span>{panorama.title}</span>
                          </div>
                          <div className="point-editor-panorama-details">
                            <span>Точка: {getPointNameById(panorama.point_id)}</span>
                            <span>Путь: {panorama.image_path}</span>
                            {panorama.description && <span>{panorama.description}</span>}
                          </div>
                        </div>
                        <button onClick={() => deletePanorama(panorama.id)} className="point-editor-delete-btn">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {tempPanoramas.length === 0 && (
                  <div className="point-editor-empty">
                    <Camera size={40} />
                    <p>Нет добавленных панорам</p>
                  </div>
                )}
              </div>
              
              {showPanoramaForm && (
                <div className="point-editor-add-panorama-form">
                  <h3>Добавить панораму</h3>
                  <div className="point-editor-form-group">
                    <label>Точка</label>
                    <select 
                      value={panoramaPointId || ''} 
                      onChange={(e) => setPanoramaPointId(Number(e.target.value))}
                      className="point-editor-select"
                    >
                      <option value="">Выберите точку</option>
                      {allPointsForPanorama.map(point => {
                        const pointFloor = floors.find(f => f.id === point.floor_id);
                        const hasExistingPanorama = allPoints.some(p => p.id === point.id && p.panorama_id !== null);
                        const isTemp = tempPoints.some(tp => tp.id === point.id);
                        return (
                          <option key={point.id} value={point.id} disabled={hasExistingPanorama}>
                            {point.name} (ID: {point.id}) - {pointFloor?.floor_number || '?'} этаж 
                            {hasExistingPanorama ? ' [ЕСТЬ ПАНОРАМА]' : ''}
                            {isTemp ? ' [ВРЕМЕННАЯ]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Путь к изображению</label>
                    <input 
                      type="text" 
                      value={panoramaImagePath} 
                      onChange={(e) => setPanoramaImagePath(e.target.value)} 
                      className="point-editor-input" 
                      placeholder="/panoramas/example.jpg"
                    />
                    <div className="auto-calc-hint text-gray-400">
                      <Camera size={12} />
                      <span>Пример: /panoramas/corpus2_hall.jpg</span>
                    </div>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Название панорамы</label>
                    <input 
                      type="text" 
                      value={panoramaTitle} 
                      onChange={(e) => setPanoramaTitle(e.target.value)} 
                      className="point-editor-input" 
                      placeholder="Холл ИКНТ"
                    />
                  </div>
                  <div className="point-editor-form-group">
                    <label>Описание</label>
                    <textarea 
                      value={panoramaDescription} 
                      onChange={(e) => setPanoramaDescription(e.target.value)} 
                      className="point-editor-textarea" 
                      rows={2}
                      placeholder="Главный холл корпуса"
                    />
                  </div>
                  <div className="point-editor-form-group">
                    <label>Начальный угол обзора (yaw)</label>
                    <input 
                      type="number" 
                      value={panoramaYaw} 
                      onChange={(e) => setPanoramaYaw(Number(e.target.value))} 
                      className="point-editor-input" 
                      step="5"
                    />
                    <div className="auto-calc-hint text-gray-500">
                      <span>0-360 градусов</span>
                    </div>
                  </div>
                  <div className="point-editor-form-group">
                    <label>Начальный наклон (pitch)</label>
                    <input 
                      type="number" 
                      value={panoramaPitch} 
                      onChange={(e) => setPanoramaPitch(Number(e.target.value))} 
                      className="point-editor-input" 
                      step="5"
                    />
                    <div className="auto-calc-hint text-gray-500">
                      <span>-90 до 90 градусов (0 - по горизонтали)</span>
                    </div>
                  </div>
                  <button onClick={addPanorama} className="point-editor-save-panorama-btn">
                    <Camera size={16} /> Добавить панораму
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* SQL вывод */}
          <div className="point-editor-sql-section">
            <div className="point-editor-sql-header">
              <h3>SQL для вставки (только новые)</h3>
              <button onClick={handleCopySQL} className="point-editor-copy-btn">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Скопировано!' : 'Копировать SQL'}
              </button>
            </div>
            <pre className="point-editor-sql-code">{generateSQL() || '-- Добавьте точки, рёбра или панорамы'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};