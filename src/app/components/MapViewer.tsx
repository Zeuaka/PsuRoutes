/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCcw, List, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

// ВРЕМЕННО используем тестовую картинку
// const mapImage = "https://placehold.co/1200x800/4CAF50/white?text=КАРТА+ПГНИУ";
// РАСКОММЕНТИРУЙТЕ ЭТУ СТРОКУ, КОГДА КАРТИНКА БУДЕТ ГОТОВА:
import mapImage from "./campus-map.png";

interface Location {
  id: string;
  name: string;
  category: string;
}

const locations: Location[] = [
  { id: '1', name: 'Дворец культуры', category: 'Культура' },
  { id: '2', name: 'Географический факультет', category: 'Факультет' },
  { id: '3', name: 'Химический факультет', category: 'Факультет' },
  { id: '4', name: 'Экономический факультет', category: 'Факультет' },
  { id: '5', name: 'Приемная ректора', category: 'Администрация' },
  { id: '6', name: 'Факультет современных иностранных языков и литератур', category: 'Факультет' },
  { id: '7', name: 'Юридический факультет', category: 'Факультет' },
  { id: '8', name: 'Ботанический сад', category: 'Природа' },
  { id: '9', name: 'Экотропа Ботанического сада', category: 'Природа' },
  { id: '10', name: 'ПГНИУ', category: 'Учебное заведение' },
  { id: '11', name: 'Муравейник', category: 'Здание' },
];

export function MapViewer() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationList, setShowLocationList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3);
    setScale(newScale);
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Панель управления */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Card className="p-2 flex flex-col gap-2 bg-white/90 backdrop-blur-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            title="Увеличить"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            title="Уменьшить"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            title="Сбросить"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowLocationList(!showLocationList)}
            title="Список объектов"
          >
            <List className="w-4 h-4" />
          </Button>
        </Card>
      </div>

      {/* Поиск */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск объектов на карте..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90 backdrop-blur-sm shadow-lg"
          />
        </div>
        {searchQuery && filteredLocations.length > 0 && (
          <Card className="mt-2 p-2 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm">
            {filteredLocations.map(location => (
              <div
                key={location.id}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-gray-500">{location.category}</div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Список объектов */}
      {showLocationList && (
        <Card className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col bg-white/95 backdrop-blur-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg">Объекты на карте</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLocationList(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-y-auto p-4 flex-1">
            {Object.entries(
              locations.reduce((acc, location) => {
                if (!acc[location.category]) {
                  acc[location.category] = [];
                }
                acc[location.category].push(location);
                return acc;
              }, {} as Record<string, Location[]>)
            ).map(([category, locs]) => (
              <div key={category} className="mb-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {locs.map(location => (
                    <div
                      key={location.id}
                      className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                    >
                      {location.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Информация о масштабе */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-2 px-4 bg-white/90 backdrop-blur-sm">
          <span className="text-sm font-medium">
            Масштаб: {Math.round(scale * 100)}%
          </span>
        </Card>
      </div>

      {/* Контейнер карты */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <img
            ref={imageRef}
            src={mapImage}
            alt="Карта кампуса ПГНИУ"
            draggable={false}
            className="select-none"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: '8px',
            }}
            onLoad={() => console.log('Карта загружена!')}
            onError={(e) => console.error('Ошибка загрузки карты:', e)}
          />
        </div>
      </div>

      {/* Подсказка */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 max-w-xs bg-white/90 backdrop-blur-sm">
          <p className="text-xs text-gray-600">
            💡 Используйте колесико мыши для масштабирования.<br />
            Перемещайте карту, удерживая левую кнопку мыши.
          </p>
        </Card>
      </div>
    </div>
  );
}