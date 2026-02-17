// src/types.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; // em minutos
}

export interface Review {
  id: number;
  author: string;
  date: string;
  text: string;
  avatar?: string;
}

export interface Appointment {
  id?: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  date: string; 
  startTime: string; 
  endTime: string;   
  createdAt: any;    
}

// --- NOVOS TIPOS PARA GESTÃO ---

export interface WorkConfig {
  id?: string;
  startHour: string; // Ex: "09:00"
  endHour: string;   // Ex: "20:00"
  breakStart?: string; // Ex: "13:00"
  breakEnd?: string;   // Ex: "14:00"
  daysOff: number[]; // [0, 6] para Domingo e Sábado
}

export interface TimeBlock {
  id?: string;
  title: string;      // Motivo do bloqueio (ex: "Médico")
  date: string;       // Data do início do bloqueio
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
}