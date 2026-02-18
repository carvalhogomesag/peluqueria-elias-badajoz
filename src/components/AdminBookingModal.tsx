import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, Scissors, Loader2, Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CLIENT_ID } from '../constants';
import { Service } from '../types';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, services }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00'
  });

  if (!isOpen) return null;

  // Gerar opções de horários (08:00 às 21:00) de 15 em 15 min para o Admin ter mais flexibilidade
  const timeOptions = Array.from({ length: 53 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return;

    try {
      // Calcular EndTime
      const [h, m] = formData.startTime.split(':').map(Number);
      const startInMinutes = h * 60 + m;
      const endInMinutes = startInMinutes + selectedService.duration;
      const endTime = `${Math.floor(endInMinutes / 60).toString().padStart(2, '0')}:${(endInMinutes % 60).toString().padStart(2, '0')}`;

      await addDoc(collection(db, "businesses", CLIENT_ID, "appointments"), {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: formData.date,
        startTime: formData.startTime,
        endTime: endTime,
        createdAt: serverTimestamp()
      });

      onClose();
      setFormData({ clientName: '', clientPhone: '', serviceId: '', date: new Date().toISOString().split('T')[0], startTime: '11:00' });
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      alert("Erro ao salvar. Verifique a consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Overlay com Blur suave */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-stone-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Nova Marcação Manual</h2>
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Painel de Gestão</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nome do Cliente */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase ml-1 flex items-center gap-2">
                <User size={12} /> Cliente
              </label>
              <input 
                required
                type="text"
                placeholder="Ex: Carlos Silva"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50 transition-all"
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
              />
            </div>

            {/* Telemóvel */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase ml-1 flex items-center gap-2">
                <Phone size={12} /> Telemóvel
              </label>
              <input 
                required
                type="tel"
                placeholder="912 345 678"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50 transition-all"
                value={formData.clientPhone}
                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
              />
            </div>
          </div>

          {/* Seleção de Serviço */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase ml-1 flex items-center gap-2">
              <Scissors size={12} /> Serviço
            </label>
            <select 
              required
              className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50 transition-all appearance-none"
              value={formData.serviceId}
              onChange={e => setFormData({...formData, serviceId: e.target.value})}
            >
              <option value="">Selecione um serviço...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min - {s.price})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Data */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase ml-1 flex items-center gap-2">
                <Calendar size={12} /> Data
              </label>
              <input 
                required
                type="date"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50 transition-all color-scheme-dark"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {/* Hora de Início */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase ml-1 flex items-center gap-2">
                <Clock size={12} /> Início
              </label>
              <select 
                required
                className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50 transition-all appearance-none"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Botão Salvar */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl shadow-rose-900/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Confirmar Agendamento</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminBookingModal;