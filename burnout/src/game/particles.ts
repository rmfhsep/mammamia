import type { WeaponId } from './weapons';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  kind: 'flame' | 'spark' | 'smoke' | 'debris';
}

interface ScorchMark {
  x: number;
  y: number;
  r: number;
}

interface FlameSource {
  x: number;
  y: number;
  strength: number;
  nextSpawn: number;
}

interface CharacterAnim {
  x: number;
  y: number;
  weaponId: WeaponId;
  damage: number;
  age: number;
  life: number;
  triggerAt: number;
  triggered: boolean;
}

/** 건물 표면에 서서히 드러나는 균열. 좌표는 캔버스 크기에 안 흔들리도록 0~1 정규화 좌표로 둔다. */
interface CrackPath {
  points: { nx: number; ny: number }[];
  revealAt: number;
}

const FLAME_COLORS = ['#FFD54F', '#FF7043', '#FF3D00', '#D84315'];
const SMOKE_COLOR = 'rgba(60,60,60,0.5)';
const MAX_SCORCH_MARKS = 200;
const MAX_FLAME_SOURCES = 24;
const CRACK_COUNT = 14;
const CRACK_MIN_DAMAGE = 40;
const CRACK_MAX_DAMAGE = 900;
const HAZE_START_DAMAGE = 30;
const HAZE_FULL_DAMAGE = 1200;
const HAZE_MAX_OPACITY = 0.35;
const DEBRIS_START_DAMAGE = 40;

// 무기별 졸라맨 액션 애니메이션 길이(ms)와, 그중 몇 %가 지났을 때 실제 이펙트(발화/폭발)가
// 터질지를 정의합니다. "던지는 동작" 도중에 임팩트가 나야 자연스러워서 즉시 터뜨리지 않습니다.
const CHARACTER_LIFE_MS: Record<WeaponId, number> = {
  match: 480,
  molotov: 560,
  grenade: 640,
  pistol: 420,
  machinegun: 520,
  bazooka: 480,
};

const CHARACTER_TRIGGER_FRACTION: Record<WeaponId, number> = {
  match: 0.42,
  molotov: 0.5,
  grenade: 0.55,
  pistol: 0.35,
  machinegun: 0.32,
  bazooka: 0.32,
};

// 총 계열은 발사 뒤에도 총구 화염이 잠깐만(이 비율만큼) 보이다 사라집니다.
const MUZZLE_FLASH_WINDOW: Partial<Record<WeaponId, number>> = {
  pistol: 0.18,
  machinegun: 0.35,
  bazooka: 0.22,
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function lerp(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return a + (b - a) * clamped;
}

/** 화면 위 졸라맨 액션 + 불꽃/폭발/그을음 이펙트를 관리하는 경량 캔버스 파티클 엔진입니다. */
export class EffectEngine {
  private particles: Particle[] = [];
  private scorchMarks: ScorchMark[] = [];
  private flameSources: FlameSource[] = [];
  private characters: CharacterAnim[] = [];
  private cracks: CrackPath[] = this.generateCracks();
  private shakeMagnitude = 0;
  private shakeTime = 0;
  /** 이 건물(현재 뷰)에 지금까지 누적된 타격 데미지. 균열/파편/연무 강도를 여기서 끌어낸다. */
  private totalDamage = 0;
  private debrisSpawnTimer = 0;

  spawnHit(weaponId: WeaponId, x: number, y: number, damage: number): void {
    this.characters.push({
      x,
      y,
      weaponId,
      damage,
      age: 0,
      life: CHARACTER_LIFE_MS[weaponId],
      triggerAt: CHARACTER_TRIGGER_FRACTION[weaponId],
      triggered: false,
    });
  }

  clear(): void {
    this.particles = [];
    this.scorchMarks = [];
    this.flameSources = [];
    this.characters = [];
    this.cracks = this.generateCracks();
    this.shakeMagnitude = 0;
    this.shakeTime = 0;
    this.totalDamage = 0;
    this.debrisSpawnTimer = 0;
  }

  update(dt: number, width: number): void {
    for (const character of this.characters) {
      character.age += dt;
      const t = character.age / character.life;
      if (!character.triggered && t >= character.triggerAt) {
        character.triggered = true;
        this.totalDamage += character.damage;
        this.triggerImpact(character.weaponId, character.x, character.y);
      }
    }
    this.characters = this.characters.filter((character) => character.age < character.life);

    for (const particle of this.particles) {
      particle.age += dt;
      particle.x += (particle.vx * dt) / 1000;
      particle.y += (particle.vy * dt) / 1000;
      if (particle.kind === 'flame' || particle.kind === 'smoke') {
        particle.vy -= (dt / 1000) * 30;
      }
      if (particle.kind === 'debris') {
        particle.vy += (dt / 1000) * 220;
      }
    }
    this.particles = this.particles.filter((particle) => particle.age < particle.life);

    for (const source of this.flameSources) {
      source.nextSpawn -= dt;
      if (source.nextSpawn <= 0) {
        this.particles.push(this.makeFlame(source.x + rand(-6, 6), source.y, source.strength));
        if (Math.random() < 0.3) this.particles.push(this.makeSmoke(source.x, source.y));
        source.nextSpawn = rand(60, 140) / source.strength;
      }
    }

    if (this.totalDamage > DEBRIS_START_DAMAGE) {
      this.debrisSpawnTimer -= dt;
      if (this.debrisSpawnTimer <= 0) {
        this.debrisSpawnTimer = Math.max(350, 3200 - this.totalDamage * 2.4) + rand(-100, 100);
        this.particles.push(this.makeFallingDebris(rand(width * 0.1, width * 0.9), -10));
      }
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeMagnitude = 0;
    }

    if (this.scorchMarks.length > MAX_SCORCH_MARKS) {
      this.scorchMarks.splice(0, this.scorchMarks.length - MAX_SCORCH_MARKS);
    }
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.shakeMagnitude <= 0) return { x: 0, y: 0 };
    const decay = Math.max(0, this.shakeTime) / 450;
    const magnitude = this.shakeMagnitude * Math.min(1, decay + 0.15);
    return { x: rand(-magnitude, magnitude), y: rand(-magnitude, magnitude) };
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const mark of this.scorchMarks) {
      const gradient = ctx.createRadialGradient(mark.x, mark.y, 0, mark.x, mark.y, mark.r);
      gradient.addColorStop(0, 'rgba(20,15,12,0.85)');
      gradient.addColorStop(0.6, 'rgba(30,20,15,0.55)');
      gradient.addColorStop(1, 'rgba(30,20,15,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, mark.r, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawCracks(ctx, width, height);
    this.drawCharacters(ctx);

    for (const particle of this.particles) {
      const t = particle.age / particle.life;
      const alpha = particle.kind === 'smoke' ? (1 - t) * 0.5 : 1 - t;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = particle.color;
      const size =
        particle.kind === 'smoke' ? particle.size * (0.6 + t * 0.8) : particle.size * (1 - t * 0.4);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawHaze(ctx, width, height);
  }

  // ── 건물 손상 누적(균열/파편/연무) ─────────────────────────

  private generateCracks(): CrackPath[] {
    const cracks: CrackPath[] = [];
    for (let i = 0; i < CRACK_COUNT; i++) {
      let cx = rand(0.08, 0.92);
      let cy = rand(0.15, 0.85);
      const points = [{ nx: cx, ny: cy }];
      let angle = rand(0, Math.PI * 2);
      const segments = Math.round(rand(3, 5));
      for (let s = 0; s < segments; s++) {
        angle += rand(-0.9, 0.9);
        const len = rand(0.03, 0.09);
        cx = Math.min(0.98, Math.max(0.02, cx + Math.cos(angle) * len));
        cy = Math.min(0.98, Math.max(0.02, cy + Math.sin(angle) * len));
        points.push({ nx: cx, ny: cy });
      }
      cracks.push({
        points,
        revealAt: CRACK_MIN_DAMAGE + i * ((CRACK_MAX_DAMAGE - CRACK_MIN_DAMAGE) / CRACK_COUNT) + rand(-20, 20),
      });
    }
    return cracks;
  }

  private drawCracks(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.totalDamage < CRACK_MIN_DAMAGE) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,12,10,0.55)';
    ctx.lineWidth = 1.8;
    for (const crack of this.cracks) {
      if (this.totalDamage < crack.revealAt) continue;
      ctx.beginPath();
      crack.points.forEach((p, i) => {
        const px = p.nx * width;
        const py = p.ny * height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  }

  private drawHaze(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.totalDamage < HAZE_START_DAMAGE) return;
    const strength =
      HAZE_MAX_OPACITY *
      Math.min(1, (this.totalDamage - HAZE_START_DAMAGE) / (HAZE_FULL_DAMAGE - HAZE_START_DAMAGE));
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    gradient.addColorStop(0, `rgba(40,35,32,${strength})`);
    gradient.addColorStop(1, 'rgba(40,35,32,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height * 0.55);
  }

  private makeFallingDebris(x: number, y: number): Particle {
    return {
      x,
      y,
      vx: rand(-15, 15),
      vy: rand(40, 80),
      age: 0,
      life: rand(1800, 2600),
      size: rand(3, 7),
      color: pick(['#5D4037', '#3E2723', '#8D6E63', '#78909C']),
      kind: 'debris',
    };
  }

  // ── 졸라맨 액션 ─────────────────────────────────────────

  private drawCharacters(ctx: CanvasRenderingContext2D): void {
    for (const character of this.characters) {
      const t = Math.min(1, character.age / character.life);
      this.drawCharacter(ctx, character.x, character.y, character.weaponId, t);
    }
  }

  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    weaponId: WeaponId,
    t: number,
  ): void {
    const fadeIn = Math.min(1, t / 0.12);
    const fadeOut = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0) return;

    const triggerAt = CHARACTER_TRIGGER_FRACTION[weaponId];
    const kick =
      weaponId === 'bazooka' && t > triggerAt
        ? Math.max(0, 1 - (t - triggerAt) / 0.25) * -6
        : 0;

    const originX = x + kick;
    const hipY = y - 20;
    const shoulderY = y - 34;
    const headY = y - 42;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 다리
    this.strokeSegment(ctx, originX, hipY, originX - 7, y);
    this.strokeSegment(ctx, originX, hipY, originX + 7, y);
    // 몸통
    this.strokeSegment(ctx, originX, hipY, originX, shoulderY);

    const armAngleDeg = this.actionArmAngle(weaponId, t);
    const armRad = (armAngleDeg * Math.PI) / 180;
    const armLen = weaponId === 'bazooka' ? 20 : 16;
    const dirX = Math.sin(armRad);
    const dirY = Math.cos(armRad);
    const handX = originX + dirX * armLen;
    const handY = shoulderY + dirY * armLen;

    // 반대쪽 팔(고정 포즈)
    this.strokeSegment(ctx, originX, shoulderY, originX - 10, shoulderY + 12);
    // 액션 팔
    this.strokeSegment(ctx, originX, shoulderY, handX, handY);
    // 손에 든 무기
    this.drawWeaponProp(ctx, weaponId, handX, handY, dirX, dirY, t, triggerAt);

    // 머리
    ctx.beginPath();
    ctx.arc(originX, headY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD9B0';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#33261F';
    ctx.stroke();

    ctx.restore();
  }

  /** 무기별로 액션 팔이 시간(t: 0~1)에 따라 어떤 각도(도, 0=아래로 수직)로 움직이는지 정의합니다. */
  private actionArmAngle(weaponId: WeaponId, t: number): number {
    switch (weaponId) {
      case 'match':
        if (t < 0.42) return 10 + Math.sin(t * 40) * 18; // 성냥 긋는 짧은 왕복 동작
        return -55; // 불 붙은 성냥을 들어올림
      case 'molotov':
        if (t < 0.35) return lerp(-30, -150, t / 0.35);
        if (t < 0.5) return lerp(-150, 75, (t - 0.35) / 0.15);
        return lerp(75, 45, (t - 0.5) / 0.5);
      case 'grenade':
        if (t < 0.25) return lerp(5, -35, t / 0.25);
        if (t < 0.5) return lerp(-35, -140, (t - 0.25) / 0.25);
        if (t < 0.55) return lerp(-140, 80, (t - 0.5) / 0.05);
        return lerp(80, 50, (t - 0.55) / 0.45);
      case 'pistol':
        if (t < 0.3) return lerp(20, 78, t / 0.3); // 조준
        if (t < 0.55) return 78; // 발사
        return lerp(78, 55, (t - 0.55) / 0.45);
      case 'machinegun':
        if (t < 0.25) return lerp(15, 72, t / 0.25);
        if (t < 0.7) return 72 + Math.sin(t * 90) * 4; // 연사 중 흔들림
        return lerp(72, 50, (t - 0.7) / 0.3);
      case 'bazooka':
        return 72;
    }
  }

  /** 액션 팔이 잡고 있는 손 위치(handX,handY)와 조준 방향(dirX,dirY)을 따라 무기 소품을 그립니다. */
  private drawWeaponProp(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    handX: number,
    handY: number,
    dirX: number,
    dirY: number,
    t: number,
    triggerAt: number,
  ): void {
    const perpX = -dirY;
    const perpY = dirX;
    const flashWindow = MUZZLE_FLASH_WINDOW[weaponId];
    const justFired = flashWindow != null && t >= triggerAt && t - triggerAt < flashWindow;

    switch (weaponId) {
      case 'match': {
        const lit = t >= triggerAt;
        const tipX = handX + dirX * 14;
        const tipY = handY + dirY * 14;
        this.strokeSegment(ctx, handX, handY, tipX, tipY, 2.5);
        ctx.beginPath();
        ctx.arc(tipX, tipY, lit ? 4 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = lit ? '#FFCA28' : '#B23A1F';
        ctx.fill();
        if (lit) this.drawGlow(ctx, tipX, tipY, 10, 'rgba(255,214,0,0.85)');
        break;
      }
      case 'molotov': {
        if (t >= triggerAt) break; // 던진 뒤엔 손이 빈다
        const tipX = handX + dirX * 16;
        const tipY = handY + dirY * 16;
        this.strokeSegment(ctx, handX, handY, tipX, tipY, 7);
        const wickX = tipX + perpX * 3;
        const wickY = tipY + perpY * 3 - 3;
        this.strokeSegment(ctx, tipX, tipY, wickX, wickY, 1.8);
        ctx.beginPath();
        ctx.arc(wickX, wickY, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9800';
        ctx.fill();
        break;
      }
      case 'grenade': {
        if (t >= triggerAt) break;
        const cx = handX + dirX * 10;
        const cy = handY + dirY * 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#6B7A3D';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#33261F';
        ctx.stroke();
        this.strokeSegment(ctx, cx - perpX * 2, cy - dirY * 6 - 2, cx + perpX, cy - dirY * 10, 2);
        break;
      }
      case 'pistol': {
        const tipX = handX + dirX * 14;
        const tipY = handY + dirY * 14;
        this.strokeSegment(ctx, handX, handY, tipX, tipY, 4);
        const gripX = handX - dirX * 3 + perpX * 6;
        const gripY = handY - dirY * 3 + perpY * 6;
        this.strokeSegment(ctx, handX, handY, gripX, gripY, 5);
        if (justFired) this.drawGlow(ctx, tipX, tipY, 8, 'rgba(255,224,130,0.9)');
        break;
      }
      case 'machinegun': {
        const tipX = handX + dirX * 20;
        const tipY = handY + dirY * 20;
        this.strokeSegment(ctx, handX, handY, tipX, tipY, 5);
        const stockX = handX - dirX * 9;
        const stockY = handY - dirY * 9;
        this.strokeSegment(ctx, handX, handY, stockX, stockY, 5);
        const gripBaseX = handX + dirX * 6;
        const gripBaseY = handY + dirY * 6;
        this.strokeSegment(ctx, gripBaseX, gripBaseY, gripBaseX + perpX * 8, gripBaseY + perpY * 8, 3.5);
        if (justFired) this.drawGlow(ctx, tipX, tipY, 10, 'rgba(255,224,130,0.9)');
        break;
      }
      case 'bazooka': {
        const tipX = handX + dirX * 30;
        const tipY = handY + dirY * 30;
        this.strokeSegment(ctx, handX, handY, tipX, tipY, 8);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#B0BEC5';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#263238';
        ctx.fill();
        if (justFired) this.drawGlow(ctx, tipX, tipY, 20, 'rgba(255,224,130,0.95)');
        break;
      }
    }
  }

  private drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private strokeSegment(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 3,
  ): void {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = width + 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = '#33261F';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ── 이펙트 임팩트(발화/폭발) ─────────────────────────────

  private triggerImpact(weaponId: WeaponId, x: number, y: number): void {
    switch (weaponId) {
      case 'match':
        this.igniteMatch(x, y);
        break;
      case 'molotov':
        this.burstMolotov(x, y);
        break;
      case 'grenade':
        this.burstGrenade(x, y);
        break;
      case 'pistol':
        this.burstPistol(x, y);
        break;
      case 'machinegun':
        this.burstMachinegun(x, y);
        break;
      case 'bazooka':
        this.burstBazooka(x, y);
        break;
    }
  }

  private igniteMatch(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(7, 11) });
    for (let i = 0; i < 14; i++) this.particles.push(this.makeFlame(x, y, 0.75));
    for (let i = 0; i < 5; i++) this.particles.push(this.makeSpark(x, y));
    this.addShake(2, 90);
    this.addFlameSource(x, y, 0.35);
  }

  private burstMolotov(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(18, 26) });
    for (let i = 0; i < 22; i++) this.particles.push(this.makeFlame(x, y, 1.1));
    for (let i = 0; i < 10; i++) this.particles.push(this.makeSpark(x, y));
    this.addShake(4, 180);
    this.addFlameSource(x, y, 0.5);
  }

  private burstGrenade(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(34, 44) });
    for (let i = 0; i < 26; i++) this.particles.push(this.makeFlame(x, y, 1.6));
    for (let i = 0; i < 18; i++) this.particles.push(this.makeDebris(x, y));
    for (let i = 0; i < 14; i++) this.particles.push(this.makeSmoke(x, y));
    this.addShake(9, 320);
    this.addFlameSource(x, y, 1);
  }

  private burstPistol(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(14, 20) });
    for (let i = 0; i < 16; i++) this.particles.push(this.makeFlame(x, y, 0.9));
    for (let i = 0; i < 8; i++) this.particles.push(this.makeSpark(x, y));
    this.addShake(3, 140);
    this.addFlameSource(x, y, 0.4);
  }

  private burstMachinegun(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(10, 15) });
    for (let i = 0; i < 10; i++) this.particles.push(this.makeFlame(x, y, 0.6));
    for (let i = 0; i < 12; i++) this.particles.push(this.makeSpark(x, y));
    this.addShake(1.5, 70);
    this.addFlameSource(x, y, 0.3);
  }

  private burstBazooka(x: number, y: number): void {
    this.scorchMarks.push({ x, y, r: rand(52, 68) });
    for (let i = 0; i < 40; i++) this.particles.push(this.makeFlame(x, y, 2.2));
    for (let i = 0; i < 28; i++) this.particles.push(this.makeDebris(x, y));
    for (let i = 0; i < 24; i++) this.particles.push(this.makeSmoke(x, y));
    this.addShake(16, 450);
    this.addFlameSource(x, y, 1.8);
  }

  private addFlameSource(x: number, y: number, strength: number): void {
    if (this.flameSources.length >= MAX_FLAME_SOURCES) return;
    this.flameSources.push({ x, y, strength, nextSpawn: 0 });
  }

  private addShake(magnitude: number, durationMs: number): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTime = Math.max(this.shakeTime, durationMs);
  }

  private makeFlame(x: number, y: number, power: number): Particle {
    const angle = rand(-Math.PI, 0) - Math.PI / 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * rand(20, 60) * power,
      vy: Math.sin(angle) * rand(40, 90) * power - 20,
      age: 0,
      life: rand(320, 620),
      size: rand(4, 9) * power,
      color: pick(FLAME_COLORS),
      kind: 'flame',
    };
  }

  private makeSpark(x: number, y: number): Particle {
    const angle = rand(0, Math.PI * 2);
    return {
      x,
      y,
      vx: Math.cos(angle) * rand(60, 160),
      vy: Math.sin(angle) * rand(60, 160),
      age: 0,
      life: rand(260, 420),
      size: rand(1.5, 3),
      color: '#FFEB3B',
      kind: 'spark',
    };
  }

  private makeDebris(x: number, y: number): Particle {
    const angle = rand(0, Math.PI * 2);
    return {
      x,
      y,
      vx: Math.cos(angle) * rand(80, 220),
      vy: Math.sin(angle) * rand(80, 220) - 60,
      age: 0,
      life: rand(500, 900),
      size: rand(2, 5),
      color: pick(['#5D4037', '#3E2723', '#8D6E63']),
      kind: 'debris',
    };
  }

  private makeSmoke(x: number, y: number): Particle {
    const angle = rand(-Math.PI, 0) - Math.PI / 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * rand(10, 30),
      vy: Math.sin(angle) * rand(20, 40) - 20,
      age: 0,
      life: rand(900, 1500),
      size: rand(10, 22),
      color: SMOKE_COLOR,
      kind: 'smoke',
    };
  }
}
