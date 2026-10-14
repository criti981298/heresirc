export interface Proyecto {
  slug: string;
  nombre: string;
  sector: string;
  descripcion: string;
  servicios: string[];
  url: string;
  etiqueta: string;
}

export const proyectos: Proyecto[] = [
  {
    slug: 'posonas', nombre: 'posonas.posonas', sector: 'Plataforma comunitaria',
    descripcion: 'Proyecto web editorial con contenido organizado, páginas de eventos e interacciones visuales. Construido con la arquitectura reutilizable que inspira HERESIRC.',
    servicios: ['Diseño editorial', 'Desarrollo Astro', 'Animaciones GSAP', 'Despliegue Cloudflare Pages'],
    url: 'https://posonas-posonas.pages.dev/', etiqueta: 'Proyecto desarrollado',
  },
];
