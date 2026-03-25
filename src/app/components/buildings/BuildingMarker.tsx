// BuildingMarker.tsx
import { Button } from "../ui/button";

interface BuildingMarkerProps {
  id: string;
  name: string;
  top: string;
  left: string;
  onClick: (id: string, name: string) => void;
}

export function BuildingMarker({ id, name, top, left, onClick }: BuildingMarkerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: top,
        left: left,
        transform: 'translate(-50%, -50%)', // Центрируем кнопку по координатам
        zIndex: 10,
      }}
    >
      <Button
        variant="secondary"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          onClick(id, name);
        }}
      >
        {name}
      </Button>
    </div>
  );
}