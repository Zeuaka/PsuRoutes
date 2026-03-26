import { useEffect, useRef, useState } from 'react';
import 'pannellum/build/pannellum.css';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

interface PanoramaViewerProps {
  buildingId: string;
  buildingName: string;
  onBack: () => void;
}

const panoramasConfig: Record<string, { image: string; title: string }> = {
  '2': {
    image: '/panoramas/corpus2_hall.jpg',
    title: 'Холл физического факультета'
  },
  '4': {
    image: '/panoramas/dk.jpg',
    title: 'Фойе Дворца культуры'
  },
  '6': {
    image: '/panoramas/chem.jpg',
    title: 'Холл химического факультета'
  },
  '8': {
    image: '/panoramas/geo.jpg',
    title: 'Музей геологии'
  },
};

declare const pannellum: any;

export const PanoramaViewer = ({ buildingId, buildingName, onBack }: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pannellumLoaded, setPannellumLoaded] = useState(false);

  const panorama = panoramasConfig[buildingId];

  useEffect(() => {
    if (pannellumLoaded) return;

    if (typeof window !== 'undefined' && !(window as any).pannellum) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.onload = () => {
        setPannellumLoaded(true);
      };
      script.onerror = () => {
        setError('Не удалось загрузить библиотеку панорамы');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setPannellumLoaded(true);
    }
  }, [pannellumLoaded]);


  useEffect(() => {
    if (!containerRef.current || !panorama || !pannellumLoaded) return;
    if (!(window as any).pannellum) return;

    setIsLoading(true);
    setError(null);

    try {
      const pannellumLib = (window as any).pannellum;

      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      viewerRef.current = pannellumLib.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: panorama.image,
        title: panorama.title,
        author: 'ПГНИУ',
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        compass: true,
        keyboard: true,
        draggable: true,
        defaultYaw: 0,
        defaultPitch: 0,
        yaw: 0,
        pitch: 0,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        onLoad: () => {
          setIsLoading(false);
          console.log('Панорама загружена');
        },
        onError: (err: any) => {
          console.error('Ошибка загрузки панорамы:', err);
          setError('Не удалось загрузить панораму. Проверьте наличие файла.');
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('Ошибка инициализации Pannellum:', err);
      setError('Ошибка инициализации панорамы');
      setIsLoading(false);
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.error('Ошибка при уничтожении панорамы:', e);
        }
        viewerRef.current = null;
      }
    };
  }, [buildingId, panorama, pannellumLoaded]);

  // Полноэкранный режим
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
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!panorama) {
    return (
      <div className="w-full h-screen bg-black flex flex-col">
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-semibold text-lg">{buildingName}</h2>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">360° панорама в разработке</h3>
            <p className="text-gray-400">
              Для корпуса {buildingName} панорама скоро появится
            </p>
            <button
              onClick={onBack}
              className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          <div className="text-center">
            <h2 className="font-semibold text-lg">{buildingName}</h2>
            <p className="text-xs text-green-100">{panorama.title}</p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Выход' : 'Во весь экран'}</span>
          </button>
        </div>
      </div>

      {/* Контейнер для панорамы */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Загрузка 360° панорамы...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-400">{error}</p>
              <button
                onClick={onBack}
                className="mt-4 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
              >
                Вернуться
              </button>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ background: '#000' }}
        />
      </div>
    </div>
  );
};