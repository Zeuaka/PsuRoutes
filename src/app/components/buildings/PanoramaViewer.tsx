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
  // ========== КОРПУС 1 ==========
  // 1 этаж
  101001: { image: '/panoramas/1.1.10.jpg', title: 'Коридор к лестнице 5', yaw: 0, pitch: 0 },
  101006: { image: '/panoramas/1.1.2.jpg', title: 'Банкоматы', yaw: 0, pitch: 0 },
  101007: { image: '/panoramas/1.1.3.jpg', title: 'Корридор', yaw: 0, pitch: 0 },
  101002: { image: '/panoramas/1.1.л5.jpg', title: 'Лестница у буфета', yaw: 0, pitch: 0 },
  101008: { image: '/panoramas/1.1.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  101009: { image: '/panoramas/1.1.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  101010: { image: '/panoramas/1.1.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  101011: { image: '/panoramas/1.1.1.jpg', title: 'Холл 1 корпус', yaw: 0, pitch: 0 },
  101012: { image: '/panoramas/1.1.л2.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  101013: { image: '/panoramas/1.1.5.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  101014: { image: '/panoramas/1.1.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  101015: { image: '/panoramas/1.1.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  101016: { image: '/panoramas/1.1.л4.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  101017: { image: '/panoramas/1.1.8.jpg', title: 'Вход в библиотеку', yaw: 0, pitch: 0 },
  101018: { image: '/panoramas/1.1.9.jpg', title: 'Библиотека', yaw: 0, pitch: 0 },
  
  // 2 этаж
  11312: { image: '/panoramas/1.2.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  102314: { image: '/panoramas/1.2.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  11303: { image: '/panoramas/1.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11219: { image: '/panoramas/1.2.1.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  11210: { image: '/panoramas/1.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  11218: { image: '/panoramas/1.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11211: { image: '/panoramas/1.2.л2.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  11283: { image: '/panoramas/1.2.5.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  11214: { image: '/panoramas/1.2.6.jpg', title: 'Рядом с переходом', yaw: 0, pitch: 0 },
  11293: { image: '/panoramas/1.2.7.jpg', title: 'Корридор', yaw: 0, pitch: 0 },
  11297: { image: '/panoramas/1.2.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11212: { image: '/panoramas/1.2.л4.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  
  // 3 этаж
  11338: { image: '/panoramas/1.3.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11316: { image: '/panoramas/1.3.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  11321: { image: '/panoramas/1.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11390: { image: '/panoramas/1.3.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  11315: { image: '/panoramas/1.3.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  11395: { image: '/panoramas/1.3.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11314: { image: '/panoramas/1.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  11318: { image: '/panoramas/1.3.5.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  11405: { image: '/panoramas/1.3.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11317: { image: '/panoramas/1.3.л4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11323: { image: '/panoramas/1.3.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  
  // 4 этаж
  11422: { image: '/panoramas/1.4.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  11488: { image: '/panoramas/1.4.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11493: { image: '/panoramas/1.4.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11421: { image: '/panoramas/1.4.4.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  11420: { image: '/panoramas/1.4.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11419: { image: '/panoramas/1.4.6.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  11477: { image: '/panoramas/1.4.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11425: { image: '/panoramas/1.4.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  11416: { image: '/panoramas/1.4.л4.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  11415: { image: '/panoramas/1.4.л2.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  11417: { image: '/panoramas/1.4.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  11418: { image: '/panoramas/1.4.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // ========== КОРПУС 10 ==========
  1001002: { image: '/panoramas/10.1.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001004: { image: '/panoramas/10.1.2.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001005: { image: '/panoramas/10.1.3.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001003: { image: '/panoramas/10.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1001006: { image: '/panoramas/10.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
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