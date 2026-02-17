import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Service, Appointment } from '../types';
// Importação da conexão com o banco
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // --- ESTADOS DE UI ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // --- ESTADOS DE DADOS ---
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [occupiedSlots, setOccupiedSlots] = useState<{start: number, end: number}[]>([]);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // 1. Resetar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedService(null);
      setSelectedDate("");
      setSelectedTime("");
      setFormData({ name: '', phone: '' });
    }
  }, [isOpen]);

  // 2. Escutar Serviços do Firebase em tempo real
  useEffect(() => {
    if (isOpen) {
      const q = query(collection(db, "services"), orderBy("name", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setDbServices(list);
        setLoadingData(false);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  // 3. Buscar horários ocupados quando a data for selecionada
  useEffect(() => {
    if (selectedDate && isOpen) {
      const fetchBookings = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, "appointments"), where("date", "==", selectedDate));
          const snapshot = await getDocs(q);
          const busy = snapshot.docs.map(doc => {
            const data = doc.data();
            const [startH, startM] = data.startTime.split(':').map(Number);
            const [endH, endM] = data.endTime.split(':').map(Number);
            return { start: startH * 60 + startM, end: endH * 60 + endM };
          });
          setOccupiedSlots(busy);
        } catch (e) {
          console.error("Error al cargar agenda:", e);
        }
        setLoading(false);
      };
      fetchBookings();
    }
  }, [selectedDate, isOpen]);

  if (!isOpen) return null;

  // 4. Lógica para gerar horários disponíveis (11h às 21h)
  const generateAvailableTimes = () => {
    const slots = [];
    let currentMin = 11 * 60; // 11:00
    const endMin = 21 * 60;   // 21:00
    const stepMin = 30;       

    while (currentMin + (selectedService?.duration || 0) <= endMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      const slotStart = currentMin;
      const slotEnd = currentMin + (selectedService?.duration || 0);

      const isBusy = occupiedSlots.some(busy => 
        (slotStart < busy.end && slotEnd > busy.start)
      );

      if (!isBusy) slots.push(timeStr);
      currentMin += stepMin;
    }
    return slots;
  };

  // 5. Salvar agendamento
  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endTotal = (h * 60) + m + selectedService.duration;
      const endTimeStr = `${Math.floor(endTotal/60).toString().padStart(2,'0')}:${(endTotal%60).toString().padStart(2,'0')}`;

      const newAppointment: Appointment = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        clientName: formData.name,
        clientPhone: formData.phone,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTimeStr,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "appointments"), newAppointment);
      setStep(5);
    } catch (e) {
      alert("Hubo un error al guardar tu reserva.");
    }
    setLoading(false);
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-stone-900 border border-rose-900/30 w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Reservar Cita</h2>
            <p className="text-rose-500 text-xs uppercase tracking-widest font-bold">Peluquería Elías León</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {/* STEP 1: Seleção de Serviço Dinâmico */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <p className="text-stone-400 text-sm mb-4">¿Qué servicio deseas hoy?</p>
              
              {loadingData ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" size={32} /></div>
              ) : dbServices.length === 0 ? (
                <p className="text-stone-500 italic text-center py-10">No hay servicios disponibles en este momento.</p>
              ) : (
                dbServices.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="w-full flex justify-between items-center p-4 rounded-2xl bg-stone-950 border border-white/5 hover:border-rose-500/50 group transition-all">
                    <div className="flex-1 pr-4">
                      <h3 className="text-white font-bold group-hover:text-rose-500 transition-colors">{s.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-stone-500 text-xs font-medium">
                        <Clock size={12}/> {s.duration} min | <span className="text-rose-600 font-bold">{s.price}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-stone-700 group-hover:text-rose-500 transition-all" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* STEP 2: Data */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(1)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver a servicios</button>
              <h3 className="text-white font-bold flex items-center gap-2"><Calendar size={18} className="text-rose-500"/> Selecciona un día</h3>
              <div className="grid grid-cols-3 gap-2">
                {getNextDays().map((d) => (
                  <button key={d} onClick={() => { setSelectedDate(d); setStep(3); }} className={`p-3 rounded-2xl border transition-all text-center ${selectedDate === d ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-900/20' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500/50'}`}>
                    <span className="block text-[10px] uppercase font-bold opacity-60">{new Date(d).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                    <span className="block text-lg font-black">{new Date(d).getDate()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Horário */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(2)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver al calendario</button>
              <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18} className="text-rose-500"/> Horarios para {selectedService?.name}</h3>
              
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" size={32} /></div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {generateAvailableTimes().map((t) => (
                    <button key={t} onClick={() => { setSelectedTime(t); setStep(4); }} className={`p-2 rounded-xl border text-sm font-bold transition-all ${selectedTime === t ? 'bg-rose-600 border-rose-600 text-white' : 'bg-stone-950 border-white/5 text-stone-400 hover:border-rose-500'}`}>{t}</button>
                  ))}
                  {generateAvailableTimes().length === 0 && <p className="col-span-4 text-stone-500 text-center py-4 italic">No hay huecos disponibles para esta duración.</p>}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Formulário */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(3)} className="text-stone-500 text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"><ChevronLeft size={14}/> Volver a horarios</button>
              <h3 className="text-white font-bold flex items-center gap-2"><User size={18} className="text-rose-500"/> Tus datos de contacto</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nombre completo" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 px-4 text-white outline-none focus:border-rose-500/50 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="tel" placeholder="Teléfono" className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 px-4 text-white outline-none focus:border-rose-500/50 transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <button disabled={loading || !formData.name || !formData.phone} onClick={handleBooking} className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all flex justify-center items-center gap-2 shadow-xl shadow-rose-900/20">
                {loading ? <Loader2 className="animate-spin" /> : "Confirmar Reserva"}
              </button>
            </div>
          )}

          {/* STEP 5: Sucesso */}
          {step === 5 && (
            <div className="py-8 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto text-rose-500"><CheckCircle2 size={48} /></div>
              <div>
                <h3 className="text-2xl font-serif text-white font-bold tracking-tight">¡Reserva Confirmada!</h3>
                <p className="text-stone-400 mt-2">Gracias {formData.name.split(' ')[0]}, Elías te espera el {new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} a las {selectedTime}.</p>
              </div>
              <button onClick={onClose} className="w-full py-4 bg-stone-800 text-white font-bold rounded-2xl hover:bg-stone-700 transition-all">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;