export interface Paquete {
  slug: string;
  numero: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  idealPara: string;
  incluye: string[];
  entregables: string[];
  destacado?: boolean;
}

/** Cinco tipos de sitio; el alcance final se adapta a cada proyecto. */
export const paquetes: Paquete[] = [
  {
    slug: 'pagina-basica', numero: '01', nombre: 'Página básica', subtitulo: 'Tu tarjeta de presentación digital',
    descripcion: 'Presenta tu negocio o perfil profesional y facilita que te encuentren y contacten.',
    idealPara: 'Profesionales independientes y pequeños negocios que necesitan su primera presencia en Internet.',
    incluye: ['Nombre y descripción del negocio', 'Contacto, WhatsApp y redes sociales', 'Ubicación y horarios', 'Diseño adaptable a celulares'],
    entregables: ['Página de presentación', 'Enlaces de contacto configurados', 'Versión para celular y escritorio'],
  },
  {
    slug: 'landing-page', numero: '02', nombre: 'Landing page', subtitulo: 'Una página con un objetivo claro',
    descripcion: 'Convierte visitas en consultas o ventas con una página dedicada a tu producto, servicio o campaña.',
    idealPara: 'Lanzamientos, campañas y negocios que quieren conseguir clientes potenciales.',
    incluye: ['Diseño orientado a conversiones', 'Beneficios y servicios destacados', 'Formulario de contacto', 'Testimonios y llamadas a la acción', 'Estadísticas de visitas'],
    entregables: ['Landing page personalizada', 'Formulario y botones de acción', 'Medición de visitas configurada'],
  },
  {
    slug: 'sitio-corporativo', numero: '03', nombre: 'Sitio corporativo', subtitulo: 'La presencia que tu empresa merece',
    descripcion: 'Comunica quién eres, qué haces y por qué elegirte con un sitio profesional de varias páginas.',
    idealPara: 'Empresas y equipos con varios servicios que quieren transmitir confianza.',
    incluye: ['Inicio, servicios, nosotros y contacto', 'Páginas internas a medida', 'SEO básico para Google', 'Formularios, mapas y redes sociales', 'Aviso de privacidad cuando corresponda'],
    entregables: ['Sitio multipágina', 'Estructura de contenido y navegación', 'Configuración inicial de SEO'],
    destacado: true,
  },
  {
    slug: 'blog-portal', numero: '04', nombre: 'Blog o portal', subtitulo: 'Un espacio para compartir y crecer',
    descripcion: 'Publica contenido de forma continua y ayuda a tu audiencia a descubrir lo que tienes que contar.',
    idealPara: 'Creadores, medios y marcas que publican artículos, novedades o recursos periódicamente.',
    incluye: ['Artículos, categorías y etiquetas', 'Buscador de contenido', 'Panel para publicar y editar', 'SEO y estadísticas', 'Autores y comentarios opcionales'],
    entregables: ['Portal de contenido', 'Panel de publicación', 'Guía para gestionar artículos'],
  },
  {
    slug: 'tienda-en-linea', numero: '05', nombre: 'Tienda en línea', subtitulo: 'Tu negocio, abierto al mundo',
    descripcion: 'Vende tus productos en Internet y administra tu catálogo, pedidos y ventas desde un solo lugar.',
    idealPara: 'Negocios que necesitan recibir compras y gestionar sus productos por Internet.',
    incluye: ['Catálogo con precios y variantes', 'Carrito y pasarela de pago', 'Gestión de pedidos e inventario', 'Envíos y notificaciones', 'Panel de productos y ventas'],
    entregables: ['Tienda en línea configurada', 'Integración de pagos y envíos según alcance', 'Guía de administración de productos y pedidos'],
  },
];
