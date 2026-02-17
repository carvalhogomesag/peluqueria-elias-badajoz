import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  LogOut, Trash2, Calendar as CalendarIcon, User, 
  Phone, Clock, Loader2, Scissors, Plus, LayoutDashboard, 
  Settings, Briefcase, Info 
} from 'lucide-react';
import { Appointment, Service } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loadingApp, setLoadingApp] = useState(true);
  const [loadingServ, setLoadingServ] = useState(true);

  // Estado para o formulário de novo serviço
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: 30
  });

  useEffect(() => {
    // 1. Escuta de Agendamentos (Hoje em diante)
    const today = new Date().toISOString().split('T')[0];
    const qApp = query(
      collection(db, "appointments"),
      where("date", ">=", today),
      orderBy("date", "asc"),
      orderBy("startTime", "asc")
    );

    const unsubApp = onSnapshot(qApp, (snapshot) => {
      setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoadingApp(false);
    });

    // 2. Escuta de Serviços (Coleção 'services')
    const qServ = query(collection(db, "services"), orderBy("name", "asc"));
    const unsubServ = onSnapshot(qServ, (snapshot) => {
      setDbServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      setLoadingServ(false);
    });

    return () => {
      unsubApp();
      unsubServ();
    };
  }, []);

  // --- AÇÕES ---
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) {
      alert("Por favor, rellena el nombre y el precio.");
      return;
    }

    try {
      await addDoc(collection(db, "services"), {
        ...newService,
        createdAt: serverTimestamp()
      });
      setNewService({ name: '', description: '', price: '', duration: 30 });
      alert("Servicio creado con éxito.");
    } catch (error) {
      console.error(error);
      alert("Error ao criar serviço.");
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (window.confirm("¿Cancelar esta cita?")) await deleteDoc(doc(db, "appointments", id));
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm("¿Eliminar este servicio definitivamente?")) await deleteDoc(doc(db, "services", id));
  };

  const handleSignOut = async () => {
    await auth.signOut();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950 flex flex-col">
      {/* HEADER DINÂMICO */}
      <header className="bg-stone-900 border-b border-rose-900/20 p-6 sticky top-0 z-30">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">Gestión Elías</h2>
              <p className="text-rose-500 text-[10px] uppercase font-bold tracking-widest">Admin Panel</p>
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS */}
          <div className="flex bg-stone-800/50 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'appointments' ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> CITAS
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
            >
              <Briefcase size={16} /> SERVICIOS
            </button>
          </div>
          
          <button onClick={handleSignOut} className="flex items-center gap-2 bg-stone-800 text-stone-400 hover:text-red-500 px-4 py-2 rounded-xl transition-all border border-white/5 text-sm font-bold">
            <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">

          {/* TAB: AGENDAMENTOS */}
          {activeTab === 'appointments' && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-white font-bold mb-8 flex items-center gap-3"><CalendarIcon className="text-rose-500"/> Próximas Reservas</h3>
              {loadingApp ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={40} /></div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-32 bg-stone-900/20 rounded-[3rem] border border-dashed border-white/5 text-stone-500 italic">No hay citas registradas.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appointments.map(app => (
                    <div key={app.id} className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] relative group">
                      <div className="flex justify-between items-start mb-6">
                        <span className="bg-rose-600/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{app.serviceName}</span>
                        <button onClick={() => handleDeleteApp(app.id!)} className="text-stone-700 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                      <div className="space-y-3 text-left">
                        <div className="text-white font-bold text-lg flex items-center gap-2"><User size={16} className="text-stone-500"/> {app.clientName}</div>
                        <div className="text-stone-400 text-sm flex items-center gap-2"><CalendarIcon size={14}/> {app.date}</div>
                        <div className="text-stone-400 text-sm flex items-center gap-2"><Clock size={14}/> {app.startTime} - {app.endTime}</div>
                        <div className="pt-4 border-t border-white/5"><a href={`tel:${app.clientPhone}`} className="text-rose-500 font-bold flex items-center gap-2"><Phone size={14}/> {app.clientPhone}</a></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVIÇOS (NOVO) */}
          {activeTab === 'services' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-10">
              
              {/* Formulário de Criação */}
              <div className="bg-stone-900 border border-rose-900/20 p-6 md:p-8 rounded-[3rem] shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Plus className="text-rose-500"/> Añadir Nuevo Servicio</h3>
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-black text-stone-500 mb-2 block">Nombre del Servicio</label>
                    <input 
                      required
                      value={newService.name} 
                      onChange={e => setNewService({...newService, name: e.target.value})}
                      className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50"
                      placeholder="Ej: Corte Clásico"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-stone-500 mb-2 block">Precio</label>
                    <input 
                      required
                      value={newService.price} 
                      onChange={e => setNewService({...newService, price: e.target.value})}
                      className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50"
                      placeholder="15€"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-stone-500 mb-2 block">Duración (Minutos)</label>
                    <input 
                      required
                      type="number"
                      value={newService.duration} 
                      onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})}
                      className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-black text-stone-500 mb-2 block">Descripción Corta</label>
                    <input 
                      value={newService.description} 
                      onChange={e => setNewService({...newService, description: e.target.value})}
                      className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500/50"
                      placeholder="Ej: Corte a tijera y lavado..."
                    />
                  </div>
                  <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20">
                    <Plus size={20} /> Crear Servicio
                  </button>
                </form>
              </div>

              {/* Listagem de Serviços */}
              <div className="space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Briefcase className="text-rose-500"/> Servicios Activos</h3>
                {loadingServ ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div>
                ) : dbServices.length === 0 ? (
                  <p className="text-stone-500 italic">No hay servicios creados aún.</p>
                ) : (
                  <div className="grid gap-4">
                    {dbServices.map(s => (
                      <div key={s.id} className="bg-stone-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:border-rose-500/20 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-stone-950 rounded-xl flex items-center justify-center text-rose-500"><Settings size={20}/></div>
                          <div>
                            <h4 className="text-white font-bold text-lg">{s.name}</h4>
                            <p className="text-stone-500 text-xs">{s.duration} min • <span className="text-rose-600">{s.price}</span></p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteService(s.id!)} className="text-stone-700 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-6 text-center text-stone-700 text-[10px] uppercase tracking-[0.3em] bg-stone-950 border-t border-white/5">
        Gestión Elías León • Desarrollado por Allan Dev
      </footer>
    </div>
  );
};

export default AdminDashboard;