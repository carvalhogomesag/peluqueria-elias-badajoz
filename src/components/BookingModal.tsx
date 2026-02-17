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

  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedService(null); setSelectedDate("");
      setSelectedTime(""); setFormData({ name: '', phone: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      const unsubServ = onSnapshot(query(collection(db, "services"), orderBy("name", "asc")), (snap) => {
        setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      });
      const unsubConfig = onSnapshot(doc(db, "config", "work-schedule"), (snap) => {
        if (snap.exists()) setWorkConfig(snap.data() as WorkConfig);
      });
      const unsubBlocks = onSnapshot(collection(db, "timeBlocks"), (snap) => {
        setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
      });
      setLoadingData(false);
      return () => { unsubServ(); unsubConfig(); unsubBlocks(); };
    }
  }, [isOpen]);

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

  // --- MOTOR LÓGICO DE FILTRAGEM ---
  const generateAvailableTimes = () => {
    if (!workConfig || !selectedService) return [];
    
    const slots = [];
    const [startH, startM] = workConfig.startHour.split(':').map(Number);
    const [endH, endM] = workConfig.endHour.split(':').map(Number);
    
    let currentMin = startH * 60 + startM;
    const dayEndMin = endH * 60 + endM;
    const interval = 30;

    const breakStart = workConfig.breakStart ? workConfig.breakStart.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;
    const breakEnd = workConfig.breakEnd ? workConfig.breakEnd.split(':').map(Number).reduce((h, m) => h * 60 + m) : null;

    const selectedDayObj = new Date(selectedDate);

    while (currentMin + selectedService.duration <= dayEndMin) {
      const slotEnd = currentMin + selectedService.duration;
      const timeStr = `${Math.floor(currentMin/60).toString().padStart(2,'0')}:${(currentMin%60).toString().padStart(2,'0')}`;

      let isBlocked = false;

      // A. Intervalo de Almoço
      if (breakStart !== null && breakEnd !== null) {
        if (currentMin < breakEnd && slotEnd > breakStart) isBlocked = true;
      }

      // B. Agendamentos Ocupados
      if (!isBlocked) {
        isBlocked = occupiedSlots.some(busy => currentMin < busy.end && slotEnd > busy.start);
      }

      // C. Bloqueios Manuais e RECORRÊNCIAS
      if (!isBlocked) {
        isBlocked = timeBlocks.some(block => {
          const [bsh, bsm] = block.startTime.split(':').map(Number);
          const [beh, bem] = block.endTime.split(':').map(Number);
          const bStart = bsh * 60 + bsm;
          const bEnd = beh * 60 + bem;

          const blockStartDate = new Date(block.date);
          const diffTime = selectedDayObj.getTime() - blockStartDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // 1. Bloqueio na data exata
          if (block.date === selectedDate) {
            return currentMin < bEnd && slotEnd > bStart;
          }

          // 2. Lógica de Recorrência
          if (block.isRecurring && diffDays > 0) {
            const repeats = block.repeatCount || 1;
            
            if (block.recurringType === 'daily' && diffDays < repeats) {
              return currentMin < bEnd && slotEnd > bStart;
            }
            if (block.recurringType === 'weekly' && diffDays % 7 === 0 && (diffDays / 7) < repeats) {
              return currentMin < bEnd && slotEnd > bStart;
            }
            if (block.recurringType === 'monthly') {
               // Verifica se é o mesmo dia do mês e se está dentro do limite de meses
               const monthDiff = (selectedDayObj.getFullYear() - blockStartDate.getFullYear()) * 12 + (selectedDayObj.getMonth() - blockStartDate.getMonth());
               if (selectedDayObj.getDate() === blockStartDate.getDate() && monthDiff > 0 && monthDiff < repeats) {
                  return currentMin < bEnd && slotEnd > bStart;
               }
            }
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
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-white font-serif tracking-tight">Reservar Cita</h2>
            <p className="text-rose-500 text-[10px] uppercase tracking-widest font-bold">Peluquería Elías León</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800">
          
          {step === 1 && (
            <div className="space-y-4">
              {loadingData ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div> : (
                dbServices.length === 0 ? <p className="text-stone-500 text-center py-10 italic">No hay servicios configurados.</p> :
                dbServices.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="w-full flex justify-between items-center p-5 rounded-2xl bg-stone-950 border border-white/5 hover:border-rose-500/50 group transition-all text-left">
                    <div className="flex-1 pr-4">
                      <h3 className="text-white font-bold group-hover:text-rose-500 transition-colors">{s.name}</h3>
                      <p className="text-stone-500 text-xs mt-1">{s.duration} min | <span className="text-rose-600 font-bold">{s.price}</span></p>
                    </div>
                    <ChevronRight size={20} className="text-stone-700 group-hover:text-rose-500" />
                  </button>
                ))
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver</button>
              <h3 className="text-white font-bold flex items-center gap-2 px-2"><Calendar size={18} className="text-rose-500"/> Selecciona un día</h3>
              <div className="grid grid-cols-3 gap-2">
                {getNextDays().map((d) => (
                  <button key={d} onClick={() => { setSelectedDate(d); setStep(3); }} className={`p-4 rounded-2xl border transition-all text-center ${selectedDate === d ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500/50'}`}>
                    <span className="block text-[10px] uppercase font-black opacity-60 tracking-widest">{new Date(d).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                    <span className="block text-xl font-black mt-1">{new Date(d).getDate()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver</button>
              <h3 className="text-white font-bold flex items-center gap-2 px-2"><Clock size={18} className="text-rose-500"/> Horas para {selectedService?.name}</h3>
              {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div> : (
                <div className="grid grid-cols-4 gap-2">
                  {generateAvailableTimes().map((t) => (
                    <button key={t} onClick={() => { setSelectedTime(t); setStep(4); }} className={`p-3 rounded-xl border text-sm font-black transition-all ${selectedTime === t ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500'}`}>{t}</button>
                  ))}
                  {generateAvailableTimes().length === 0 && <div className="col-span-4 bg-red-500/5 p-6 rounded-2xl text-red-500 text-xs flex flex-col items-center gap-3 border border-red-500/10"><AlertCircle size={24}/><p className="text-center font-bold">Lo sentimos, no hay huecos libres para este servicio hoy. Por favor, elige otro día.</p></div>}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <button onClick={() => setStep(3)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver</button>
              <div className="space-y-4">
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                   <input type="text" placeholder="Nombre completo" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-rose-500/50 transition-all font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                   <input type="tel" placeholder="Tu teléfono" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-rose-500/50 transition-all font-bold" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <button disabled={loading || !formData.name || !formData.phone} onClick={handleBooking} className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl flex justify-center items-center gap-2 shadow-xl shadow-rose-900/20 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "Confirmar Mi Reserva"}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="py-10 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner"><CheckCircle2 size={56} /></div>
              <div className="px-4">
                <h3 className="text-3xl font-serif text-white font-bold tracking-tight">¡Reserva Lista!</h3>
                <p className="text-stone-400 mt-4 leading-relaxed font-medium">Gracias <b>{formData.name.split(' ')[0]}</b>, el mestre Elías te espera el <b>{new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</b> a las <b>{selectedTime}</b>.</p>
              </div>
              <button onClick={onClose} className="w-full py-5 bg-stone-800 text-white font-black rounded-2xl hover:bg-stone-700 transition-all">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;