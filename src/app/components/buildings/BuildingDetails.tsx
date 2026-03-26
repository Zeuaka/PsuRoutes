import { ArrowLeft, MapPin, Building2, Navigation, Camera } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import { PanoramaViewer } from './PanoramaViewer';

interface BuildingDetailsProps {
  building: { id: string; name: string };
  onBack: () => void;
}

export const BuildingDetails = ({ building, onBack }: BuildingDetailsProps) => {
  const [showPanorama, setShowPanorama] = useState(false);

  // Описания для разных корпусов
  const getBuildingDescription = (id: string) => {
    const descriptions: Record<string, string> = {
      '6': 'Химический факультет. Современные лаборатории, научно-исследовательские центры, кафедры органической и неорганической химии.',
      '4': 'Студенческий дворец культуры. Главная концертная площадка университета, творческие студии, репетиционные комнаты, большой зрительный зал на 800 мест.',
      '8': 'Геологический факультет. Музей геологии и картографии, лаборатории ГИС, кафедра туризма, учебные аудитории.',
      '1': 'Физический факультет. Научные лаборатории, кафедры общей физики, теоретической физики, компьютерные классы.',
      '12': 'Учебный корпус №12. Лекционные аудитории, семинарские комнаты, компьютерные классы, кафедры гуманитарных наук.',
      '10': 'Спортивный клуб ПГНИУ. Тренажёрный зал, залы для единоборств, спортивные секции, команды по баскетболу, волейболу, футболу.',
      '5': 'Филологический факультет. Лекционные аудитории, библиотека, лингафонные кабинеты, кафедры русского языка и литературы.',
      '2': 'ИКНТ и Биологический факультет. Компьютерные классы, лаборатории биологии, кафедры информационных технологий и биологических наук.',
      '3': 'Корпус №3. Учебные аудитории, кафедры гуманитарных наук, студенческие пространства.',
      '9': 'Юридический факультет. Зал судебных заседаний, юридическая клиника, библиотека правовой литературы, кафедры гражданского и уголовного права.',
      '11': 'Юридический факультет (дополнительный корпус). Учебные аудитории, кафедры, пространства для самостоятельной работы.',
    };
    return descriptions[id] || 'Информация о корпусе будет добавлена позже.';
  };

  // Проверяем, есть ли панорама для этого корпуса
  const hasPanorama = (id: string): boolean => {
    // Список корпусов, для которых есть панорамы
    const panoramaBuildings = ['2', '4', '6', '8'];
    return panoramaBuildings.includes(id);
  };

  // Если открыта панорама — показываем её
  if (showPanorama) {
    return (
      <PanoramaViewer
        buildingId={building.id}
        buildingName={building.name}
        onBack={() => setShowPanorama(false)}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Шапка с кнопкой назад */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к карте</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold">{building.name}</h1>
            <p className="text-sm text-green-100 mt-1">ID: {building.id}</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Кнопка 360° панорамы */}
          {hasPanorama(building.id) && (
            <button
              onClick={() => setShowPanorama(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-4 shadow-lg transition-all transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-3">
                <Camera className="w-6 h-6" />
                <div>
                  <div className="font-semibold text-lg">360° виртуальный тур</div>
                  <div className="text-sm text-blue-100">Осмотрите холл корпуса в панорамном режиме</div>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </button>
          )}

          {/* Описание корпуса */}
          <Card className="p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Общая информация
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {getBuildingDescription(building.id)}
            </p>
          </Card>

          {/* Планы этажей */}
          <Card className="p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Планы этажей
            </h2>
            <div className="bg-gray-100 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-gray-500 text-lg">Схемы этажей в разработке</p>
              <p className="text-gray-400 text-sm mt-2">
                Для корпуса {building.name} скоро появятся детальные планы
              </p>
            </div>
          </Card>

          {/* Маршруты внутри корпуса */}
          <Card className="p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-green-600" />
              Маршруты внутри корпуса
            </h2>
            <div className="bg-gray-100 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-gray-500 text-lg">Интерактивные маршруты в разработке</p>
              <p className="text-gray-400 text-sm mt-2">
                Скоро здесь появятся точки навигации по корпусу
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};