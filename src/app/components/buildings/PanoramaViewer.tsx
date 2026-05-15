// src/app/components/buildings/PanoramaViewer.tsx
import { useEffect, useRef, useState } from 'react';
import 'pannellum/build/pannellum.css';
import { ArrowLeft, Maximize2, Minimize2, TriangleAlert, RefreshCcw } from 'lucide-react';
import './panoramaViewerStyles.css';

interface PanoramaViewerProps {
  buildingId: string;
  buildingName: string;
  pointId?: number;
  onBack: () => void;
}

declare const pannellum: any;

// Хардкод маппинг только для точки 10
const panoramaMap: Record<number, { image: string; title: string; yaw?: number; pitch?: number }> = {
  // Корпус 1 - точка 10 на 1 этаже
  101001: {
    image: '/panoramas/1.1.10.jpg',
    title: 'Коридор к лестнице 5',
    yaw: 0,
    pitch: 0,
  },
};

export const PanoramaViewer = ({ buildingId, buildingName, pointId, onBack }: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pannellumLoaded, setPannellumLoaded] = useState(false);

  const getPanoramaConfig = () => {
    if (pointId && panoramaMap[pointId]) {
      return panoramaMap[pointId];
    }
    return {
      image: '/panoramas/1.1.10.jpg',
      title: 'Панорама',
      yaw: 0,
      pitch: 0,
    };
  };

  const panoramaConfig = getPanoramaConfig();

  // Загружаем Pannellum
  useEffect(() => {
    if (pannellumLoaded) return;
    if (typeof window !== 'undefined' && !(window as any).pannellum) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';
      script.onload = () => setPannellumLoaded(true);
      script.onerror = () => {
        setError('Не удалось загрузить библиотеку панорамы');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setPannellumLoaded(true);
    }
  }, [pannellumLoaded]);

  // Инициализируем панораму
  useEffect(() => {
    if (!containerRef.current || !panoramaConfig || !pannellumLoaded) return;
    if (!(window as any).pannellum) return;

    setIsLoading(true);
    setError(null);

    try {
      const pannellumLib = (window as any).pannellum;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      // Проверяем, существует ли файл
      const img = new Image();
      img.onload = () => {
        viewerRef.current = pannellumLib.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: panoramaConfig.image,
          title: panoramaConfig.title,
          author: 'ПГНИУ',
          autoLoad: true,
          showZoomCtrl: true,
          showFullscreenCtrl: true,
          compass: true,
          keyboard: true,
          draggable: true,
          defaultYaw: panoramaConfig.yaw || 0,
          defaultPitch: panoramaConfig.pitch || 0,
          yaw: panoramaConfig.yaw || 0,
          pitch: panoramaConfig.pitch || 0,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
          onLoad: () => setIsLoading(false),
          onError: (err: any) => {
            console.error(err);
            setError(`Не удалось загрузить панораму. Проверьте наличие файла: ${panoramaConfig.image}`);
            setIsLoading(false);
          },
        });
      };
      img.onerror = () => {
        setError(`Файл панорамы не найден: ${panoramaConfig.image}`);
        setIsLoading(false);
      };
      img.src = panoramaConfig.image;
    } catch (err) {
      console.error(err);
      setError('Ошибка инициализации панорамы');
      setIsLoading(false);
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {}
        viewerRef.current = null;
      }
    };
  }, [panoramaConfig, pannellumLoaded]);

  const toggleFullscreen = () => {
    const element = containerRef.current;
    if (!element) return;
    if (!document.fullscreenElement) {
      element.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="panorama-viewer-container">
      <div className="panorama-viewer-header">
        <div className="panorama-viewer-header-content">
          <button onClick={onBack} className="panorama-viewer-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="panorama-viewer-title">
            <h1>{buildingName}</h1>
            <p>{panoramaConfig.title}</p>
          </div>
          <button onClick={toggleFullscreen} className="panorama-viewer-fullscreen-btn">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>
      <div className="panorama-viewer-content">
        {isLoading && (
          <div className="panorama-viewer-loader">
            <div className="panorama-viewer-spinner"></div>
            <p>Загрузка панорамы...</p>
          </div>
        )}
        {error && (
          <div className="panorama-viewer-error">
            <div className="panorama-viewer-error-icon"><TriangleAlert size={40}/></div>
            <p className="panorama-viewer-error-text">{error}</p>
            <button onClick={onBack} className="panorama-viewer-error-btn">
              Вернуться
            </button>
          </div>
        )}
        <div ref={containerRef} className="panorama-viewer-canvas" />
      </div>
    </div>
  );
};