// Типы точек (согласно вашей таблице)
export type PointType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Интерфейсы, зеркалирующие будущую БД
export interface Building {
  id: number;
  name: string;
  address: string | null;
  floors_count: number;
}

export interface Floor {
  id: number;
  building_id: number;
  floor_number: number;
  floor_plan_url: string | null;
}

export interface Point {
  id: number;
  building_id: number;
  floor_id: number;
  type: PointType;
  name: string;
  x_coord: number | null;
  y_coord: number | null;
  description: string | null;
  panorama_id: number | null;
  is_active: boolean;
}

export interface Edge {
  id: number;
  from_point_id: number;
  to_point_id: number;
  distance_meters: number;
  duration_minutes: number;
  direction_text: string | null;
  floor_transition: boolean;
  is_bidirectional: boolean;
}

export interface Panorama {
  id: number;
  point_id: number;
  image_path: string;
  title: string;
  description: string | null;
  yaw: number | null;
  pitch: number | null;
}

// ============= ДАННЫЕ =============

// Корпуса (только корпус 2)
export const buildings: Building[] = [
  { id: 2, name: 'ИКНТ и Биологический факультет', address: 'ул. Генкеля, 7', floors_count: 4 },
];

// Этажи корпуса 2
export const floors: Floor[] = [
  { id: 1, building_id: 2, floor_number: 1, floor_plan_url: null },
  { id: 2, building_id: 2, floor_number: 2, floor_plan_url: null },
  { id: 3, building_id: 2, floor_number: 3, floor_plan_url: null },
  { id: 4, building_id: 2, floor_number: 4, floor_plan_url: null },
];

// Точки корпуса 2
export const points: Point[] = [
  // 1 этаж
  { id: 100, building_id: 2, floor_id: 1, type: 1, name: 'Холл ИКНТ', x_coord: 50, y_coord: 85, description: 'Главный холл, гардероб, информационная стойка', panorama_id: 201, is_active: true },
  { id: 101, building_id: 2, floor_id: 1, type: 7, name: 'Переход в корпус 1', x_coord: 50, y_coord: 75, description: 'Переход в соседний корпус', panorama_id: null, is_active: true },
  { id: 102, building_id: 2, floor_id: 1, type: 2, name: 'Центральная лестница', x_coord: 50, y_coord: 65, description: 'Главная лестница на 2-4 этажи', panorama_id: null, is_active: true },
  { id: 103, building_id: 2, floor_id: 1, type: 3, name: 'Главный коридор', x_coord: 50, y_coord: 55, description: 'Центральный коридор, разветвление на крылья', panorama_id: null, is_active: true },
  { id: 104, building_id: 2, floor_id: 1, type: 5, name: 'Коридор, восточное крыло', x_coord: 70, y_coord: 55, description: 'Поворот направо от главного коридора', panorama_id: null, is_active: true },
  { id: 105, building_id: 2, floor_id: 1, type: 3, name: 'Коридор, западное крыло', x_coord: 30, y_coord: 55, description: 'Поворот налево от главного коридора', panorama_id: null, is_active: true },
  { id: 106, building_id: 2, floor_id: 1, type: 6, name: 'Лестница, восточное крыло', x_coord: 85, y_coord: 40, description: 'Лестница на 2 этаж (восточное крыло)', panorama_id: null, is_active: true },
  { id: 107, building_id: 2, floor_id: 1, type: 4, name: 'Лестница, западное крыло', x_coord: 15, y_coord: 40, description: 'Лестница на 2 этаж (западное крыло)', panorama_id: null, is_active: true },
  { id: 108, building_id: 2, floor_id: 1, type: 5, name: 'Тупиковый коридор', x_coord: 90, y_coord: 55, description: 'Конец восточного крыла', panorama_id: null, is_active: true },
  { id: 109, building_id: 2, floor_id: 1, type: 3, name: 'Коридор к столовой', x_coord: 20, y_coord: 70, description: 'Поворот к столовой', panorama_id: null, is_active: true },
  { id: 110, building_id: 2, floor_id: 1, type: 1, name: 'Столовая', x_coord: 15, y_coord: 85, description: 'Студенческая столовая', panorama_id: 202, is_active: true },

  // 2 этаж
  { id: 111, building_id: 2, floor_id: 2, type: 2, name: 'Центральная лестница (2 этаж)', x_coord: 50, y_coord: 65, description: 'Выход с лестницы на 2 этаж', panorama_id: null, is_active: true },
  { id: 112, building_id: 2, floor_id: 2, type: 1, name: 'Холл 2 этажа', x_coord: 50, y_coord: 85, description: 'Холл второго этажа', panorama_id: null, is_active: true },
  { id: 113, building_id: 2, floor_id: 2, type: 3, name: 'Главный коридор 2 этажа', x_coord: 50, y_coord: 55, description: 'Центральный коридор 2 этажа', panorama_id: null, is_active: true },
  { id: 114, building_id: 2, floor_id: 2, type: 5, name: 'Коридор, восточное крыло', x_coord: 70, y_coord: 55, description: 'Восточное крыло 2 этажа', panorama_id: null, is_active: true },
  { id: 115, building_id: 2, floor_id: 2, type: 3, name: 'Коридор, западное крыло', x_coord: 30, y_coord: 55, description: 'Западное крыло 2 этажа', panorama_id: null, is_active: true },
  { id: 116, building_id: 2, floor_id: 2, type: 6, name: 'Лестница, восточное крыло (2 этаж)', x_coord: 85, y_coord: 40, description: 'Лестница на 3 этаж', panorama_id: null, is_active: true },
  { id: 117, building_id: 2, floor_id: 2, type: 4, name: 'Лестница, западное крыло (2 этаж)', x_coord: 15, y_coord: 40, description: 'Лестница на 3 этаж', panorama_id: null, is_active: true },
  { id: 118, building_id: 2, floor_id: 2, type: 1, name: 'Аудитория 201', x_coord: 80, y_coord: 70, description: 'Лекционная аудитория на 100 мест', panorama_id: null, is_active: true },
  { id: 119, building_id: 2, floor_id: 2, type: 1, name: 'Аудитория 215', x_coord: 20, y_coord: 70, description: 'Компьютерный класс', panorama_id: null, is_active: true },

  // 3 этаж
  { id: 120, building_id: 2, floor_id: 3, type: 2, name: 'Центральная лестница (3 этаж)', x_coord: 50, y_coord: 65, description: null, panorama_id: null, is_active: true },
  { id: 121, building_id: 2, floor_id: 3, type: 1, name: 'Холл 3 этажа', x_coord: 50, y_coord: 85, description: null, panorama_id: null, is_active: true },
  { id: 122, building_id: 2, floor_id: 3, type: 1, name: 'Лаборатория биологии', x_coord: 70, y_coord: 70, description: 'Лаборатория молекулярной биологии', panorama_id: 203, is_active: true },
  { id: 123, building_id: 2, floor_id: 3, type: 1, name: 'Лаборатория ИИ', x_coord: 30, y_coord: 70, description: 'Лаборатория искусственного интеллекта', panorama_id: null, is_active: true },
];

// Связи (рёбра)
export const edges: Edge[] = [
  // 1 этаж
  { id: 1, from_point_id: 100, to_point_id: 101, distance_meters: 10, duration_minutes: 0.3, direction_text: 'К переходу в корпус 1', floor_transition: false, is_bidirectional: true },
  { id: 2, from_point_id: 100, to_point_id: 102, distance_meters: 15, duration_minutes: 0.5, direction_text: 'К центральной лестнице', floor_transition: false, is_bidirectional: true },
  { id: 3, from_point_id: 102, to_point_id: 103, distance_meters: 8, duration_minutes: 0.2, direction_text: 'Спуститься в главный коридор', floor_transition: false, is_bidirectional: true },
  { id: 4, from_point_id: 103, to_point_id: 104, distance_meters: 15, duration_minutes: 0.5, direction_text: 'Повернуть направо (восточное крыло)', floor_transition: false, is_bidirectional: true },
  { id: 5, from_point_id: 103, to_point_id: 105, distance_meters: 15, duration_minutes: 0.5, direction_text: 'Повернуть налево (западное крыло)', floor_transition: false, is_bidirectional: true },
  { id: 6, from_point_id: 104, to_point_id: 106, distance_meters: 20, duration_minutes: 0.7, direction_text: 'К лестнице в восточном крыле', floor_transition: false, is_bidirectional: true },
  { id: 7, from_point_id: 105, to_point_id: 107, distance_meters: 20, duration_minutes: 0.7, direction_text: 'К лестнице в западном крыле', floor_transition: false, is_bidirectional: true },
  { id: 8, from_point_id: 104, to_point_id: 108, distance_meters: 10, duration_minutes: 0.3, direction_text: 'В тупиковый коридор', floor_transition: false, is_bidirectional: true },
  { id: 9, from_point_id: 105, to_point_id: 109, distance_meters: 15, duration_minutes: 0.5, direction_text: 'К коридору столовой', floor_transition: false, is_bidirectional: true },
  { id: 10, from_point_id: 109, to_point_id: 110, distance_meters: 8, duration_minutes: 0.2, direction_text: 'В столовую', floor_transition: false, is_bidirectional: true },

  // Связи между этажами
  { id: 11, from_point_id: 102, to_point_id: 111, distance_meters: 8, duration_minutes: 0.3, direction_text: 'Подняться на 2 этаж (центральная лестница)', floor_transition: true, is_bidirectional: true },
  { id: 12, from_point_id: 106, to_point_id: 116, distance_meters: 8, duration_minutes: 0.3, direction_text: 'Подняться на 2 этаж (восточная лестница)', floor_transition: true, is_bidirectional: true },
  { id: 13, from_point_id: 107, to_point_id: 117, distance_meters: 8, duration_minutes: 0.3, direction_text: 'Подняться на 2 этаж (западная лестница)', floor_transition: true, is_bidirectional: true },

  // 2 этаж
  { id: 14, from_point_id: 111, to_point_id: 112, distance_meters: 10, duration_minutes: 0.3, direction_text: 'В холл 2 этажа', floor_transition: false, is_bidirectional: true },
  { id: 15, from_point_id: 112, to_point_id: 113, distance_meters: 8, duration_minutes: 0.2, direction_text: 'В главный коридор', floor_transition: false, is_bidirectional: true },
  { id: 16, from_point_id: 113, to_point_id: 114, distance_meters: 15, duration_minutes: 0.5, direction_text: 'В восточное крыло', floor_transition: false, is_bidirectional: true },
  { id: 17, from_point_id: 113, to_point_id: 115, distance_meters: 15, duration_minutes: 0.5, direction_text: 'В западное крыло', floor_transition: false, is_bidirectional: true },
  { id: 18, from_point_id: 114, to_point_id: 118, distance_meters: 12, duration_minutes: 0.4, direction_text: 'К аудитории 201', floor_transition: false, is_bidirectional: true },
  { id: 19, from_point_id: 115, to_point_id: 119, distance_meters: 12, duration_minutes: 0.4, direction_text: 'К аудитории 215', floor_transition: false, is_bidirectional: true },

  // 3 этаж
  { id: 20, from_point_id: 111, to_point_id: 120, distance_meters: 16, duration_minutes: 0.6, direction_text: 'Подняться на 3 этаж', floor_transition: true, is_bidirectional: true },
  { id: 21, from_point_id: 120, to_point_id: 121, distance_meters: 10, duration_minutes: 0.3, direction_text: 'В холл 3 этажа', floor_transition: false, is_bidirectional: true },
  { id: 22, from_point_id: 121, to_point_id: 122, distance_meters: 25, duration_minutes: 0.8, direction_text: 'К лаборатории биологии', floor_transition: false, is_bidirectional: true },
  { id: 23, from_point_id: 121, to_point_id: 123, distance_meters: 25, duration_minutes: 0.8, direction_text: 'К лаборатории ИИ', floor_transition: false, is_bidirectional: true },
];

// Панорамы корпуса 2
export const panoramas: Panorama[] = [
  { id: 201, point_id: 100, image_path: '/panoramas/corpus2_hall.jpg', title: 'Холл ИКНТ', description: 'Главный холл корпуса №2', yaw: 0, pitch: 0 },
  { id: 202, point_id: 110, image_path: '/panoramas/corpus2_cafe.jpg', title: 'Столовая', description: 'Студенческая столовая', yaw: null, pitch: null },
  { id: 203, point_id: 122, image_path: '/panoramas/corpus2_lab.jpg', title: 'Лаборатория биологии', description: 'Лаборатория молекулярной биологии', yaw: null, pitch: null },
];