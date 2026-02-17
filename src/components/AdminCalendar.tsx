import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Phone } from 'lucide-react';
import { Appointment } from '../types';

interface AdminCalendarProps {
  appointments: Appointment[];
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  // --- LÓGICA DO CALENDÁRIO ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Ajuste para começar na Segunda-feira (0: Dom, 1: Seg...)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Filtrar agendamentos do dia selecionado
  const appointmentsForSelectedDay = appointments.filter(app => app.date === selectedDate);

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* COLUNA DO CALENDÁRIO (GRELHA) */}
      <div className="lg:col-span-2 bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-xl font-serif font-bold text-white capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-stone-600 uppercase tracking-widest py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios do início do mês */}
          {[...Array(adjustedStartDay)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {/* Dias do mês */}
          {[...Array(totalDays)].map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const hasAppointments = appointments.some(app => app.date === dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square flex flex-col items-center justify-center rounded-2xl transition-all relative group
                  ${isSelected ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-white/5 text-stone-400'}
                  ${isToday && !isSelected ? 'border border-rose-500/50' : ''}
                `}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{dayNum}</span>
                {hasAppointments && (
                  <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUNA DE DETALHES DO DIA */}
      <div className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col shadow-xl">
        <div className="mb-6">
          <h4 className="text-white font-bold text-lg">
            {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Selecciona un día'}
          </h4>
          <p className="text-rose-500 text-[10px] uppercase font-bold tracking-widest mt-1">Citas del día</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-stone-800">
          {appointmentsForSelectedDay.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-600 text-sm italic text-center px-4 py-20">
              No hay citas para este día.
            </div>
          ) : (
            appointmentsForSelectedDay.map(app => (
              <div key={app.id} className="bg-stone-950 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <span className="bg-rose-600/10 text-rose-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{app.serviceName}</span>
                  <div className="flex items-center gap-1 text-stone-400 text-xs font-bold">
                    <Clock size={12} className="text-rose-500"/> {app.startTime}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <User size={14} className="text-stone-500"/> {app.clientName}
                </div>
                <a href={`tel:${app.clientPhone}`} className="flex items-center gap-2 text-stone-500 text-xs hover:text-rose-500 transition-colors">
                  <Phone size={12}/> {app.clientPhone}
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;