import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { LogOut, Trash2, Calendar as CalendarIcon, User, Phone, Clock, Loader2, Scissors } from 'lucide-react';
import { Appointment } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Definir a data de hoje para filtrar agendamentos passados
    const today = new Date().toISOString().split('T')[0];

    // 2. Query para buscar agendamentos futuros, ordenados por data e hora
    const q = query(
      collection(db, "appointments"),
      where("date", ">=", today),
      orderBy("date", "asc"),
      orderBy("startTime", "asc")
    );

    // 3. Escuta em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Appointment));
      setAppointments(list);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar dashboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função para cancelar/eliminar agendamento
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      try {
        await deleteDoc(doc(db, "appointments", id));
      } catch (error) {
        alert("Error al eliminar la cita.");
      }
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950 flex flex-col">
      {/* Header do Painel */}
      <header className="bg-stone-900 border-b border-rose-900/20 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">Panel de Gestión</h2>
              <p className="text-rose-500 text-[10px] uppercase font-bold tracking-[0.2em]">Peluquería Elías León</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-2 bg-stone-800 hover:bg-red-900/30 text-stone-400 hover:text-red-500 px-4 py-2 rounded-xl transition-all border border-white/5 text-sm font-bold"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold flex items-center gap-3">
              <CalendarIcon className="text-rose-500" size={20} />
              Próximas Citas
            </h3>
            <span className="bg-stone-900 text-stone-500 px-3 py-1 rounded-full text-xs border border-white/5">
              {appointments.length} Total
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-4">
              <Loader2 className="animate-spin text-rose-500" size={40} />
              <p>Cargando agenda...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-32 bg-stone-900/30 rounded-[3rem] border border-dashed border-white/5">
              <p className="text-stone-500 italic">No hay citas registradas para los próximos días.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appointments.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] hover:border-rose-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-rose-600/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
                      {app.serviceName}
                    </div>
                    <button 
                      onClick={() => handleDelete(app.id!)} 
                      className="text-stone-700 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-all"
                      title="Eliminar cita"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-white">
                      <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center">
                        <User size={18} className="text-stone-500" />
                      </div>
                      <span className="font-bold text-lg">{app.clientName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Fecha</span>
                        <div className="flex items-center gap-2 text-stone-300 text-sm">
                          <CalendarIcon size={14} className="text-rose-500" />
                          {new Date(app.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Horario</span>
                        <div className="flex items-center gap-2 text-stone-300 text-sm">
                          <Clock size={14} className="text-rose-500" />
                          {app.startTime} - {app.endTime}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <a 
                        href={`tel:${app.clientPhone}`} 
                        className="flex items-center justify-center gap-3 w-full py-3 bg-stone-950 hover:bg-rose-600/10 text-stone-300 hover:text-rose-500 rounded-2xl transition-all text-sm font-bold border border-white/5"
                      >
                        <Phone size={16} /> {app.clientPhone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rodapé informativo do sistema */}
      <footer className="p-6 text-center text-stone-700 text-[10px] uppercase tracking-widest">
        Desarrollado por Allan Dev • Sistema de Gestión v1.0
      </footer>
    </div>
  );
};

export default AdminDashboard;