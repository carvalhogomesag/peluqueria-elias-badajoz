import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Service, Appointment, WorkConfig, TimeBlock } from '../types';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [workConfig, setWorkConfig] = useState<WorkConfig | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<{start: number, end: number}[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // 1. Resetar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedService(null); setSelectedDate("");
      setSelectedTime(""); setFormData({ name: '', phone: '' });
    }
  }, [isOpen]);

  // 2. Escuta Dados Globais (Serviços, Configuração e Bloqueios)
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      
      // Escutar Serviços
      const unsubServ = onSnapshot(query(collection(db, "services"), orderBy("name", "asc")), (snap) => {
        setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      });

      // Escutar Horário de Trabalho
      const unsubConfig = onSnapshot(doc(db, "config", "work-schedule"), (snap) => {
        if (snap.exists()) setWorkConfig(snap.data() as WorkConfig);
      });

      // Escutar Bloqueios Manuais
      const unsubBlocks = onSnapshot(collection(db, "timeBlocks"), (snap) => {
        setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
      });

      setLoadingData(false);
      return () => { unsubServ(); unsubConfig(); unsubBlocks(); };
    }
  }, [isOpen]);

  // 3. Buscar Agendamentos Ocupados para a data selecionada
  useEffect(() => {
    if (selectedDate && isOpen) {
      const fetchBookings = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, "appointments"), where("date", "==", selectedDate));
          const snapshot = await getDocs(q);
          const busy = snapshot.docs.map(doc => {
            const data = doc.data();
            const [sh, sm] = data.startTime.split(':').map(Number);
            const [eh, em] = data.endTime.split(':').map(Number);
            return { start: sh * 60 + sm, end: eh * 60 + em };
          });
          setOccupiedSlots(busy);
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      fetchBookings();
    }
  }, [selectedDate, isOpen]);

  if (!isOpen) return null;

  // --- LÓGICA DE FILTRAGEM INTELIGENTE ---
  const generateAvailableTimes = () => {
    if (!workConfig || !selectedService) return [];
    
    const slots = [];
    const [startH, startM] = workConfig.startHour.split(':').map(Number);
    const [endH, endM] = workConfig.endHour.split(':').map(Number);
    
    let currentMin = startH * 60 + startM;
    const dayEndMin = endH * 60 + endM;
    const interval = 30; // Slots de 30 em 30 min

    // Converter intervalos de descanso para minutos
    const breakStart = workConfig.breakStart ? workConfig.breakStart.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;
    const breakEnd = workConfig.breakEnd ? workConfig.breakEnd.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;

    while (currentMin + selectedService.duration <= dayEndMin) {
      const slotEnd = currentMin + selectedService.duration;
      const timeStr = `${Math.floor(currentMin/60).toString().padStart(2,'0')}:${(currentMin%60).toString().padStart(2,'0')}`;

      let isBlocked = false;

      // A. Verificar Intervalo (Almoço)
      if (breakStart && breakEnd) {
        if (currentMin < breakEnd && slotEnd > breakStart) isBlocked = true;
      }

      // B. Verificar Agendamentos Ocupados
      if (!isBlocked) {
        isBlocked = occupiedSlots.some(busy => currentMin < busy.end && slotEnd > busy.start);
      }

      // C. Verificar Bloqueios Manuais do Admin (com recorrência semanal)
      if (!isBlocked) {
        const selectedDayDate = new Date(selectedDate);
        isBlocked = timeBlocks.some(block => {
          const [bsh, bsm] = block.startTime.split(':').map(Number);
          const [beh, bem] = block.endTime.split(':').map(Number);
          const bStart = bsh * 60 + bsm;
          const bEnd = beh * 60 + bem;

          // Se for na mesma data
          if (block.date === selectedDate) {
            return currentMin < bEnd && slotEnd > bStart;
          }
          // Se for recorrente semanalmente (mesmo dia da semana)
          if (block.isRecurring && block.recurringType === 'weekly') {
            return new Date(block.date).getDay() === selectedDayDate.getDay() && (currentMin < bEnd && slotEnd > bStart);
          }
          return false;
        });
      }

      if (!isBlocked) slots.push(timeStr);
      currentMin += interval;
    }
    return slots;
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      
      // Filtrar dias de folga configurados no Admin
      if (workConfig && !workConfig.daysOff.includes(dayOfWeek)) {
        days.push(d.toISOString().split('T')[0]);
      }
    }
    return days;
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endTotal = (h * 60) + m + selectedService.duration;
      const endTimeStr = `${Math.floor(endTotal/60).toString().padStart(2,'0')}:${(endTotal%60).toString().padStart(2,'0')}`;

      await addDoc(collection(db, "appointments"), {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        clientName: formData.name,
        clientPhone: formData.phone,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTimeStr,
        createdAt: serverTimestamp()
      });
      setStep(5);
    } catch (e) { alert("Error al reservar."); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 text-left">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-stone-900 border border-rose-900/30 w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Reservar Cita</h2>
            <p className="text-rose-500 text-[10px] uppercase tracking-widest font-bold">Peluquería Elías León</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {step === 1 && (
            <div className="space-y-4">
              {loadingData ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div> : (
                dbServices.length === 0 ? <p className="text-stone-500 text-center py-10">No hay servicios.</p> :
                dbServices.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="w-full flex justify-between items-center p-4 rounded-2xl bg-stone-950 border border-white/5 hover:border-rose-500/50 group transition-all">
                    <div className="flex-1"><h3 className="text-white font-bold group-hover:text-rose-500">{s.name}</h3><p className="text-stone-500 text-xs">{s.duration} min | <span className="text-rose-600">{s.price}</span></p></div>
                    <ChevronRight size={20} className="text-stone-700 group-hover:text-rose-500" />
                  </button>
                ))
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500"><ChevronLeft size={14}/> Volver</button>
              <h3 className="text-white font-bold flex items-center gap-2"><Calendar size={18} className="text-rose-500"/> ¿Cuándo vienes?</h3>
              <div className="grid grid-cols-3 gap-2">
                {getNextDays().map((d) => (
                  <button key={d} onClick={() => { setSelectedDate(d); setStep(3); }} className={`p-3 rounded-2xl border transition-all text-center ${selectedDate === d ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500/50'}`}>
                    <span className="block text-[10px] uppercase font-bold opacity-60">{new Date(d).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                    <span className="block text-lg font-black">{new Date(d).getDate()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500"><ChevronLeft size={14}/> Volver</button>
              <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18} className="text-rose-500"/> Horas disponibles</h3>
              {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div> : (
                <div className="grid grid-cols-4 gap-2">
                  {generateAvailableTimes().map((t) => (
                    <button key={t} onClick={() => { setSelectedTime(t); setStep(4); }} className={`p-2 rounded-xl border text-sm font-bold transition-all ${selectedTime === t ? 'bg-rose-600 border-rose-600 text-white' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500'}`}>{t}</button>
                  ))}
                  {generateAvailableTimes().length === 0 && <div className="col-span-4 bg-red-500/10 p-4 rounded-xl text-red-500 text-xs flex items-center gap-2"><AlertCircle size={16}/> No hay horarios para la duración de este servicio.</div>}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <button onClick={() => setStep(3)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500"><ChevronLeft size={14}/> Volver</button>
              <div className="space-y-4">
                <input type="text" placeholder="Nombre completo" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 px-4 text-white outline-none focus:border-rose-500/50" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="tel" placeholder="Teléfono" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 px-4 text-white outline-none focus:border-rose-500/50" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <button disabled={loading || !formData.name || !formData.phone} onClick={handleBooking} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Confirmar Reserva"}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="py-8 text-center space-y-6 animate-in zoom-in duration-500">
              <CheckCircle2 size={64} className="text-rose-500 mx-auto" />
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight">¡Reserva Lista!</h3>
              <p className="text-stone-400">Gracias {formData.name.split(' ')[0]}, Elías León te espera el {new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} a las {selectedTime}.</p>
              <button onClick={onClose} className="w-full py-4 bg-stone-800 text-white font-bold rounded-2xl hover:bg-stone-700">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;