import * as Phaser from "phaser";
import type { PhysicsConfig } from "../lib/types";
import { DEFAULT_PHYSICS } from "../lib/types";

export type GameEventCallback = (event: "death" | "win", data?: unknown) => void;

const W = 800;
const H = 580;
const GROUND_TOP = 500;
const TEAPOT_R = 22;
const TEAPOT_X = 120;

// Jump key rotates each run: Space → Up → S → Down → repeat
// Starts at index 1 so run 1's real key is UP, but HUD shows SPACE (index 0)
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
  h: number;
}

export class RunnerScene extends Phaser.Scene {
  private teapotBody!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private teapotGfx!: Phaser.GameObjects.Graphics;
  private groundBody!: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private obstacleList: Obstacle[] = [];

  private cfg: PhysicsConfig = { ...DEFAULT_PHYSICS };
  private onEvent!: GameEventCallback;
  private runIndex = 0; // which run this is, for key rotation

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
  private scrollSpeed = 0;
  private dead = false;

  constructor() { super({ key: "RunnerScene" }); }

  init(data: { physics?: PhysicsConfig; onEvent?: GameEventCallback; runIndex?: number }) {
    this.cfg = data.physics ? { ...data.physics } : { ...DEFAULT_PHYSICS };
    this.onEvent = data.onEvent ?? (() => {});
    this.runIndex = data.runIndex ?? 0;
    console.log(`[RunnerScene] runIndex=${this.runIndex}, jumpKey=${JUMP_KEY_ROTATION[this.runIndex % JUMP_KEY_ROTATION.length]}`);
    this.jumpCount = 0;
    this.lastJumpTime = 0;
    this.keyMashCount = 0;
    this.wallHugMs = 0;
    this.survivalMs = 0;
    this.grip = 1;
    this.onGround = false;
    this.airJumpsUsed = 0;
    this.obstacleTimer = 0;
    this.scrollSpeed = this.cfg.speed;
    this.dead = false;
    this.obstacleList = [];
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
      .setDisplaySize(W, 20)
      .setVisible(false)
      .refreshBody();

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
  }

  private bindKeys() {
    // offset by 1: HUD shows index N, actual key is index N+1
    const jumpKeyCode = JUMP_KEY_ROTATION[(this.runIndex + 1) % JUMP_KEY_ROTATION.length];
    const slamKeyCode = jumpKeyCode === Phaser.Input.Keyboard.KeyCodes.DOWN
      ? Phaser.Input.Keyboard.KeyCodes.SPACE
      : Phaser.Input.Keyboard.KeyCodes.DOWN;

    const codeToPhaser: Record<string, number> = {
      Space:     Phaser.Input.Keyboard.KeyCodes.SPACE,
      ArrowUp:   Phaser.Input.Keyboard.KeyCodes.UP,
      KeyS:      Phaser.Input.Keyboard.KeyCodes.S,
      ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
    };

    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (this.dead) return;
      console.log("[key]", event.code, "jumpKey:", jumpKeyCode, "slamKey:", slamKeyCode);
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
      if (this.keyMashCount >= 5) {
        this.physics.world.gravity.y = 50;
      }
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
    const mass = Math.min(this.cfg.mass, 1.6); // cap mass so jump stays playable
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
    const h = Phaser.Math.Between(30, 65);
    const w = 20;
    const startX = W + w;
    const bodyY = GROUND_TOP - h / 2;

    const body = this.physics.add.image(startX, bodyY, "__DEFAULT")
      .setDisplaySize(w, h)
      .setVisible(false)
      .setImmovable(true)
      .setGravity(0, -this.cfg.gravity);

    const gfx = this.add.graphics();
    gfx.fillStyle(0xaa2222);
    gfx.fillRect(-w / 2, -h / 2, w, h);
    gfx.fillStyle(0xff5555);
    gfx.fillRect(-w / 2 - 3, -h / 2, w + 6, 8);
    gfx.x = startX;
    gfx.y = bodyY;

    this.obstacleList.push({ body, gfx, w, h });
  }

  private checkCollisions() {
    if (this.dead) return;
    const tx = this.teapotBody.x;
    const ty = this.teapotBody.y;
    for (const obs of this.obstacleList) {
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
    if (this.survivalMs >= 90000) {
      this.onEvent("win");
      this.scene.pause();
      return;
    }

    this.scrollSpeed = this.cfg.speed + this.survivalMs / 200;

    for (let i = this.obstacleList.length - 1; i >= 0; i--) {
      const obs = this.obstacleList[i];
      const newX = obs.body.x - (this.scrollSpeed * delta) / 1000;
      obs.body.body.reset(newX, obs.body.y);
      obs.gfx.x = newX;
      if (newX < -60) {
        obs.gfx.destroy();
        obs.body.destroy();
        this.obstacleList.splice(i, 1);
      }
    }

    this.checkCollisions();

    this.obstacleTimer += delta;
    const interval = Math.max(800, 1800 - this.survivalMs / 100);
    if (this.obstacleTimer >= interval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    if (this.teapotBody.x <= TEAPOT_X + 2) {
      this.wallHugMs += delta;
      if (this.wallHugMs > 2000) {
        this.grip = Math.max(0.5, this.grip - 0.0005 * delta);
      }
    }

    if (this.teapotBody.body.blocked.down) {
      this.onGround = true;
      this.airJumpsUsed = 0;
    }

    this.drawTeapot(this.teapotBody.x, this.teapotBody.y);
  }
}
