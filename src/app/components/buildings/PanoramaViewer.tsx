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

// Хардкод маппинг для точек с панорамами
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

  // ========== КОРПУС 2 ==========
  // 1 этаж
  200001: { image: '/panoramas/2.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  200002: { image: '/panoramas/2.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  200003: { image: '/panoramas/2.1.6.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  200004: { image: '/panoramas/2.1.1.jpg', title: 'Центральный проход', yaw: 0, pitch: 0 },
  200005: { image: '/panoramas/2.1.л1.jpg', title: 'Центральная лестница', yaw: 0, pitch: 0 },
  200006: { image: '/panoramas/2.1.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  200007: { image: '/panoramas/2.1.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  200008: { image: '/panoramas/2.1.5.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  200009: { image: '/panoramas/2.1.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 2 этаж
  201001: { image: '/panoramas/2.2.1.jpg', title: 'Холл ИКНТ', yaw: 0, pitch: 0 },
  201002: { image: '/panoramas/2.2.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  201003: { image: '/panoramas/2.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201004: { image: '/panoramas/2.2.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201005: { image: '/panoramas/2.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201006: { image: '/panoramas/2.2.5.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  201007: { image: '/panoramas/2.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  201008: { image: '/panoramas/2.2.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201009: { image: '/panoramas/2.2.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201010: { image: '/panoramas/2.2.8.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  201011: { image: '/panoramas/2.2.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  201012: { image: '/panoramas/2.2.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  201013: { image: '/panoramas/2.2.10.jpg', title: 'Развилка', yaw: 0, pitch: 0 },

  // 3 этаж
  202002: { image: '/panoramas/2.3.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  202003: { image: '/panoramas/2.3.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  202004: { image: '/panoramas/2.3.2.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  202005: { image: '/panoramas/2.3.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  202006: { image: '/panoramas/2.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  202007: { image: '/panoramas/2.3.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  202008: { image: '/panoramas/2.3.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  202009: { image: '/panoramas/2.3.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  202010: { image: '/panoramas/2.3.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  202011: { image: '/panoramas/2.3.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 4 этаж
  203001: { image: '/panoramas/2.4.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  203002: { image: '/panoramas/2.4.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  203003: { image: '/panoramas/2.4.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  203004: { image: '/panoramas/2.4.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  203005: { image: '/panoramas/2.4.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  203006: { image: '/panoramas/2.4.5.jpg', title: 'Тупик', yaw: 0, pitch: 0 },
  203007: { image: '/panoramas/2.4.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  203008: { image: '/panoramas/2.4.6.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  203009: { image: '/panoramas/2.4.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  203010: { image: '/panoramas/2.4.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  203011: { image: '/panoramas/2.4.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  203012: { image: '/panoramas/2.4.9.jpg', title: 'Тупик', yaw: 0, pitch: 0 },

  // 5 этаж
  204016: { image: '/panoramas/2.5.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  204017: { image: '/panoramas/2.5.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  204018: { image: '/panoramas/2.5.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  204019: { image: '/panoramas/2.5.4.jpg', title: 'Перед лестницей', yaw: 0, pitch: 0 },
  204020: { image: '/panoramas/2.5.5.jpg', title: 'Тупик', yaw: 0, pitch: 0 },
  204021: { image: '/panoramas/2.5.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  204011: { image: '/panoramas/2.5.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  204005: { image: '/panoramas/2.5.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  204003: { image: '/panoramas/2.5.7.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  204002: { image: '/panoramas/2.5.8.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  204001: { image: '/panoramas/2.5.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // ========== КОРПУС 3 ==========
  301001: { image: '/panoramas/3.1.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  301002: { image: '/panoramas/3.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  301003: { image: '/panoramas/3.1.2.jpg', title: 'Тупик', yaw: 0, pitch: 0 },
  301004: { image: '/panoramas/3.1.3.jpg', title: 'Тупик', yaw: 0, pitch: 0 },
  301010: { image: '/panoramas/3.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  301011: { image: '/panoramas/3.1.4.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  302001: { image: '/panoramas/3.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  302002: { image: '/panoramas/3.2.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  302003: { image: '/panoramas/3.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  302004: { image: '/panoramas/3.2.3.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  302005: { image: '/panoramas/3.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  303002: { image: '/panoramas/3.3.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  303011: { image: '/panoramas/3.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  303021: { image: '/panoramas/3.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // ========== КОРПУС 4 ==========
  401001: { image: '/panoramas/4.1.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  401002: { image: '/panoramas/4.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  401003: { image: '/panoramas/4.1.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  401004: { image: '/panoramas/4.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  401005: { image: '/panoramas/4.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  402001: { image: '/panoramas/4.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  402002: { image: '/panoramas/4.2.1.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  402003: { image: '/panoramas/4.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  402004: { image: '/panoramas/4.2.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  402011: { image: '/panoramas/4.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // ========== КОРПУС 6 ==========
  // 1 этаж
  601020: { image: '/panoramas/6.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  601021: { image: '/panoramas/6.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  601022: { image: '/panoramas/6.1.1.jpg', title: 'У выхода', yaw: 0, pitch: 0 },
  601029: { image: '/panoramas/6.1.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  601033: { image: '/panoramas/6.1.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  601038: { image: '/panoramas/6.1.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  601040: { image: '/panoramas/6.1.6.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  601042: { image: '/panoramas/6.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 2 этаж
  602022: { image: '/panoramas/6.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  602029: { image: '/panoramas/6.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  602032: { image: '/panoramas/6.2.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  602035: { image: '/panoramas/6.2.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  602040: { image: '/panoramas/6.2.7.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  602043: { image: '/panoramas/6.2.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  602045: { image: '/panoramas/6.2.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  602047: { image: '/panoramas/6.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  602053: { image: '/panoramas/6.2.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  602059: { image: '/panoramas/6.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 3 этаж
  603035: { image: '/panoramas/6.3.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  603036: { image: '/panoramas/6.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  603042: { image: '/panoramas/6.3.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  603046: { image: '/panoramas/6.3.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  603048: { image: '/panoramas/6.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  603052: { image: '/panoramas/6.3.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  603059: { image: '/panoramas/6.3.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  603063: { image: '/panoramas/6.3.7.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  603066: { image: '/panoramas/6.3.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 4 этаж
  604036: { image: '/panoramas/6.4.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  604037: { image: '/panoramas/6.4.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  604041: { image: '/panoramas/6.4.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  604047: { image: '/panoramas/6.4.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  604053: { image: '/panoramas/6.4.5.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  604056: { image: '/panoramas/6.4.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  604060: { image: '/panoramas/6.4.7.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  604066: { image: '/panoramas/6.4.8.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  604068: { image: '/panoramas/6.4.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  604071: { image: '/panoramas/6.4.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // ========== КОРПУС 7 ==========
  // 1 этаж
  72001: { image: '/panoramas/7.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  72002: { image: '/panoramas/7.1.3.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  72003: { image: '/panoramas/7.1.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  72004: { image: '/panoramas/7.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  72005: { image: '/panoramas/7.1.1.jpg', title: 'Холл СДК', yaw: 0, pitch: 0 },
  72006: { image: '/panoramas/7.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 2 этаж
  702134: { image: '/panoramas/7.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  702136: { image: '/panoramas/7.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  702137: { image: '/panoramas/7.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  702141: { image: '/panoramas/7.2.5.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  702142: { image: '/panoramas/7.2.3.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  702144: { image: '/panoramas/7.2.2.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  702147: { image: '/panoramas/7.2.6.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  702153: { image: '/panoramas/7.2.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  72129: { image: '/panoramas/7.2.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 3 этаж
  703007: { image: '/panoramas/7.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  703009: { image: '/panoramas/7.3.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  703011: { image: '/panoramas/7.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  703012: { image: '/panoramas/7.3.1.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 4 этаж
  704002: { image: '/panoramas/7.4.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  704004: { image: '/panoramas/7.4.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  704006: { image: '/panoramas/7.4.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  704007: { image: '/panoramas/7.4.1.jpg', title: 'У балконов', yaw: 0, pitch: 0 },

  // ========== КОРПУС 8 ==========
  // 1 этаж
  801005: { image: '/panoramas/8.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  801014: { image: '/panoramas/8.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  801021: { image: '/panoramas/8.1.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  801033: { image: '/panoramas/8.1.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  801036: { image: '/panoramas/8.1.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  801044: { image: '/panoramas/8.1.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  801046: { image: '/panoramas/8.1.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  801059: { image: '/panoramas/8.1.5.jpg', title: 'Тупик', yaw: 0, pitch: 0 },

  // 2 этаж
  802010: { image: '/panoramas/8.2.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  802019: { image: '/panoramas/8.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  802022: { image: '/panoramas/8.2.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  802040: { image: '/panoramas/8.2.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  802047: { image: '/panoramas/8.2.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  802055: { image: '/panoramas/8.2.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  802069: { image: '/panoramas/8.2.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  802078: { image: '/panoramas/8.2.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 3 этаж
  803006: { image: '/panoramas/8.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  803017: { image: '/panoramas/8.3.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  803025: { image: '/panoramas/8.3.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  803042: { image: '/panoramas/8.3.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  803049: { image: '/panoramas/8.3.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  803057: { image: '/panoramas/8.3.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  803059: { image: '/panoramas/8.3.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 4 этаж
  804006: { image: '/panoramas/8.4.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  804012: { image: '/panoramas/8.4.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  804021: { image: '/panoramas/8.4.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  804039: { image: '/panoramas/8.4.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  804046: { image: '/panoramas/8.4.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  804055: { image: '/panoramas/8.4.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  804057: { image: '/panoramas/8.4.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },

  // 5 этаж
  805005: { image: '/panoramas/8.5.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  805013: { image: '/panoramas/8.5.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  805023: { image: '/panoramas/8.5.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  805039: { image: '/panoramas/8.5.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  805046: { image: '/panoramas/8.5.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  805055: { image: '/panoramas/8.5.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  805060: { image: '/panoramas/8.5.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  805076: { image: '/panoramas/8.5.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 6 этаж
  806005: { image: '/panoramas/8.6.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  806014: { image: '/panoramas/8.6.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  806023: { image: '/panoramas/8.6.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  806041: { image: '/panoramas/8.6.л1.jpg', title: 'Главная лестница', yaw: 0, pitch: 0 },
  806047: { image: '/panoramas/8.6.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  806056: { image: '/panoramas/8.6.л3.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  806057: { image: '/panoramas/8.6.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  806075: { image: '/panoramas/8.6.5.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 7 этаж
  807004: { image: '/panoramas/8.7.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  807009: { image: '/panoramas/8.7.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  807015: { image: '/panoramas/8.7.3.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  807026: { image: '/panoramas/8.7.л1.jpg', title: 'Главная', yaw: 0, pitch: 0 },
  807030: { image: '/panoramas/8.7.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },

  // ========== КОРПУС 9 ==========
  901001: { image: '/panoramas/9.1.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  901002: { image: '/panoramas/9.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  901003: { image: '/panoramas/9.1.3.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  901004: { image: '/panoramas/9.1.4.jpg', title: 'Поворот', yaw: 0, pitch: 0 },
  901005: { image: '/panoramas/9.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  901006: { image: '/panoramas/9.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  902001: { image: '/panoramas/9.2.2.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  902002: { image: '/panoramas/9.2.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  902003: { image: '/panoramas/9.2.1.jpg', title: 'У перехода', yaw: 0, pitch: 0 },

  // ========== КОРПУС 10 ==========
  1001002: { image: '/panoramas/10.1.1.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001003: { image: '/panoramas/10.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1001004: { image: '/panoramas/10.1.2.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001005: { image: '/panoramas/10.1.3.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1001006: { image: '/panoramas/10.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1002001: { image: '/panoramas/10.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1002002: { image: '/panoramas/10.2.2.jpg', title: 'У тренерской', yaw: 0, pitch: 0 },
  1002003: { image: '/panoramas/10.2.1.jpg', title: 'Игровой зал', yaw: 0, pitch: 0 },
  1002004: { image: '/panoramas/10.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1003001: { image: '/panoramas/10.3.3.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  1003002: { image: '/panoramas/10.3.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1003006: { image: '/panoramas/10.3.2.jpg', title: 'У 302', yaw: 0, pitch: 0 },
  1003007: { image: '/panoramas/10.3.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1003008: { image: '/panoramas/10.3.1.jpg', title: 'У 301', yaw: 0, pitch: 0 },

  // ========== КОРПУС 11 ==========
  1101007: { image: '11.1.л1.jpeg', title: '11.1.л1', yaw: 0, pitch: 0 },
  1101010: { image: '11.1.1.jpeg', title: '11.1.1', yaw: 0, pitch: 0 },
  1101014: { image: '11.1.2.jpeg', title: '11.1.2', yaw: 0, pitch: 0 },
  1102001: { image: '11.1.л1.jpeg', title: 'повтор 11.1.л1', yaw: 0, pitch: 0 },
  1102006: { image: '11.2.1.jpeg', title: '11.2.1', yaw: 0, pitch: 0 },
  1102013: { image: '11.2.2.jpeg', title: '11.2.2', yaw: 0, pitch: 0 },

  // ========== КОРПУС 12 ==========
  // 1 этаж
  1201005: { image: '/panoramas/12.1.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1201006: { image: '/panoramas/12.1.1.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  1201016: { image: '/panoramas/12.1.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1201033: { image: '/panoramas/12.1.2.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  1201040: { image: '/panoramas/12.1.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  1201044: { image: '/panoramas/12.1.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },

  // 2 этаж
  1202004: { image: '/panoramas/12.2.1.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  1202022: { image: '/panoramas/12.2.л1.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1202030: { image: '/panoramas/12.2.л2.jpg', title: 'Лестница', yaw: 0, pitch: 0 },
  1202037: { image: '/panoramas/12.2.2.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  1202039: { image: '/panoramas/12.2.3.jpg', title: 'Холл', yaw: 0, pitch: 0 },
  1202044: { image: '/panoramas/12.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  1202051: { image: '/panoramas/12.2.5.jpg', title: 'Коридор у лестницы', yaw: 0, pitch: 0 },
  1202058: { image: '/panoramas/12.2.6.jpg', title: 'Тупик', yaw: 0, pitch: 0 },

  // 3 этаж
  1203004: { image: '/panoramas/12.3.1.jpg', title: 'Развилка', yaw: 0, pitch: 0 },
  1203035: { image: '/panoramas/12.2.2.jpg', title: 'У лестницы', yaw: 0, pitch: 0 },
  1203037: { image: '/panoramas/12.2.3.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  1203043: { image: '/panoramas/12.2.4.jpg', title: 'Коридор', yaw: 0, pitch: 0 },
  1203050: { image: '/panoramas/12.2.5.jpg', title: 'Тупик', yaw: 0, pitch: 0 },
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