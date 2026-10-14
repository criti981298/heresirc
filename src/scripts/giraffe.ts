import * as THREE from 'three';
import { createGiraffeHead } from './giraffe-model';

// The scene uses screen pixels, with the animal anchored in document space.
// Only a viewport-sized piece of the continuous neck is sent to the GPU.
const root = document.querySelector<HTMLElement>('[data-giraffe-experience]');
if (root) void initGiraffe(root);

async function initGiraffe(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-giraffe-canvas]');
  const anchor = document.querySelector<HTMLElement>('[data-giraffe-anchor]');
  const rail = root.querySelector<HTMLElement>('[data-giraffe-rail]');
  const footer = document.querySelector<HTMLElement>('.site-footer');
  const toggle = root.querySelector<HTMLButtonElement>('[data-giraffe-toggle]');
  const label = root.querySelector<HTMLElement>('[data-giraffe-toggle-label]');
  if (!canvas || !anchor || !rail || !footer) return;
  const fallback = setupFallback(root, anchor, rail, footer);

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.hidden = true;
    fallback.activate();
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 2500);
  camera.position.z = 1000;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6b6b, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.7);
  key.position.set(-400, 600, 850);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -350, right: 350, top: 350, bottom: -350, near: 10, far: 2000 });
  key.shadow.normalBias = 0.7;
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(650, 250, 400);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(150, 300, -250);
  scene.add(rim);

  const head = createGiraffeHead();
  head.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true; });
  scene.add(head);
  const sourceCoat = head.userData.coat as THREE.MeshPhysicalMaterial;
  const coat = sourceCoat.clone();
  coat.onBeforeCompile = sourceCoat.onBeforeCompile;
  coat.defines = { GIRAFFE_CUSTOM_COAT_POSITION: '' };
  coat.customProgramCacheKey = () => 'giraffe-continuous-neck-v2';
  coat.side = THREE.DoubleSide;
  const segments = 100;
  const sides = 36;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((segments + 1) * (sides + 1) * 3);
  const normals = new Float32Array(positions.length);
  const coatPositions = new Float32Array(positions.length);
  const uvs = new Float32Array((segments + 1) * (sides + 1) * 2);
  const indices: number[] = [];
  for (let row = 0; row < segments; row++) {
    for (let side = 0; side < sides; side++) {
      const a = row * (sides + 1) + side;
      const b = a + sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('coatPosition', new THREE.BufferAttribute(coatPositions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  const neck = new THREE.Mesh(geometry, coat);
  neck.receiveShadow = true;
  neck.frustumCulled = false;
  scene.add(neck);

  const maneGeometry = new THREE.BufferGeometry();
  const manePositions = new Float32Array((segments + 1) * 2 * 3);
  const maneIndices: number[] = [];
  for (let row = 0; row < segments; row++) {
    const a = row * 2;
    maneIndices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
  }
  maneGeometry.setAttribute('position', new THREE.BufferAttribute(manePositions, 3).setUsage(THREE.DynamicDrawUsage));
  maneGeometry.setIndex(maneIndices);
  const mane = new THREE.Mesh(maneGeometry, new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 1, side: THREE.DoubleSide }));
  mane.frustumCulled = false;
  scene.add(mane);

  let width = 0;
  let height = 0;
  let headX = 0;
  let headY = 0;
  let railX = 0;
  let endY = 0;
  let scale = 90;
  let mobile = false;
  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  let paused = motion.matches;
  let inView = false;
  let dirty = true;
  let destroyed = false;
  let contextLost = false;
  let targetX = 0;
  let targetY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let headYaw = 0.75;
  let measureFrame = 0;

  const smooth = (value: number) => {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };

  function measure() {
    measureFrame = 0;
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    mobile = width <= 920;
    const rect = anchor!.getBoundingClientRect();
    const railRect = rail!.getBoundingClientRect();
    const availableHeadWidth = mobile ? rect.width : Math.min(rect.width, railRect.width + 20);
    scale = Math.min(availableHeadWidth / 2.15, rect.height / 2.66);
    headX = rect.left + rect.width * 0.5;
    headY = rect.top + window.scrollY + rect.height * 0.94;
    railX = railRect.left + railRect.width * 0.5;
    endY = footer!.getBoundingClientRect().bottom + window.scrollY + 70;
    camera.left = 0;
    camera.right = width;
    camera.top = height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    renderer.setSize(width, height, false);
    head.scale.setScalar(scale);
    dirty = true;
    schedule();
  }

  function centerAt(y: number, time: number) {
    const distance = Math.max(0, y - headY);
    const join = smooth(distance / (mobile ? 140 : 450));
    const base = THREE.MathUtils.lerp(headX, railX, join);
    const amplitude = mobile ? 7 : 23;
    const wave = Math.sin(distance / 470 - time * 0.47) * amplitude;
    const secondWave = Math.sin(distance / 790 + time * 0.25) * amplitude * 0.33;
    // All offsets are bounded inside the reserved reading lane.
    const reaction = mouseX * (mobile ? 0 : 9) * Math.exp(-distance / 1600);
    const upper = THREE.MathUtils.clamp((headY - y) / (scale * 1.88), 0, 1);
    const nape = (-0.055 * upper - 0.055 * Math.sin(upper * Math.PI)) * scale * Math.sin(headYaw);
    return base + wave + secondWave + reaction + nape;
  }

  function updateNeck(time: number) {
    const scroll = window.scrollY;
    const start = Math.max(headY - scale * 1.86, scroll - 110);
    const end = Math.min(endY, scroll + height + 110);
    neck.visible = mane.visible = end > start;
    if (!neck.visible) return;
    for (let row = 0; row <= segments; row++) {
      const y = THREE.MathUtils.lerp(start, end, row / segments);
      const localY = (headY - y) / scale;
      const distance = Math.max(0, y - headY);
      const upper = THREE.MathUtils.clamp(localY / 1.88, 0, 1);
      const radius = localY > 0 ? scale * (0.27 - 0.065 * Math.sin(upper * Math.PI * 0.68)) : mobile
        ? THREE.MathUtils.lerp(scale * 0.275, 20, smooth(distance / 140))
        : scale * (0.275 + 0.15 * smooth(distance / 650));
      const x = centerAt(y, time);
      const slope = (centerAt(y + 2, time) - centerAt(y - 2, time)) / 4;
      const z = (Math.sin(distance / 590 - time * 0.32) - Math.sin(-time * 0.32)) * (mobile ? 2 : 8) - 10
        + (-0.055 * upper - 0.055 * Math.sin(upper * Math.PI)) * scale * Math.cos(headYaw);
      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const i = row * (sides + 1) + side;
        positions[i * 3] = x + cos * radius;
        positions[i * 3 + 1] = height - (y - scroll) + slope * cos * radius;
        positions[i * 3 + 2] = z + sin * radius * 0.98;
        const twist = headYaw * (1 - smooth(distance / 450));
        coatPositions[i * 3] = (cos * Math.cos(twist) - sin * Math.sin(twist)) * radius / scale;
        coatPositions[i * 3 + 1] = localY;
        coatPositions[i * 3 + 2] = (cos * Math.sin(twist) + sin * Math.cos(twist)) * radius / scale;
        const normalLength = Math.sqrt(1 + slope * slope * cos * cos);
        normals[i * 3] = cos / normalLength;
        normals[i * 3 + 1] = slope * cos / normalLength;
        normals[i * 3 + 2] = sin / normalLength;
        uvs[i * 2] = side / sides;
        uvs[i * 2 + 1] = -distance / (scale * 4.9);
      }
      const mi = row * 6;
      const fringe = 4 + Math.sin(y * 1.7) * 1.2 + Math.sin(y * 0.37) * 1.4;
      manePositions[mi] = x - radius * 0.94;
      manePositions[mi + 1] = height - (y - scroll);
      manePositions[mi + 2] = z + 1;
      manePositions[mi + 3] = x - radius - fringe;
      manePositions[mi + 4] = height - (y - scroll) - 2;
      manePositions[mi + 5] = z - 3;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.coatPosition.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    maneGeometry.attributes.position.needsUpdate = true;
  }

  function syncToggle() {
    toggle?.setAttribute('aria-pressed', String(paused));
    toggle?.setAttribute('aria-label', paused ? 'Activar movimiento de la jirafa' : 'Pausar movimiento de la jirafa');
    if (label) label.textContent = paused ? 'Activar movimiento' : 'Pausar movimiento';
    root.classList.toggle('is-paused', paused);
  }

  function draw(now: number) {
    frame = 0;
    if (destroyed || contextLost || document.hidden) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (!paused) elapsed += delta;
    mouseX += ((paused ? 0 : targetX) - mouseX) * 0.045;
    mouseY += ((paused ? 0 : targetY) - mouseY) * 0.045;
    const scroll = window.scrollY;
    inView = scroll + height > headY - scale * 2.6 && scroll < endY;
    root.classList.toggle('is-in-view', inView);
    if (inView) {
      const x = centerAt(headY, elapsed);
      head.position.set(x, height - (headY - scroll), -10);
      const slope = (centerAt(headY + 2, elapsed) - centerAt(headY - 2, elapsed)) / 4;
      headYaw = 0.75 + Math.sin(elapsed * 0.28) * 0.065 + mouseX * 0.1;
      head.rotation.set(mouseY * 0.025, headYaw, 0);
      head.position.x -= scale * 1.8 * slope * 0.12;
      key.position.set(x - 400, head.position.y + 550, 850);
      key.target.position.set(x, head.position.y + scale * 1.5, 0);
      key.castShadow = headY - scroll > 0 && headY - scroll < height + scale * 2.6;
      updateNeck(elapsed);
      renderer.render(scene, camera);
    } else if (dirty) {
      renderer.clear();
    }
    dirty = false;
    // Paused/reduced-motion scenes still redraw on scroll and resize.
    if (inView && !paused) schedule();
  }

  function schedule() {
    if (!frame && !destroyed && !contextLost && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function onScroll() { dirty = true; schedule(); }
  function onResize() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }
  function onPointer(event: PointerEvent) {
    if (!pointer.matches || paused) return;
    targetX = THREE.MathUtils.clamp(event.clientX / width * 2 - 1, -1, 1);
    targetY = THREE.MathUtils.clamp(event.clientY / height * 2 - 1, -1, 1);
  }
  function onPointerLeave() { targetX = 0; targetY = 0; }
  function onToggle() { paused = !paused; previous = 0; syncToggle(); dirty = true; schedule(); }
  function onMotionChange() { paused = motion.matches; previous = 0; syncToggle(); schedule(); }
  function onVisibility() {
    previous = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else { dirty = true; schedule(); }
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    canvas!.hidden = true;
    fallback.activate();
  }
  function onContextRestored() {
    canvas!.hidden = false;
    contextLost = false;
    fallback.deactivate();
    measure();
  }
  function dispose() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    observer.disconnect();
    fallback.dispose();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    motion.removeEventListener('change', onMotionChange);
    toggle?.removeEventListener('click', onToggle);
    canvas!.removeEventListener('webglcontextlost', onContextLost);
    canvas!.removeEventListener('webglcontextrestored', onContextRestored);
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material: THREE.Material) => materials.add(material));
      }
    });
    materials.forEach((material) => {
      Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
      material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  }
  function onPageHide(event: PageTransitionEvent) {
    if (event.persisted) { cancelAnimationFrame(frame); frame = 0; }
    else dispose();
  }
  function onPageShow(event: PageTransitionEvent) { if (event.persisted) { previous = 0; measure(); } }

  const observer = new ResizeObserver(onResize);
  observer.observe(document.body);
  observer.observe(anchor);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  motion.addEventListener('change', onMotionChange);
  toggle?.addEventListener('click', onToggle);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  syncToggle();
  measure();
  void document.fonts.ready.then(() => { if (!destroyed) measure(); });
}

function setupFallback(root: HTMLElement, anchor: HTMLElement, rail: HTMLElement, footer: HTMLElement) {
  const fallback = root.querySelector<HTMLElement>('[data-giraffe-fallback]');
  const originalNeck = fallback?.querySelector<HTMLElement>('.giraffe-fallback-neck');
  const head = fallback?.querySelector<SVGElement>('.giraffe-fallback-head');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden';
  svg.innerHTML = '<defs><pattern id="giraffe-static-coat" width="68" height="160" patternUnits="userSpaceOnUse"><rect width="68" height="160" fill="#f1f1f1"/><path d="M5 9L29 3 37 29 16 48 0 32ZM43 48L66 40 70 77 51 94 35 75ZM3 104L29 92 40 126 17 155 0 139Z" fill="#242424"/></pattern><linearGradient id="giraffe-static-volume"><stop stop-color="#111" stop-opacity=".4"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#111" stop-opacity=".3"/></linearGradient></defs><path data-static-neck fill="url(#giraffe-static-coat)"/><path data-static-shade fill="url(#giraffe-static-volume)"/>';
  originalNeck?.replaceWith(svg);
  const neckPath = svg.querySelector('[data-static-neck]')!;
  const shadePath = svg.querySelector('[data-static-shade]')!;
  let active = false;
  let frame = 0;
  let disposed = false;

  function update() {
    frame = 0;
    if (!active || !fallback || !head || disposed) return;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const mobile = width <= 920;
    const anchorRect = anchor.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const headX = anchorRect.left + anchorRect.width / 2;
    const top = anchorRect.top + anchorRect.height * .94;
    const railX = railRect.left + railRect.width / 2;
    const bottom = footer.getBoundingClientRect().bottom + 70;
    const visible = top - 300 < height && bottom > 0;
    fallback.hidden = !visible;
    root.classList.toggle('is-in-view', visible);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const joinOffset = mobile ? 35 : 45;
    const upper = Math.max(top + joinOffset, -80);
    const lower = Math.min(bottom, height + 80);
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const y = THREE.MathUtils.lerp(upper, lower, i / 60);
      const distance = Math.max(0, y - top - joinOffset);
      const blend = THREE.MathUtils.smoothstep(distance, 0, mobile ? 140 : 450);
      const x = THREE.MathUtils.lerp(headX, railX, blend) + Math.sin(distance / 470) * (mobile ? 6 : 20);
      const radius = mobile ? 20 : 40;
      left.push(`${x - radius},${y}`);
      right.unshift(`${x + radius},${y}`);
    }
    const path = `M${left.join(' L')} L${right.join(' L')}Z`;
    neckPath.setAttribute('d', path);
    shadePath.setAttribute('d', path);
    head.style.left = `${headX}px`;
    head.style.top = `${top}px`;
  }
  function schedule() { if (active && !frame && !disposed) frame = requestAnimationFrame(update); }
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    window.removeEventListener('pagehide', onPageHide);
  }
  function onPageHide(event: PageTransitionEvent) { if (!event.persisted) dispose(); }
  window.addEventListener('pagehide', onPageHide);
  return {
    activate() { active = true; root.classList.add('is-fallback'); schedule(); },
    deactivate() { active = false; root.classList.remove('is-fallback'); if (fallback) fallback.hidden = true; },
    dispose,
  };
}

