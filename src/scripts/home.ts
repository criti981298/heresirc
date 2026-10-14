import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (!reduceMotion) {
  gsap.from('.hero-enter', { opacity: 0, y: 28, duration: 0.85, stagger: 0.11, ease: 'power3.out', clearProps: 'all' });
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray<HTMLElement>('.section-title, .services-mini > div, .process-grid .steps > div, .package-card, .work-showcase').forEach((element) => {
    gsap.from(element, { opacity: 0, y: 28, duration: 0.7, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
  });
}
// 3D sutil y progresivo. Sin cursor fino o con movimiento reducido, se conserva la interfaz normal.
if (!reduceMotion && finePointer) {
  document.querySelectorAll<HTMLElement>('.panel3d').forEach((panel) => {
    const stage = panel.querySelector<HTMLElement>('.panel3d__stage');
    if (!stage) return;
    const rotateX = gsap.quickTo(stage, 'rotationX', { duration: 0.55, ease: 'power3.out' });
    const rotateY = gsap.quickTo(stage, 'rotationY', { duration: 0.55, ease: 'power3.out' });
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rotateX(-y * 12);
      rotateY(x * 12);
    });
    panel.addEventListener('pointerleave', () => { rotateX(0); rotateY(0); });
  });
}
