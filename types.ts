export enum Gear {
  N = 'N',
  R = 'R',
  FIRST = '1',
  SECOND = '2',
  THIRD = '3',
  FOURTH = '4',
  FIFTH = '5',
}

export interface SimulationState {
  rpm: number; // Engine RPM (0 - 8000)
  speed: number; // Vehicle Speed (km/h)
  gear: Gear;
  clutchPedal: number; // 0 (Engaged/Up) to 1 (Disengaged/Down)
  throttlePedal: number; // 0 (Idle) to 1 (Full)
  brakePedal: number; // 0 to 1
  isStalled: boolean;
  engineOn: boolean;
}

export const GEAR_RATIOS: Record<Gear, number> = {
  [Gear.N]: 0,
  [Gear.R]: -3.5,
  [Gear.FIRST]: 3.5,
  [Gear.SECOND]: 2.0,
  [Gear.THIRD]: 1.4,
  [Gear.FOURTH]: 1.0,
  [Gear.FIFTH]: 0.8,
};

export const FINAL_DRIVE_RATIO = 4.0;
export const IDLE_RPM = 800;
export const REDLINE_RPM = 7000;
