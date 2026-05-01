// src/components/buildings/CampusSearch.tsx
import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';

interface Building {
  id: string;
  name: string;
  category: string;
}

interface CampusSearchProps {
  buildings: Building[];
  onBuildingSelect: (buildingId: string, buildingName: string) => void;
}

export const CampusSearch = ({ buildings, onBuildingSelect }: CampusSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = buildings.filter(building =>
        building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings(buildings);
    }
  }, [searchQuery, buildings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (building: Building) => {
    onBuildingSelect(building.id, building.name);
    setSearchQuery('');
    setIsFocused(false);
  };

  const hasResults = isFocused && filteredBuildings.length > 0;

  return (
    <div ref={searchRef} className="absolute top-4 left-4 z-20 w-80">
      <div className="relative">
        <div className="relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Поиск корпуса..."
            className={`
              w-full pl-9 pr-9 py-2 bg-white border border-[#d1d5db]
              focus:outline-none focus:ring-0 focus:ring-offset-0 
              text-sm
              ${hasResults ? 'rounded-t-lg rounded-b-none' : 'rounded-lg'}
            `}
            style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasResults && (
          <div 
            className={`
              absolute top-full left-0 right-0 bg-white shadow-lg border border-[#d1d5db] border-t-0
              overflow-hidden z-30 rounded-b-lg
              animate-in slide-in-from-top-1 fade-in duration-200
            `}
          >
            <div className="max-h-96 overflow-y-auto py-1">
              {filteredBuildings.map(building => (
                <button
                  key={building.id}
                  onClick={() => handleSelect(building)}
                  className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{building.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{building.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isFocused && filteredBuildings.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-30 animate-in slide-in-from-top-1 fade-in duration-200">
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Нет доступных корпусов'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};