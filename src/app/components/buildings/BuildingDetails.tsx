import { ArrowLeft, MapPin, Building2, Navigation } from 'lucide-react';
import { Card } from '../ui/card';

interface BuildingDetailsProps {
  building: { id: string; name: string };
  onBack: () => void;
}

export const BuildingDetails = ({ building, onBack }: BuildingDetailsProps) => {
  // Описания для разных корпусов (можно расширять)
  const getBuildingDescription = (id: string) => {
    const descriptions: Record<string, string> = {
      '6': 'Химический факультет. ',
      '4': 'Студенческий дворец культуры. ',
      '8': 'Геологический факультет. ',
      '1': 'Физический факультет.',
      '12': 'Учебный корпус №12. ',
      '10': 'Спортивный клуб ПГНИУ. ',
      '5': 'Филологический факультет. ',
      '2': 'ИКНТ и Биологический факультет. ',
      '3': 'Корпус №3. Учебные аудитории, ',
      '9': 'Юридический факультет. ',
      '11': 'Юридический факультет (дополнительный корпус).',
    };
    return descriptions[id] || 'Информация о корпусе будет добавлена позже.';
  };

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

          {/* Планы этажей (заглушка) */}
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

          {/* Маршруты внутри корпуса (заглушка) */}
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