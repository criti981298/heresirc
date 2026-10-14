# HERESIRC — estudio de diseño y desarrollo web

Sitio Astro estático con catálogo de paquetes y proyectos, identidad definitiva Sage & Stone, narrativa editorial y profundidad 3D ligera con GSAP.

## Arquitectura (misma convención que Posonas)

- `src/layouts/MainLayout.astro`: documento base, metadatos, Navbar, Footer y estilos.
- `src/pages/`: rutas de inicio, catálogo, fichas dinámicas generadas en build y contacto.
- `src/components/`: componentes de interfaz por responsabilidad.
- `src/data/`: paquetes, proyectos y configuración de contacto tipados.
- `src/scripts/`: interacción progresiva (GSAP, navegación, formulario).
- `src/styles/global.css`: tokens visuales y estilos responsivos.
- `public/brand/`: logo negro sobre blanco proporcionado por la marca.

Jerarquía: **Layout → Página → Sección → Componente reutilizable → Datos**.

## Tecnología

Astro 7, TypeScript, Tailwind CSS 4 mediante `@tailwindcss/vite`, GSAP, Inter + Outfit locales, Git/GitHub y Cloudflare Pages. No se usa React ni se requiere un servidor de aplicación.

## Jirafa 3D en inicio

La sección «No hacemos páginas por hacer» inicia una escena Three.js en blanco y negro. Su cuello es una única malla continua hasta el footer, con balanceo suave y reacción al cursor. La geometría y el material son originales y procedurales; el acabado es escultórico, sin modelos externos ni fotografías.

- `src/components/GiraffeExperience.astro`: capa visual, alternativa sin WebGL y control de pausa.
- `src/scripts/giraffe-loader.ts`: carga la escena al acercarse a la sección.
- `src/scripts/giraffe.ts`: recorrido, iluminación, interacción y render de un tramo del cuello del tamaño de la pantalla.
- `src/scripts/giraffe-model.ts`: cabeza y material monocromático compartido con el cuello.
- `src/styles/giraffe.css`: carril lateral y adaptación a móvil.

La escena respeta `prefers-reduced-motion`, se detiene en pestañas ocultas y permite pausar el movimiento. Las demás rutas conservan su composición.

## Desarrollo en Windows / PowerShell

```powershell
node --version
npm.cmd --version
git --version
npm.cmd install
npm.cmd run dev
```

Abre `http://localhost:4321/`.

## Comprobar

```powershell
npm.cmd run build
npm.cmd run preview
```

`dist/` contiene la compilación estática.

## Paletas disponibles

- Lila editorial (predeterminada): `#F7F4FB`, `#C8B5E8`, `#E6DCF1`, `#22222B`.
- Salvia studio: `#F7F7F0`, `#BCD7C7`, `#EBDDCB`, `#25302A`.
- Rosa digital: `#FFF6F6`, `#E9B5C8`, `#E4D4EF`, `#30242E`.
- Azul nube: `#F1F8FA`, `#B5D8EC`, `#DCD7F5`, `#20313C`.

Las opciones están en `src/data/temas.ts`; sus variables visuales en `src/styles/global.css`. El visitante puede alternar entre ellas desde la sección «Paletas»; la opción elegida se guarda localmente en su navegador.

Para fijar una **sola** identidad en producción, elimina el selector y las variantes que no se usarán después de aprobar la paleta definitiva.

## Antes de publicar: IMPORTANTES

1. Completa el correo real en `src/data/site.ts`. El formulario actual es **estático**: prepara y copia un brief, **no lo envía a un servidor ni almacena datos**. Si configuras el correo, habilita un enlace `mailto:`. Si deseas recibir formularios directamente, integra después un servicio/API apropiado con políticas de privacidad y medidas antispam.
2. Verifica el contenido comercial (paquetes, alcance y términos). **No hay precios ni tiempos prometidos**.
3. Comprueba que `Posonas` sea un caso que deseas mostrar públicamente en tu portafolio. Es el único proyecto real documentado de partida; no se inventaron testimonios ni clientes.
4. Revisa el sitio en móvil, teclado, reduced motion, Lighthouse y enlaces antes de publicar.
5. El logo original negro se muestra sobre un panel oscuro para respetar sus colores. Se puede preparar una versión transparente autorizada en un paso posterior.

## Publicación (Cloudflare Pages conectado con GitHub)

| Configuración | Valor |
|---|---|
| Framework | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root | `/` |
| Production branch | `main` |
| Preview | Ramas `diseno/*` y `feature/*` |
| Node (si se pide) | `24` según guía de Posonas; verificar compatibilidad local y en Cloudflare |

**No añadir `@astrojs/cloudflare` ni desplegar con `wrangler deploy`** para este sitio estático en Pages conectado a GitHub.

## Flujo de control de versiones

```powershell
git status
git switch -c diseno/here-sirc-identidad
npm.cmd run build
git add .
git commit -m "feat: sitio editorial inicial here.sirc"
git push -u origin diseno/here-sirc-identidad
```

Si este proyecto nuevo aún no es un repositorio Git, inicialízalo una sola vez; revisa `git status` y `git remote -v` antes de añadir un remoto. Tras aprobar la preview, fusiona hacia `main`.

## Archivos para editar primero

1. `src/data/site.ts` — correo y redes reales.
2. `src/data/paquetes.ts` — paquetes acordados con cada cliente.
3. `src/data/proyectos.ts` — portafolio real.
4. `src/styles/global.css` — tokens de paleta y tipografía.
5. `public/brand/here-sirc-logo.png` — logo suministrado.

Las paletas son variantes de identidad, no cambios de arquitectura.

## Identidad visual confirmada

Marca: **HERESIRC** (sin punto). Paleta Sage & Stone: fondo `#F6F5F0`, principal `#CBD7C4`, secundario `#9CAC9A`, superficie `#E4E1D8`, texto `#30352E`. Logo oficial: `public/brand/here-sirc-logo.png`.
