import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Location {
  id: string;
  name: string;
  category: string;
}

interface LocationListProps {
  isOpen: boolean;
  onClose: () => void;
  groupedLocations: Record<string, Location[]>;
  onLocationClick: (location: Location) => void;
}

export const LocationList = ({ isOpen, onClose, groupedLocations, onLocationClick }: LocationListProps) => {
  if (!isOpen) return null;

  return (
    <Card className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col bg-white/95 backdrop-blur-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Корпуса ПГНИУ</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="overflow-y-auto p-4 flex-1">
        {Object.entries(groupedLocations).map(([category, locs]) => (
          <div key={category} className="mb-4">
            <h3 className="font-medium text-sm text-gray-500 mb-2">{category}</h3>
            <div className="space-y-1">
              {locs.map(location => (
                <div
                  key={location.id}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                  onClick={() => onLocationClick(location)}
                >
                  {location.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};