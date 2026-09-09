import { useEffect, useRef } from 'react';
import { useHaptic } from '@toss/tds-mobile';
import type { Weapon, WeaponId } from '../../game/weapons';
import { EffectEngine } from '../../game/particles';

const HAPTIC_TYPE_BY_WEAPON: Record<WeaponId, 'tickWeak' | 'tickMedium' | 'basicMedium'> = {
  match: 'tickWeak',
  molotov: 'tickMedium',
  grenade: 'basicMedium',
  pistol: 'tickMedium',
  machinegun: 'tickWeak',
  bazooka: 'basicMedium',
};

interface EffectCanvasProps {
  weapon: Weapon;
  onHit: (damage: number) => void;
  shakeTargetRef: React.RefObject<HTMLDivElement | null>;
}

/** 로드뷰 위에 겹쳐지는 탭-투-슛 캔버스. 탭한 위치에 졸라맨이 무기 액션을 하고, 이어서 파티클 이펙트가 터집니다. */
export function EffectCanvas({ weapon, onHit, shakeTargetRef }: EffectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(new EffectEngine());
  const lastFireAtRef = useRef(0);
  const haptic = useHaptic();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = performance.now();

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = parent.clientWidth * dpr;
      canvas!.height = parent.clientHeight * dpr;
      canvas!.style.width = `${parent.clientWidth}px`;
      canvas!.style.height = `${parent.clientHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    function loop(now: number) {
      const dt = Math.min(48, now - last);
      last = now;

      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;

      const engine = engineRef.current;
      engine.update(dt, width);

      ctx!.clearRect(0, 0, width, height);
      engine.draw(ctx!, width, height);

      const shakeTarget = shakeTargetRef.current;
      if (shakeTarget) {
        const { x, y } = engine.getShakeOffset();
        shakeTarget.style.transform = x || y ? `translate(${x}px, ${y}px)` : '';
      }

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [shakeTargetRef]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const now = performance.now();
    if (now - lastFireAtRef.current < weapon.cooldownMs) return;
    lastFireAtRef.current = now;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    engineRef.current.spawnHit(weapon.id, x, y, weapon.damage);
    onHit(weapon.damage);
    haptic.generate({ type: HAPTIC_TYPE_BY_WEAPON[weapon.id] });
  }

  return <canvas ref={canvasRef} className="effect-canvas" onPointerDown={handlePointerDown} />;
}
