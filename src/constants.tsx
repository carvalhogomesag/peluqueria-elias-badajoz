export const BUSINESS_INFO = {
  name: "Peluquería Elías",
  owner: "Elías León",
  phone: '+34 924 25 21 01', 
  address: 'Pl. Francisco Vera, 2, Local 3E',
  city: '06011 Badajoz, España',
  openingHours: 'Lunes a Sábado: 11:00 - 21:00',
  bookingUrl: 'https://wa.me/34924252101', 
  googleMapsUrl: 'https://maps.app.goo.gl/kqLaLyWrFaBnyocy6', // Link enviado
  instagramUrl: 'https://instagram.com/' 
};

export const SERVICES = [
  { id: 1, name: 'Corte Unisex', description: 'Cortes clásicos y modernos adaptados a tu estilo personal.', price: 'Desde 12€' },
  { id: 2, name: 'Peinados y Estilo', description: 'Especialistas en peinados para eventos y cuidado diario.', price: 'Consultar' },
  { id: 3, name: 'Color y Mechas', description: 'Técnicas avanzadas de coloración para un brillo espectacular.', price: 'Consultar' },
  { id: 4, name: 'Arreglo de Barba', description: 'Cuidado tradicional de la barba con acabado profesional.', price: 'Desde 8€' }
];

export const REVIEWS = [
  {
    id: 1,
    author: 'Juan Carlos Gutiérrez',
    date: 'Hace 2 meses',
    text: 'Elías me ha parecido un gran profesional e mejor persona. Volveré con toda seguridad.',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Carlos&background=e11d48&color=fff'
  },
  {
    id: 2,
    author: 'Carlos C.',
    date: 'Hace 6 meses',
    text: 'He ido hoy a cortar y peinar para un evento. Trato exquisito y profesionalidad. ¡Muchas gracias!',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+C&background=e11d48&color=fff'
  },
  {
    id: 3,
    author: 'David Leñador',
    date: 'Hace un año',
    text: 'Después de tantos años, se refleja lo que recuerdo de Elías como profesional. Siempre salía con una sonrisa.',
    avatar: 'https://ui-avatars.com/api/?name=David+Lenador&background=e11d48&color=fff'
  }
];

export const IMAGES = {
  cortes: [
    { id: 1, url: '/cortes/corte-01.webp', alt: 'Estilo Elías León' },
    { id: 2, url: '/cortes/corte-02.webp', alt: 'Peluquería Badajoz' },
    { id: 3, url: '/cortes/corte-03.webp', alt: 'Peinado Profesional' },
    { id: 4, url: '/cortes/corte-04.webp', alt: 'Corte Unisex' },
  ],
  interior: [
    { id: 1, url: '/interior/espaco-01.webp', alt: 'Entrada Peluquería' },
    { id: 2, url: '/interior/espaco-02.webp', alt: 'Interior del salón' },
    { id: 3, url: '/interior/espaco-03.webp', alt: 'Detalles Peluquería Elías' },
    { id: 4, url: '/interior/espaco-04.webp', alt: 'Zona de lavado' },
  ]
};
