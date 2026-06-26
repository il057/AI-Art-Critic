export type GameState = "MENU" | "PLAYING" | "JUDGING" | "RESULT";

export interface JudgeResult {
  guess: string;
  score: number;
  critique: string;
}

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
