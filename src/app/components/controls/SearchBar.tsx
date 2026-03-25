import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Card } from '../ui/card';

interface Location {
  id: string;
  name: string;
  category: string;
}

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredLocations: Location[];
  onLocationClick: (location: Location) => void;
}

export const SearchBar = ({ searchQuery, onSearchChange, filteredLocations, onLocationClick }: SearchBarProps) => {
  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск корпусов..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/95 backdrop-blur-sm shadow-lg border-gray-200 focus:border-green-500"
        />
      </div>
      {searchQuery && filteredLocations.length > 0 && (
        <Card className="mt-2 p-2 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-sm shadow-lg">
          {filteredLocations.map(location => (
            <div
              key={location.id}
              className="p-2 hover:bg-green-50 rounded cursor-pointer transition-colors"
              onClick={() => onLocationClick(location)}
            >
              <div className="font-medium text-gray-800">{location.name}</div>
              <div className="text-sm text-gray-500">{location.category}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};