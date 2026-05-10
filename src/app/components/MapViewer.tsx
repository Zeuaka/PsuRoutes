/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import mapImage from "./campus-map.svg";
import { ClickableBuilding } from './buildings/ClickableBuilding';
import { PlusCircle, ChevronDown, X } from 'lucide-react';

// Импорты компонентов
import { BuildingMarker } from './buildings/BuildingMarker';
import { ZoomControls } from './controls/ZoomControls';
import { SearchBar } from './controls/SearchBar';
import { LocationList } from './controls/LocationList';
import { BuildingDetails } from './buildings/BuildingDetails';
import { CampusSearch } from './buildings/CampusSearch';
import { PointEditor } from './buildings/PointEditor';

// Тип для локации
interface Location {
  id: string;
  name: string;
  category: string;
  top: string;
  left: string;
  svgPath: string;
  width: string;
  height: string;
}

const locations: Location[] = [
  { 
    id: '1', 
    name: 'Корпус № 1', 
    category: 'Физфак', 
    top: '28.45%', 
    left: '53.75%',
    svgPath: '/buildings/1.svg',
    width: '372px',
    height: '372px'
  },
  { 
    id: '2', 
    name: 'Корпус № 2', 
    category: 'ИКНТ, Биофак', 
    top: '68.9%', 
    left: '47.62%',
    svgPath: '/buildings/2.svg',
    width: '206px',
    height: '206px'
  },
  { 
    id: '3', 
    name: 'Корпус № 3', 
    category: 'Что-то', 
    top: '69%', 
    left: '57%',
    svgPath: '/buildings/3.svg',
    width: '147px',
    height: '147px'
  },
  { 
    id: '7', 
    name: 'СДК', 
    category: 'СДК', 
    top: '26.3%', 
    left: '13.2%',
    svgPath: '/buildings/sdk.svg',
    width: '170px',
    height: '170px'
  },
  { 
    id: '5', 
    name: 'Корпус № 5', 
    category: 'Филфак', 
    top: '24.3%', 
    left: '77.1%',
    svgPath: '/buildings/5.svg',
    width: '385px',
    height: '385px'
  },
  { 
    id: '6', 
    name: 'Корпус № 6', 
    category: 'Химфак', 
    top: '42.3%', 
    left: '13.55%',
    svgPath: '/buildings/6.svg',
    width: '185px',
    height: '185px'
  },
  { 
    id: '8', 
    name: 'Корпус № 8', 
    category: 'Химфак', 
    top: '33.85%', 
    left: '33.4%',
    svgPath: '/buildings/8.svg',
    width: '447px',
    height: '447px'
  },
  { 
    id: '9', 
    name: 'Корпус № 9', 
    category: 'Юрфак', 
    top: '64.5%', 
    left: '75%',
    svgPath: '/buildings/9.svg',
    width: '148px',
    height: '148px'
  },
  { 
    id: '10', 
    name: 'Корпус № 10', 
    category: 'Спортклуб', 
    top: '35.7%', 
    left: '65.2%',
    svgPath: '/buildings/10.svg',
    width: '180px',
    height: '180px'
  },
  { 
    id: '11', 
    name: 'Корпус № 11', 
    category: 'тоже юрфак?', 
    top: '75.7%', 
    left: '71%',
    svgPath: '/buildings/11.svg',
    width: '95px',
    height: '95px'
  },
  { 
    id: '12', 
    name: 'Корпус № 12', 
    category: 'Что-то', 
    top: '6.65%', 
    left: '58.8%',
    svgPath: '/buildings/12.svg',
    width: '310px',
    height: '310px'
  },
  { 
    id: '13', 
    name: 'ЕНИ', 
    category: 'ЕНИ', 
    top: '47.72%', 
    left: '56.7%',
    svgPath: '/buildings/eni.svg',
    width: '292px',
    height: '292px'
  },
  { 
    id: '4', 
    name: 'Корпус № 4', 
    category: 'Колледж', 
    top: '89.6%', 
    left: '47.8%',
    svgPath: '/buildings/4.svg',
    width: '110px',
    height: '113px'
  },
];

export function MapViewer() {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationList, setShowLocationList] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<{ id: string; name: string } | null>(null);
  const [showPointEditor, setShowPointEditor] = useState(false);
  const [editorBuilding, setEditorBuilding] = useState<{ id: number; name: string } | null>(null);
  const [showBuildingSelector, setShowBuildingSelector] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Получаем размеры картинки после загрузки
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = mapImage;
  }, []);

  // Обработчики масштабирования
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Обработчики перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset({
      x: dragStart.offsetX + dx,
      y: dragStart.offsetY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const handleBuildingClick = (id: string, name: string) => {
    setSelectedBuilding({ id, name });
  };

  const handleBackToMap = () => {
    setSelectedBuilding(null);
  };

  const handleOpenPointEditor = (buildingId: number, buildingName: string) => {
    setEditorBuilding({ id: buildingId, name: buildingName });
    setShowPointEditor(true);
    setShowBuildingSelector(false);
  };

  const handleClosePointEditor = () => {
    setShowPointEditor(false);
    setEditorBuilding(null);
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLocations = filteredLocations.reduce((acc, location) => {
    if (!acc[location.category]) acc[location.category] = [];
    acc[location.category].push(location);
    return acc;
  }, {} as Record<string, Location[]>);

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  // Если открыт редактор точек
  if (showPointEditor && editorBuilding) {
    return (
      <PointEditor
        buildingId={editorBuilding.id}
        buildingName={editorBuilding.name}
        onBack={handleClosePointEditor}
      />
    );
  }

  if (selectedBuilding) {
    return <BuildingDetails building={selectedBuilding} onBack={handleBackToMap} />;
  }

  const handleBuildingSearchSelect = (buildingId: string, buildingName: string) => {
    const building = locations.find(l => l.id === buildingId);
    if (building) {
      setSelectedBuilding(building);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[rgba(137,144,126)] overflow-hidden">
      <CampusSearch 
        buildings={locations.map(l => ({ id: l.id, name: l.name, category: l.category }))}
        onBuildingSelect={handleBuildingSearchSelect}
      />
      
      {/* Кнопка для выбора корпуса и добавления точек */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Кнопка-триггер */}
        <button
          onClick={() => setShowBuildingSelector(!showBuildingSelector)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <PlusCircle size={20} />
          Добавить точки
          <ChevronDown size={16} className={`transition-transform ${showBuildingSelector ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Выпадающий список корпусов */}
        {showBuildingSelector && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-64 animate-in slide-in-from-bottom-2">
            <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Выберите корпус</span>
              <button
                onClick={() => setShowBuildingSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleOpenPointEditor(parseInt(location.id), location.name)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-800">{location.name}</div>
                    <div className="text-xs text-gray-500">{location.category}</div>
                  </div>
                  <PlusCircle size={16} className="text-purple-500 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing grid place-items-center"
        style={{ zIndex: 1 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: imageDimensions.width || '100%',
            height: imageDimensions.height || '100%',
          }}
        >
          <img
            src={mapImage}
            alt="Карта кампуса ПГНИУ"
            draggable={false}
            className="block"
            style={{
              width: imageDimensions.width || 'auto',
              height: imageDimensions.height || 'auto',
              maxWidth: 'none',
              maxHeight: 'none',
              pointerEvents: 'none',
            }}
          />
          
          <div 
            className="absolute top-0 left-0"
            style={{
              width: imageDimensions.width || '100%',
              height: imageDimensions.height || '100%',
            }}
          >
            {locations.map((location) => (
              <ClickableBuilding
                key={location.id}
                location={location}
                onClick={(id) => {
                  const building = locations.find(l => l.id === id);
                  if (building) {
                    setSelectedBuilding(building);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}