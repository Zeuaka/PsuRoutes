// src/app/data/navigationData.ts
export type PointType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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