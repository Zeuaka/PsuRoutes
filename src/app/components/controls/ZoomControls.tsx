import { ZoomIn, ZoomOut, RotateCcw, List } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleList: () => void;
}

export const ZoomControls = ({ onZoomIn, onZoomOut, onReset, onToggleList }: ZoomControlsProps) => {
  return (
    <Card className="p-2 flex flex-col gap-2 bg-white/90 backdrop-blur-sm">
      <Button variant="outline" size="icon" onClick={onZoomIn} title="Увеличить">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomOut} title="Уменьшить">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onReset} title="Сбросить">
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onToggleList} title="Список объектов">
        <List className="w-4 h-4" />
      </Button>
    </Card>
  );
};