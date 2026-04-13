import * as Phaser from "phaser";
import type { PhysicsConfig } from "../lib/types";
import { DEFAULT_PHYSICS } from "../lib/types";
import { SmoothNoise } from "../lib/noise";

export type GameEventCallback = (event: "death" | "win", data?: unknown) => void;

const W = 800;
const H = 580;
const GROUND_TOP = 500;
const TEAPOT_R = 22;
const TEAPOT_X = 120;

const JUMP_KEY_ROTATION = [
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.S,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
];

interface Obstacle {
  body: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  gfx: Phaser.GameObjects.Graphics;
  w: number;
  baseH: number;   // original height
  h: number;       // current height (can grow)
  growing: boolean;
  reversing: boolean;
  reverseTimer: number;
  phantom: boolean; // no hitbox
}

export class RunnerScene extends Phaser.Scene {
  private teapotBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private teapotGfx!: Phaser.GameObjects.Graphics;
  private groundBody!: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private obstacleList: Obstacle[] = [];

  private cfg: PhysicsConfig = { ...DEFAULT_PHYSICS };
  private onEvent!: GameEventCallback;
  private runIndex = 0;

  private jumpCount = 0;
  private lastJumpTime = 0;
  private keyMashCount = 0;
  private wallHugMs = 0;
  private survivalMs = 0;
  private grip = 1;
  private onGround = false;
  private airJumpsUsed = 0;
  private readonly maxAirJumps = 1;
  private obstacleTimer = 0;
  private dead = false;

  // Noise channels — each has a different seed so they're independent
  private speedNoise!: SmoothNoise;
  private gravityNoise!: SmoothNoise;
  private spawnNoise!: SmoothNoise;

  // Chaos event state
  private gravitySpikeTimer = 0;
  private gravitySpikeActive = false;
  private gravitySpikeMs = 0;
  private speedBurstTimer = 0;
  private speedBurstActive = false;
  private speedBurstMs = 0;

  constructor() { super({ key: "RunnerScene" }); }

  init(data: { physics?: PhysicsConfig; onEvent?: GameEventCallback; runIndex?: number }) {
    this.cfg = data.physics ? { ...data.physics } : { ...DEFAULT_PHYSICS };
    this.onEvent = data.onEvent ?? (() => {});
    this.runIndex = data.runIndex ?? 0;
    this.jumpCount = 0;
    this.lastJumpTime = 0;
    this.keyMashCount = 0;
    this.wallHugMs = 0;
    this.survivalMs = 0;
    this.grip = 1;
    this.onGround = false;
    this.airJumpsUsed = 0;
    this.obstacleTimer = 0;
    this.dead = false;
    this.obstacleList = [];
    this.gravitySpikeTimer = 0;
    this.gravitySpikeActive = false;
    this.speedBurstTimer = 0;
    this.speedBurstActive = false;
    // fresh noise seeds each run so patterns never repeat
    this.speedNoise = new SmoothNoise();
    this.gravityNoise = new SmoothNoise();
    this.spawnNoise = new SmoothNoise();
  }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0620, 0x0d0620, 0x1a0a3e, 0x1a0a3e, 1);
    bg.fillRect(0, 0, W, H);

    const gnd = this.add.graphics();
    gnd.fillStyle(0x5a3e2b);
    gnd.fillRect(0, GROUND_TOP, W, H - GROUND_TOP);
    gnd.fillStyle(0x7a5c3e);
    gnd.fillRect(0, GROUND_TOP, W, 6);

    this.groundBody = this.physics.add.staticImage(W / 2, GROUND_TOP + 10, "__DEFAULT")
      .setDisplaySize(W, 20).setVisible(false).refreshBody();

    this.teapotBody = this.physics.add.image(TEAPOT_X, GROUND_TOP - TEAPOT_R, "__DEFAULT")
      .setDisplaySize(TEAPOT_R * 2, TEAPOT_R * 2)
      .setVisible(false)
      .setCollideWorldBounds(true)
      .setMaxVelocity(1000, 900)
      .setMass(this.cfg.mass)
      .setDragX(this.cfg.drag);

    this.physics.world.gravity.y = this.cfg.gravity;
    this.teapotGfx = this.add.graphics();

    this.physics.add.collider(this.teapotBody, this.groundBody, () => {
      this.onGround = true;
      this.airJumpsUsed = 0;
    });

    this.bindKeys();
    this.createMobileButtons();
  }

  private createMobileButtons() {
    const jumpKeyCode = JUMP_KEY_ROTATION[(this.runIndex + 1) % JUMP_KEY_ROTATION.length];
    const isJumpRight = jumpKeyCode !== Phaser.Input.Keyboard.KeyCodes.DOWN;

    // left button
    const leftLabel = isJumpRight ? "SLAM" : "JUMP";
    const leftAction = isJumpRight ? () => this.handleSlam() : () => this.handleJump();

    // right button
    const rightLabel = isJumpRight ? "JUMP" : "SLAM";
    const rightAction = isJumpRight ? () => this.handleJump() : () => this.handleSlam();

    this.makeMobileBtn(0, H - 80, 160, 80, leftLabel, leftAction);
    this.makeMobileBtn(W - 160, H - 80, 160, 80, rightLabel, rightAction);
  }

  private makeMobileBtn(x: number, y: number, w: number, h: number, label: string, action: () => void) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 0.08);
    gfx.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 12);
    gfx.lineStyle(1, 0xffffff, 0.2);
    gfx.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 12);

    this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: "14px", color: "#ffffff88",
    }).setOrigin(0.5).setDepth(10);

    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive();
    zone.on("pointerdown", () => { if (!this.dead) action(); });
  }

  private bindKeys() {
    const jumpKeyCode = JUMP_KEY_ROTATION[(this.runIndex + 1) % JUMP_KEY_ROTATION.length];
    const slamKeyCode = jumpKeyCode === Phaser.Input.Keyboard.KeyCodes.DOWN
      ? Phaser.Input.Keyboard.KeyCodes.SPACE
      : Phaser.Input.Keyboard.KeyCodes.DOWN;

    const codeToPhaser: Record<string, number> = {
      Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ArrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      KeyS: Phaser.Input.Keyboard.KeyCodes.S,
      ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
    };

    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (this.dead) return;
      const pressed = codeToPhaser[event.code];
      if (pressed === undefined) return;
      if (pressed === jumpKeyCode) this.handleJump();
      else if (pressed === slamKeyCode) this.handleSlam();
    });
  }

  private handleJump() {
    if (this.dead) return;
    const now = this.time.now;
    if (now - this.lastJumpTime < 300) {
      this.keyMashCount++;
      if (this.keyMashCount >= 5) this.physics.world.gravity.y = 50;
    }
    this.lastJumpTime = now;
    this.jumpCount++;
    if (this.jumpCount % this.cfg.delayEvery === 0) {
      this.time.delayedCall(200, () => this.doJump());
    } else {
      this.doJump();
    }
  }

  private handleSlam() {
    if (this.dead || this.onGround) return;
    this.teapotBody.setVelocityY(Math.abs(this.cfg.jumpForce) * 1.5);
  }

  private doJump() {
    if (this.dead) return;
    const grounded = this.onGround || this.teapotBody.body.blocked.down;
    if (!grounded && this.airJumpsUsed >= this.maxAirJumps) return;
    const mass = Math.min(this.cfg.mass, 1.6);
    if (!grounded) {
      this.airJumpsUsed++;
      this.teapotBody.setVelocityY((this.cfg.jumpForce * 0.8) / mass);
      return;
    }
    this.onGround = false;
    this.airJumpsUsed = 0;
    this.teapotBody.setVelocityY(this.cfg.jumpForce / mass);
  }

  private spawnObstacle() {
    const baseH = Phaser.Math.Between(30, 65);
    const w = 20;
    const startX = W + w;
    const bodyY = GROUND_TOP - baseH / 2;

    // ~15% chance phantom, ~20% chance growing, ~15% chance reversing
    const roll = Math.random();
    const phantom = roll < 0.15;
    const growing = !phantom && roll < 0.35;
    const reversing = !phantom && !growing && roll < 0.50;

    const body = this.physics.add.image(startX, bodyY, "__DEFAULT")
      .setDisplaySize(w, baseH).setVisible(false)
      .setImmovable(true).setGravity(0, -this.cfg.gravity);

    const gfx = this.add.graphics();
    this.drawObstacle(gfx, w, baseH, phantom);
    gfx.x = startX;
    gfx.y = bodyY;

    this.obstacleList.push({
      body, gfx, w, baseH, h: baseH,
      growing, reversing, reverseTimer: reversing ? Phaser.Math.Between(800, 2000) : 0,
      phantom,
    });
  }

  private drawObstacle(gfx: Phaser.GameObjects.Graphics, w: number, h: number, phantom = false) {
    gfx.clear();
    const alpha = phantom ? 0.25 : 1;
    gfx.fillStyle(0xaa2222, alpha);
    gfx.fillRect(-w / 2, -h / 2, w, h);
    gfx.fillStyle(0xff5555, alpha);
    gfx.fillRect(-w / 2 - 3, -h / 2, w + 6, 8);
  }

  private checkCollisions() {
    if (this.dead) return;
    const tx = this.teapotBody.x;
    const ty = this.teapotBody.y;
    for (const obs of this.obstacleList) {
      if (obs.phantom) continue;
      const hw = obs.w / 2 + TEAPOT_R - 4;
      const hh = obs.h / 2 + TEAPOT_R - 4;
      if (Math.abs(tx - obs.body.x) < hw && Math.abs(ty - obs.body.y) < hh) {
        this.die();
        return;
      }
    }
  }

  private die() {
    this.dead = true;
    this.input.keyboard!.removeAllListeners();
    this.onEvent("death", {
      jumps: this.jumpCount,
      wallHugs: Math.floor(this.wallHugMs / 1000),
      keyMashCount: this.keyMashCount,
      survivedMs: this.survivalMs,
    });
    this.scene.pause();
  }

  private drawTeapot(x: number, y: number) {
    const g = this.teapotGfx;
    g.clear();
    g.fillStyle(0xe8d5b7);
    g.fillEllipse(x, y, 40, 34);
    g.fillStyle(0xd4c0a0);
    g.fillTriangle(x + 18, y - 3, x + 34, y - 9, x + 32, y + 5);
    g.lineStyle(4, 0xc4a882);
    g.strokeEllipse(x - 24, y, 12, 18);
    g.fillStyle(0xc4a882);
    g.fillEllipse(x, y - 18, 24, 7);
    g.fillStyle(0xe8d5b7);
    g.fillCircle(x, y - 23, 4);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(x - 2, y - 32, 5);
    g.fillCircle(x + 4, y - 38, 3);
  }

  update(_time: number, delta: number) {
    if (this.dead) return;

    this.survivalMs += delta;
    if (this.survivalMs >= 90000) { this.onEvent("win"); this.scene.pause(); return; }

    const t = this.survivalMs / 1000; // time in seconds for noise input

    // --- Noise-driven speed: drifts between 70%–130% of base, with a slow ramp ---
    const baseSpeed = this.cfg.speed + t * 8; // gentle long-term ramp
    const speedMod = this.speedNoise.range(t * 0.3, 0.7, 1.3);
    let scrollSpeed = Math.max(150, baseSpeed * speedMod);

    // --- Chaos: speed burst (1.8x for 2s, random ~every 12s) ---
    this.speedBurstTimer += delta;
    const burstInterval = this.spawnNoise.range(t * 0.1, 8000, 16000);
    if (!this.speedBurstActive && this.speedBurstTimer >= burstInterval) {
      this.speedBurstActive = true;
      this.speedBurstMs = 0;
      this.speedBurstTimer = 0;
    }
    if (this.speedBurstActive) {
      scrollSpeed *= 1.8;
      this.speedBurstMs += delta;
      if (this.speedBurstMs >= 2000) this.speedBurstActive = false;
    }

    // --- Noise-driven gravity: drifts ±15% of base ---
    if (this.physics.world.gravity.y > 60) { // don't override rage-float
      const gravMod = this.gravityNoise.range(t * 0.2, 0.85, 1.15);
      this.physics.world.gravity.y = this.cfg.gravity * gravMod;
    }

    // --- Chaos: gravity spike (2x for 800ms, random ~every 15s) ---
    this.gravitySpikeTimer += delta;
    const spikeInterval = this.gravityNoise.range(t * 0.05, 10000, 20000);
    if (!this.gravitySpikeActive && this.gravitySpikeTimer >= spikeInterval) {
      this.gravitySpikeActive = true;
      this.gravitySpikeMs = 0;
      this.gravitySpikeTimer = 0;
    }
    if (this.gravitySpikeActive) {
      this.physics.world.gravity.y = this.cfg.gravity * 2.2;
      this.gravitySpikeMs += delta;
      if (this.gravitySpikeMs >= 800) {
        this.gravitySpikeActive = false;
        this.physics.world.gravity.y = this.cfg.gravity;
      }
    }

    // --- Move + update obstacles ---
    for (let i = this.obstacleList.length - 1; i >= 0; i--) {
      const obs = this.obstacleList[i];

      // reversing: briefly moves toward player
      let dx = (scrollSpeed * delta) / 1000;
      if (obs.reversing && obs.reverseTimer > 0) {
        obs.reverseTimer -= delta;
        if (obs.reverseTimer <= 0) obs.reversing = false;
        // move right (toward player) at half speed
        dx = -(scrollSpeed * delta) / 2000;
      }

      const newX = obs.body.x - dx;
      obs.body.body.reset(newX, obs.body.y);
      obs.gfx.x = newX;

      // growing: obstacle gets taller as it approaches
      if (obs.growing && newX < W * 0.6) {
        const growFactor = Math.min(1.8, obs.h / obs.baseH + 0.0008 * delta);
        const newH = Math.min(obs.baseH * 1.8, obs.baseH * growFactor);
        if (newH !== obs.h) {
          obs.h = newH;
          const newBodyY = GROUND_TOP - newH / 2;
          obs.body.body.reset(newX, newBodyY);
          obs.gfx.y = newBodyY;
          this.drawObstacle(obs.gfx, obs.w, newH, obs.phantom);
        }
      }

      if (newX < -60) {
        obs.gfx.destroy();
        obs.body.destroy();
        this.obstacleList.splice(i, 1);
      }
    }

    this.checkCollisions();

    // --- Noise-driven spawn interval ---
    this.obstacleTimer += delta;
    const spawnInterval = this.spawnNoise.range(t * 0.15, 900, 2200);
    const clampedInterval = Math.max(700, spawnInterval - t * 5);
    if (this.obstacleTimer >= clampedInterval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    // wall hug
    if (this.teapotBody.x <= TEAPOT_X + 2) {
      this.wallHugMs += delta;
      if (this.wallHugMs > 2000) this.grip = Math.max(0.5, this.grip - 0.0005 * delta);
    }

    if (this.teapotBody.body.blocked.down) { this.onGround = true; this.airJumpsUsed = 0; }

    this.drawTeapot(this.teapotBody.x, this.teapotBody.y);
  }
}
