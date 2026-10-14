import { gsap } from 'gsap';

document.querySelectorAll<HTMLElement>('[data-code-scene]').forEach((scene) => {
  const stage = scene.querySelector<HTMLElement>('[data-code-stage]');
  const buttons = scene.querySelectorAll<HTMLButtonElement>('[data-code-mode]');
  const snippets = scene.querySelectorAll<HTMLElement>('[data-code-snippet]');
  const position = scene.querySelector<HTMLElement>('[data-code-position]');
  const media = gsap.matchMedia();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.codeMode!;
      scene.dataset.mode = mode;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      snippets.forEach((snippet) => { snippet.hidden = snippet.dataset.codeSnippet !== mode; });
      if (position) position.textContent = `0${index + 1} / ${button.textContent?.toLocaleUpperCase('es')}`;
      const active = scene.querySelector<HTMLElement>(`[data-code-snippet="${mode}"]`);
      if (active && !reduced.matches) gsap.fromTo(active, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.35, clearProps: 'all' });
    });
  });
  media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
    if (!stage) return;
    const rotateX = gsap.quickTo(stage, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const rotateY = gsap.quickTo(stage, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const move = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      rotateX(-(event.clientY - rect.top - rect.height / 2) / rect.height * 8);
      rotateY((event.clientX - rect.left - rect.width / 2) / rect.width * 10);
      scene.style.setProperty('--pointer-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
      scene.style.setProperty('--pointer-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
    };
    const leave = () => { rotateX(0); rotateY(0); };
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', leave);
    return () => { scene.removeEventListener('pointermove', move); scene.removeEventListener('pointerleave', leave); gsap.set(stage, { clearProps: 'transform' }); };
  });
});
