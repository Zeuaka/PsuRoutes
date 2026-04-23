// ClickableBuilding.tsx
import { useState } from 'react';

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

interface ClickableBuildingProps {
  location: Location;
  onClick: (id: string) => void;
}

export const ClickableBuilding = ({ location, onClick }: ClickableBuildingProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: location.top,
        left: location.left,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 10,
        transition: 'all 0.2s ease',
        filter: isHovered 
          ? 'drop-shadow(0 0 5px rgba(114,42,53,0.7))' 
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0))',
      }}
      onClick={() => onClick(location.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={location.svgPath}
        alt={location.name}
        style={{
          width: location.width,
          height: location.height,
        }}
        draggable={false}
      />
    </div>
  );
};