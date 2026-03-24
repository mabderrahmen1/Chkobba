import gsap from 'gsap';

/** Strong horizontal shake for the felt / table (local UI). */
export function shakeTableElement(tableEl: HTMLElement | null, intensity = 1): void {
  if (!tableEl) return;
  gsap.killTweensOf(tableEl);
  gsap.set(tableEl, { x: 0, y: 0, rotation: 0 });
  const x = 10 * intensity;
  const y = 4 * intensity;
  gsap
    .timeline({
      onComplete: () => {
        gsap.set(tableEl, { clearProps: 'transform' });
      },
    })
    .to(tableEl, { x: -x, y: y * 0.4, rotation: -0.6, duration: 0.04, ease: 'power1.out' })
    .to(tableEl, { x: x * 0.95, y: -y * 0.35, rotation: 0.55, duration: 0.04, ease: 'power1.inOut' })
    .to(tableEl, { x: -x * 0.75, y: y * 0.25, rotation: -0.4, duration: 0.045, ease: 'power1.inOut' })
    .to(tableEl, { x: x * 0.65, y: -y * 0.2, rotation: 0.35, duration: 0.045, ease: 'power1.inOut' })
    .to(tableEl, { x: -x * 0.45, y: y * 0.12, rotation: -0.22, duration: 0.05, ease: 'power1.inOut' })
    .to(tableEl, { x: x * 0.3, y: -y * 0.08, rotation: 0.15, duration: 0.05, ease: 'power1.inOut' })
    .to(tableEl, { x: 0, y: 0, rotation: 0, duration: 0.12, ease: 'power2.out' });
}

/** Whole-app nudge so the “screen” feels the hit (subtle vs. table). */
export function shakeAppChrome(appEl: HTMLElement | null, intensity = 1): void {
  if (!appEl) return;
  gsap.killTweensOf(appEl);
  gsap.set(appEl, { x: 0, y: 0, rotation: 0 });
  const x = 5 * intensity;
  gsap
    .timeline({
      onComplete: () => {
        gsap.set(appEl, { clearProps: 'transform' });
      },
    })
    .to(appEl, { x: -x, duration: 0.035, ease: 'power1.out' })
    .to(appEl, { x: x * 0.9, duration: 0.035, ease: 'power1.inOut' })
    .to(appEl, { x: -x * 0.55, duration: 0.038, ease: 'power1.inOut' })
    .to(appEl, { x: x * 0.35, duration: 0.04, ease: 'power1.inOut' })
    .to(appEl, { x: 0, duration: 0.1, ease: 'power2.out' });
}
