// src/types.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; 
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

export interface WorkConfig {
  id?: string;
  startHour: string; 
  endHour: string;   
  breakStart?: string; 
  breakEnd?: string;   
  daysOff: number[]; 
}

export interface TimeBlock {
  id?: string;
  title: string;      
  date: string;       
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  repeatCount?: number; // Nova propriedade: quantas vezes repetir
}