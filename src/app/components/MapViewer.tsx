/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import mapImage from "./campus-map.png";

// Импорты компонентов
import { BuildingMarker } from './buildings/BuildingMarker';
import { ZoomControls } from './controls/ZoomControls';
import { SearchBar } from './controls/SearchBar';
import { LocationList } from './controls/LocationList';
import { BuildingDetails } from './buildings/BuildingDetails';

// Тип для локации
interface Location {
  id: string;
  name: string;
  category: string;
  top: string;
  left: string;
}

const locations: Location[] = [
  { id: '8', name: 'Корпус № 8', category: 'Химфак', top: '35%', left: '32%' },
  { id: '4', name: 'СДК', category: 'СДК', top: '26%', left: '10%' },
  { id: '5', name: 'Корпус № 5', category: 'Филфак', top: '5%', left: '85%' },
  { id: '1', name: 'Корпус № 1', category: 'Физфак', top: '28%', left: '58%' },
  { id: '12', name: 'Корпус № 12', category: 'Что-то', top: '5%', left: '65%' },
  { id: '10', name: 'Корпус № 10', category: 'Спортклуб', top: '36%', left: '74%' },
  { id: '5', name: 'Корпус № 5', category: 'Филфак', top: '28%', left: '90%' },
  { id: '2', name: 'Корпус № 2', category: 'ИКНТ, Биофак', top: '73%', left: '55%' },
  { id: '3', name: 'Корпус № 3', category: 'Что-то', top: '73%', left: '64%' },
  { id: '9', name: 'Корпус № 9', category: 'Юрфак', top: '65%', left: '83%' },
  { id: '11', name: 'Корпус № 11', category: 'тоже юрфак?', top: '80%', left: '79%' },
  { id: '6', name: 'Корпус № 6', category: 'Химфак', top: '44%', left: '10%' },
  { id: '7', name: 'Корпус № 4', category: 'Колледж', top: '94%', left: '54%' },
];

export function MapViewer() {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationList, setShowLocationList] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<{ id: string; name: string } | null>(null);
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

  // Обработчик клика по корпусу
  const handleBuildingClick = (id: string, name: string) => {
    setSelectedBuilding({ id, name });
  };

  const handleBackToMap = () => {
    setSelectedBuilding(null);
  };

  // Фильтрация и группировка для поиска/списка
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

  // Если выбран корпус — показываем детали
  if (selectedBuilding) {
    return <BuildingDetails building={selectedBuilding} onBack={handleBackToMap} />;
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Слой с картой - низкий z-index */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
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
          {/* Карта */}
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
          
          {/* Маркеры */}
          <div 
            className="absolute top-0 left-0"
            style={{
              width: imageDimensions.width || 'auto',
              height: imageDimensions.height || 'auto',
            }}
          >
            {locations.map((location) => (
              <BuildingMarker
                key={location.id}
                id={location.id}
                name={location.name}
                top={location.top}
                left={location.left}
                onClick={handleBuildingClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}