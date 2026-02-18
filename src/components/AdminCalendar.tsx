import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  Lock, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { Appointment, TimeBlock } from '../types';

interface AdminCalendarProps {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  onEditAppointment: (appt: Appointment) => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments, timeBlocks, onEditAppointment }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // --- CONFIGURAÇÃO DA GRADE ---
  const HOUR_HEIGHT = 80; // pixels por hora
  const START_HOUR = 8;   // 08:00
  const END_HOUR = 21;    // 21:00
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // --- LÓGICA DE DATAS (SEMANA) ---
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Segunda como primeiro dia
    start.setDate(diff);
    
    return Array.from({ length: 6 }, (_, i) => { // Segunda a Sábado
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(viewDate);
  const weekRangeLabel = `${weekDays[0].toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${weekDays[5].toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const changeWeek = (offset: number) => {
    const next = new Date(viewDate);
    next.setDate(viewDate.getDate() + (offset * 7));
    setViewDate(next);
  };

  // --- AUXILIARES DE POSICIONAMENTO ---
  const getTimeData = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = (h * 60 + m) - (START_HOUR * 60);
    return {
      top: (totalMinutes / 60) * HOUR_HEIGHT,
      minutes: totalMinutes
    };
  };

  const calculateHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return (duration / 60) * HOUR_HEIGHT;
  };

  // --- VERIFICAÇÃO DE BLOQUEIOS RECORRENTES ---
  const isBlockActiveOnDay = (block: TimeBlock, targetDate: Date) => {
    const blockDate = new Date(block.date);
    blockDate.setHours(0,0,0,0);
    const target = new Date(targetDate);
    target.setHours(0,0,0,0);

    if (target.getTime() === blockDate.getTime()) return true;
    if (!block.isRecurring || target < blockDate) return false;

    const diffDays = Math.round((target.getTime() - blockDate.getTime()) / (1000 * 60 * 60 * 24));
    const repeats = block.repeatCount || 0;

    switch (block.recurringType) {
      case 'daily':
        return diffDays <= repeats;
      case 'weekly':
        return diffDays % 7 === 0 && diffDays / 7 <= repeats;
      case 'monthly':
        return target.getDate() === blockDate.getDate() && 
               (target.getMonth() - blockDate.getMonth() + (12 * (target.getFullYear() - blockDate.getFullYear()))) <= repeats;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      
      {/* CABEÇALHO DA AGENDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-rose-600 p-2 rounded-xl shadow-lg shadow-rose-900/20">
            <CalendarIcon className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Vista Semanal</h3>
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{weekRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center bg-stone-900 border border-white/5 p-1 rounded-2xl">
          <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-all">
            <ChevronLeft size={20}/>
          </button>
          <button 
            onClick={() => setViewDate(new Date())} 
            className="px-4 py-2 text-xs font-bold text-stone-300 hover:text-rose-500 transition-colors"
          >
            HOY
          </button>
          <button onClick={() => changeWeek(1)} className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-all">
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>

      {/* ÁREA DA GRADE */}
      <div className="flex-1 overflow-x-auto rounded-[2rem] border border-white/5 bg-stone-950/50 shadow-2xl">
        <div className="min-w-[800px] relative">
          
          {/* DIAS DA SEMANA */}
          <div className="sticky top-0 z-30 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] bg-stone-900 border-b border-white/5">
            <div className="p-4 border-r border-white/5"></div>
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`p-3 text-center border-r border-white/5 last:border-0 ${isToday ? 'bg-rose-600/5' : ''}`}>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-tighter">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-serif font-bold ${isToday ? 'text-rose-500' : 'text-white'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CORPO DA GRADE */}
          <div className="relative grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr]">
            
            {/* HORAS LATERAIS */}
            <div className="bg-stone-900/30 border-r border-white/5">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="text-right pr-4 text-[10px] font-bold text-stone-600 border-b border-white/5"
                  style={{ height: `${HOUR_HEIGHT}px`, paddingTop: '4px' }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* COLUNAS DOS DIAS */}
            {weekDays.map((day, colIdx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayAppointments = appointments.filter(a => a.date === dateStr);
              const dayBlocks = timeBlocks.filter(b => isBlockActiveOnDay(b, day));

              return (
                <div key={colIdx} className="relative border-r border-white/5 last:border-0 pointer-events-auto">
                  {/* Linhas de fundo */}
                  {hours.map(h => (
                    <div key={h} className="border-b border-white/[0.02]" style={{ height: `${HOUR_HEIGHT}px` }} />
                  ))}

                  {/* BLOQUEIOS (BACKGROUND) */}
                  {dayBlocks.map(block => {
                    const { top } = getTimeData(block.startTime);
                    const height = calculateHeight(block.startTime, block.endTime);
                    return (
                      <div
                        key={block.id}
                        className="absolute left-0 right-0 z-10 bg-stone-800/40 backdrop-blur-[1px] border-y border-white/5 flex items-center justify-center overflow-hidden pointer-events-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex items-center gap-1.5 opacity-20 rotate-[-5deg]">
                          <Lock size={12} className="text-white" />
                          <span className="text-[9px] font-black text-white uppercase tracking-tighter">Bloqueado</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* AGENDAMENTOS (FOREGROUND - CLICÁVEIS) */}
                  {dayAppointments.map(app => {
                    const { top } = getTimeData(app.startTime);
                    const height = calculateHeight(app.startTime, app.endTime);
                    return (
                      <div
                        key={app.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Impede o clique de fugir para o pai
                          onEditAppointment(app);
                        }}
                        className="absolute left-1.5 right-1.5 z-40 rounded-xl bg-stone-900 border-l-4 border-rose-600 p-2 shadow-2xl ring-1 ring-white/5 hover:ring-rose-500/50 hover:bg-stone-800 hover:scale-[1.02] hover:z-50 transition-all cursor-pointer group/card select-none"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        {/* pointer-events-none no conteúdo garante que o clique caia no pai div */}
                        <div className="flex flex-col h-full overflow-hidden pointer-events-none">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black text-rose-500 uppercase leading-none truncate pr-1">
                              {app.startTime}
                            </span>
                            <Scissors size={10} className="text-stone-700 group-hover/card:text-rose-500 transition-colors shrink-0" />
                          </div>
                          <p className="text-xs font-bold text-white truncate leading-tight group-hover/card:text-rose-100 transition-colors">
                            {app.clientName}
                          </p>
                          {height > 45 && (
                            <p className="text-[10px] text-stone-500 font-medium truncate mt-0.5">
                              {app.serviceName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LEGENDA */}
      <div className="mt-4 flex gap-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-600"></div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Citas (Clic para editar)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-stone-800"></div>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Bloqueos</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;