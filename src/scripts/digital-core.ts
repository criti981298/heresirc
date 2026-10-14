import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.querySelector<HTMLElement>('[data-digital-core]');
if (host) createCore(host);

function createCore(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  const hero = host.closest<HTMLElement>('.hero')!;
  const toggle = document.querySelector<HTMLButtonElement>('[data-core-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { host.classList.add('no-webgl'); if (toggle) toggle.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 80);
  camera.position.set(6, 7, 10);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf6f5f0, 0x30352e, 3));
  const key = new THREE.DirectionalLight(0xf6f5f0, 5);
  key.position.set(-4, 8, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcbd7c4, 3);
  rim.position.set(5, 3, -5); scene.add(rim);
  const assembly = new THREE.Group(); scene.add(assembly);
  const layers: THREE.Group[] = [];
  const sage = new THREE.MeshStandardMaterial({ color: 0x9cac9a, roughness: .33, metalness: .65 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe4e1d8, roughness: .4, metalness: .25 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x30352e, roughness: .32, metalness: .65 });
  const light = new THREE.MeshStandardMaterial({ color: 0xcbd7c4, emissive: 0xcbd7c4, emissiveIntensity: .75, roughness: .4 });
  const box = (x: number, y: number, z: number, material: THREE.Material, radius = .08) => new THREE.Mesh(new RoundedBoxGeometry(x, y, z, 3, radius), material);
  for (let i = 0; i < 4; i++) {
    const layer = new THREE.Group();
    const plate = box(3.8 - i * .12, .18, 3.8 - i * .12, i === 3 ? ivory : i % 2 ? sage : charcoal);
    layer.add(plate);
    // Conductive tracks and contacts are physical geometry, visible in parallax.
    for (let side = 0; side < 4; side++) {
      const contacts = new THREE.Group(); contacts.rotation.y = side * Math.PI / 2;
      for (let j = 0; j < 11; j++) {
        const contact = box(.055, .045, .27, i % 2 ? ivory : sage, .015);
        contact.position.set(-1.35 + j * .27, .12, 1.7 - i * .06); contacts.add(contact);
      }
      layer.add(contacts);
    }
    if (i < 3) {
      const pathMaterial = new THREE.LineBasicMaterial({ color: 0xcbd7c4, transparent: true, opacity: .6 });
      for (let j = 0; j < 7; j++) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.5, .105, -1.3 + j * .4), new THREE.Vector3(-.9 + j * .12, .105, -1.3 + j * .4),
          new THREE.Vector3(-.5 + j * .12, .105, -.9 + j * .4), new THREE.Vector3(1.4, .105, -.9 + j * .4),
        ]), pathMaterial); layer.add(line);
      }
    }
    layers.push(layer); assembly.add(layer);
  }
  // Original brand mark on the upper ceramic face.
  const texture = new THREE.TextureLoader().load('/brand/here-sirc-logo.png', () => schedule());
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshStandardMaterial({ map: texture, color: 0xf6f5f0, roughness: .6 }));
  badge.rotation.x = -Math.PI / 2; badge.position.y = .105; layers[3].add(badge);
  const dots: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), light);
    dot.position.set(Math.cos(i / 8 * Math.PI * 2) * 2.7, .1, Math.sin(i / 8 * Math.PI * 2) * 2.7);
    assembly.add(dot); dots.push(dot);
  }
  const grid = new THREE.GridHelper(18, 36, 0x9cac9a, 0x9cac9a);
  grid.position.y = -1.5;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = .12;
  scene.add(grid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.15, .008, 6, 100), sage);
  ring.rotation.x = Math.PI / 2; ring.position.y = -1.1; scene.add(ring);
  let paused = reduced.matches, frame = 0, last = 0, time = 0, visible = true, disposed = false;
  let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0;
  let mode = 'design';
  let expansion = 0;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const mobile = width < 700;
    camera.position.set(mobile ? 7 : 6, mobile ? 8 : 7, mobile ? 12 : 10);
    camera.lookAt(0, 0, 0); schedule();
  }
  function draw(now: number) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    if (!paused) time += last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    const rect = hero.getBoundingClientRect();
    const progress = THREE.MathUtils.clamp(-rect.top / Math.max(1, hero.offsetHeight - innerHeight), 0, 1);
    const targetExpansion = mode === 'space' ? 1.1 : mode === 'motion' ? .65 : .2;
    expansion += ((paused ? targetExpansion : targetExpansion + progress * .8) - expansion) * .055;
    rotationX += ((paused ? 0 : pointerY * .12) - rotationX) * .04;
    rotationY += ((paused ? 0 : pointerX * .18) - rotationY) * .04;
    assembly.rotation.set(rotationX, -.35 + rotationY + (paused ? 0 : Math.sin(time * .16) * .08 + progress * .65), -.08);
    layers.forEach((layer, i) => {
      layer.position.y = (i - 1.5) * (.26 + expansion * .6);
      layer.position.x = mode === 'motion' && !paused ? Math.sin(time * .6 + i * .65) * .12 : 0;
      layer.rotation.y = mode === 'space' ? (i - 1.5) * .045 : 0;
    });
    dots.forEach((dot, i) => { dot.position.y = .15 + Math.sin(time * .7 + i) * (paused ? 0 : .13); });
    renderer.render(scene, camera);
    if (!paused) schedule();
  }
  function schedule() { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  const move = (event: PointerEvent) => { pointerX = event.clientX / innerWidth * 2 - 1; pointerY = event.clientY / innerHeight * 2 - 1; };
  const onMode = (event: Event) => { mode = (event as CustomEvent<string>).detail; schedule(); };
  const scroll = () => schedule();
  const visibility = () => { last = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
  function sync() { toggle?.setAttribute('aria-pressed', String(paused)); if (toggle) toggle.textContent = paused ? 'Activar escena' : 'Pausar escena'; schedule(); }
  const click = () => { paused = !paused; last = 0; sync(); };
  const motionChange = () => { paused = reduced.matches; sync(); };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; } }); intersection.observe(host);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('heresirc:scene-mode', onMode);
  document.addEventListener('visibilitychange', visibility);
  toggle?.addEventListener('click', click); reduced.addEventListener('change', motionChange);
  function cleanup(event: PageTransitionEvent) {
    if (event.persisted) return;
    disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
    window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scroll); window.removeEventListener('heresirc:scene-mode', onMode);
    document.removeEventListener('visibilitychange', visibility); toggle?.removeEventListener('click', click); reduced.removeEventListener('change', motionChange);
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => { if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach((material: THREE.Material) => materials.add(material)); } });
    materials.forEach((material) => material.dispose()); texture.dispose(); renderer.dispose();
  }
  window.addEventListener('pagehide', cleanup, { once: true });
  resize(); sync();
}
