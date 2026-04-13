export interface PhysicsConfig {
  gravity: number;
  speed: number;
  jumpForce: number;
  delayEvery: number; // every Nth jump gets a 200ms delay
  mass: number;       // affects jump impulse and slam force
  drag: number;       // air resistance while airborne
}

export interface DeathPayload {
  deaths: number;
  avgJumps: number;
  wallHugs: number;
  keyMashCount: number;
}

export interface JudgeResponse {
  physics: PhysicsConfig;
  roast: string;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 600,
  speed: 300,
  jumpForce: -650,
  delayEvery: 10,
  mass: 1.0,
  drag: 0,
};
