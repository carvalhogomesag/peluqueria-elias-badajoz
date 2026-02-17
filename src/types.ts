// Tipos para os Serviços do Profissional
export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; // Duração em minutos (ex: 30, 60, 120)
}

// Tipos para as Avaliações (mantido o que já tínhamos)
export interface Review {
  id: number;
  author: string;
  date: string;
  text: string;
  avatar?: string;
}

// Tipos para as Informações do Negócio
export interface BusinessInfo {
  name: string;
  barberName: string;
  phone: string;
  address: string;
  city: string;
  openingHours: string;
  bookingUrl: string;
  googleMapsUrl: string;
  instagramUrl: string;
}

// Estrutura de um Agendamento no Banco de Dados
export interface Appointment {
  id?: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  date: string; // Formato YYYY-MM-DD
  startTime: string; // Formato HH:mm
  endTime: string;   // Formato HH:mm (calculado: startTime + duration)
  createdAt: any;    // Timestamp do Firebase
}