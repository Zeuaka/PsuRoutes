// src/components/buildings/BuildingDetails.tsx
import { ArrowLeft, Building2, Camera, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { Card } from '../ui/card';
import { useState, useEffect } from 'react';
import { PanoramaViewer } from './PanoramaViewer';
import { RouteBuilder } from './RouteBuilder';
import { useBuildingData } from '../../hooks/useBuildingData';
import { fetchBuildingById } from '../../data/navigationApi';
import { Building } from '../../data/navigationData';

interface BuildingDetailsProps {
  building: { id: string; name: string };
  onBack: () => void;
}

export const BuildingDetails = ({ building, onBack }: BuildingDetailsProps) => {
  const [showPanorama, setShowPanorama] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<number | undefined>();
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [buildingData, setBuildingData] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  const corpusId = parseInt(building.id);
  const hasData = corpusId;

  useEffect(() => {
    let cancelled = false;
    async function loadBuilding() {
      const data = await fetchBuildingById(corpusId);
      if (!cancelled) setBuildingData(data);
      setLoading(false);
    }
    loadBuilding();
    return () => { cancelled = true; };
  }, [corpusId]);

  const { floors, points, panoramas, loading: dataLoading } = useBuildingData(hasData ? corpusId : null);

  const hasPanorama = panoramas.length > 0;
  const allPoints = points;

  const getBuildingDescription = (id: number) => {
    const descriptions: Record<number, string> = {
      1: 'Физический факультет. Научные лаборатории, кафедры общей физики, теоретической физики, компьютерные классы.',
      2: 'ИКНТ и Биологический факультет. Компьютерные классы, лаборатории биологии, кафедры информационных технологий и биологических наук.',
      4: 'Студенческий дворец культуры. Главная концертная площадка университета, творческие студии, репетиционные комнаты.',
      6: 'Химический факультет. Современные лаборатории, научно-исследовательские центры.',
      8: 'Геологический факультет. Музей геологии и картографии, лаборатории ГИС, кафедра туризма.',
    };
    return descriptions[id] || 'Информация о корпусе будет добавлена позже.';
  };

  const handleOpenPanorama = (pointId?: number) => {
    setSelectedPointId(pointId);
    setShowPanorama(true);
  };

  if (showPanorama) {
    return (
      <PanoramaViewer
        buildingId={building.id}
        buildingName={building.name}
        pointId={selectedPointId}
        onBack={() => setShowPanorama(false)}
      />
    );
  }

  if (showRouteBuilder) {
    return (
      <RouteBuilder
        buildingId={corpusId}
        buildingName={building.name}
        onBack={() => setShowRouteBuilder(false)}
      />
    );
  }

  if (loading || dataLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[rgba(167,60,76)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных корпуса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Шапка */}
      <div className="bg-[rgba(167,60,76)] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            {/* <span>Назад к карте</span> */}
          </button>
          <div>
            <h1 className="text-2xl font-bold">{building.name}</h1>
            <p className="text-sm text-green-100 mt-1">Корпус №{building.id}</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Кнопка построения маршрута */}
          {hasData && (
            <button
              onClick={() => setShowRouteBuilder(true)}
              className="w-full bg-[#767676] hover:bg-[#656565] text-white rounded-xl p-4 shadow-lg transition-all transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-3">
                <Navigation className="w-6 h-6" />
                <div>
                  <div className="font-bold text-lg">Построить маршрут</div>
                </div>
                <ArrowRight className="w-6 h-6" />
              </div>
            </button>
          )}

          {/* Описание корпуса */}
          <Card className="p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[rgba(167,60,76)]" />
              Общая информация
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {getBuildingDescription(corpusId)}
            </p>
            {buildingData?.address && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                {buildingData.address}
              </p>
            )}
          </Card>

          {!hasData ? (
            <Card className="p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-text-[rgba(167,60,76)]" />
                Навигация в разработке
              </h2>
              <div className="bg-gray-100 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🚧</div>
                <p className="text-gray-500 text-lg">Детальная навигация для этого корпуса скоро появится</p>
                <p className="text-gray-400 text-sm mt-2">
                  Мы работаем над созданием интерактивных карт этажей и маршрутов
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Информация о точках */}
              <Card className="p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[rgba(167,60,76)]" />
                  Доступные точки навигации ({allPoints.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allPoints.slice(0, 9).map(point => (
                    <div key={point.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                      <div className="font-medium text-gray-700">{point.name}</div>
                      <div className="text-xs text-gray-400">
                        {floors.find(f => f.id === point.floor_id)?.floor_number} этаж
                      </div>
                    </div>
                  ))}
                </div>
                {allPoints.length > 9 && (
                    <div className="p-2 bg-gray-100 rounded-lg text-sm text-center text-gray-500">
                      + еще {allPoints.length - 9} точек
                    </div>
                  )}
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Нажмите "Построить маршрут" для навигации
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};