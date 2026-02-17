import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  LogOut, Trash2, Calendar as CalendarIcon, User, 
  Phone, Clock, Loader2, Scissors, Plus, LayoutDashboard, 
  Settings, Briefcase, LayoutList, CalendarDays, Coffee, Ban, Save, CheckCircle
} from 'lucide-react';
import { Appointment, Service, WorkConfig, TimeBlock } from '../types';
import AdminCalendar from './AdminCalendar';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'settings'>('appointments');
  const [appointmentsMode, setAppointmentsMode] = useState<'list' | 'calendar'>('calendar');

  // --- ESTADOS DE DADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [workConfig, setWorkConfig] = useState<WorkConfig>({
    startHour: '11:00',
    endHour: '21:00',
    breakStart: '14:00',
    breakEnd: '15:00',
    daysOff: [0] // Domingo padrão
  });

  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FORMULÁRIO ---
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: 30 });
  const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>({
    title: '', date: '', startTime: '', endTime: '', isRecurring: false, recurringType: 'weekly'
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Escuta Agendamentos
    const unsubApp = onSnapshot(query(collection(db, "appointments"), where("date", ">=", today), orderBy("date", "asc")), (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    });

    // 2. Escuta Serviços
    const unsubServ = onSnapshot(query(collection(db, "services"), orderBy("name", "asc")), (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });

    // 3. Escuta Configuração de Trabalho
    const unsubConfig = onSnapshot(doc(db, "config", "work-schedule"), (snap) => {
      if (snap.exists()) setWorkConfig(snap.data() as WorkConfig);
    });

    // 4. Escuta Bloqueios de Tempo
    const unsubBlocks = onSnapshot(query(collection(db, "timeBlocks")), (snap) => {
      setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
    });

    return () => { unsubApp(); unsubServ(); unsubConfig(); unsubBlocks(); };
  }, []);

  // --- AÇÕES ---
  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, "config", "work-schedule"), workConfig);
      alert("Configuración guardada correctamente.");
    } catch (e) { alert("Error al guardar."); }
  };

  const handleAddTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.title || !newBlock.date || !newBlock.startTime || !newBlock.endTime) return;
    await addDoc(collection(db, "timeBlocks"), newBlock);
    setNewBlock({ title: '', date: '', startTime: '', endTime: '', isRecurring: false, recurringType: 'weekly' });
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    await addDoc(collection(db, "services"), { ...newService, createdAt: serverTimestamp() });
    setNewService({ name: '', description: '', price: '', duration: 30 });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950 flex flex-col text-left overflow-hidden">
      {/* HEADER PRINCIPAL */}
      <header className="bg-stone-900 border-b border-rose-900/20 p-6 z-30">
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">Gestión Elías</h2>
              <p className="text-rose-500 text-[10px] uppercase font-bold tracking-widest">Panel de Control</p>
            </div>
          </div>

          <nav className="flex bg-stone-800/50 p-1 rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('appointments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'appointments' ? 'bg-rose-600 text-white' : 'text-stone-400'}`}>
              <LayoutDashboard size={16} /> CITAS
            </button>
            <button onClick={() => setActiveTab('services')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-rose-600 text-white' : 'text-stone-400'}`}>
              <Briefcase size={16} /> SERVICIOS
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-rose-600 text-white' : 'text-stone-400'}`}>
              <Settings size={16} /> CONFIGURACIÓN
            </button>
          </nav>
          
          <button onClick={() => { auth.signOut(); onLogout(); }} className="text-stone-500 hover:text-red-500 flex items-center gap-2 font-bold text-sm">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">

          {/* TAB: CITAS */}
          {activeTab === 'appointments' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-white font-bold flex items-center gap-3"><CalendarIcon className="text-rose-500"/> Agenda de Clientes</h3>
                <div className="flex bg-stone-900 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setAppointmentsMode('calendar')} className={`p-2 rounded-lg ${appointmentsMode === 'calendar' ? 'bg-stone-800 text-rose-500' : 'text-stone-600'}`}><CalendarDays size={20}/></button>
                  <button onClick={() => setAppointmentsMode('list')} className={`p-2 rounded-lg ${appointmentsMode === 'list' ? 'bg-stone-800 text-rose-500' : 'text-stone-600'}`}><LayoutList size={20}/></button>
                </div>
              </div>
              {appointmentsMode === 'calendar' ? <AdminCalendar appointments={appointments} /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appointments.map(app => (
                    <div key={app.id} className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] relative">
                      <span className="bg-rose-600/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{app.serviceName}</span>
                      <div className="mt-4 text-white font-bold text-lg">{app.clientName}</div>
                      <div className="text-stone-400 text-sm mt-2">{app.date} • {app.startTime}</div>
                      <button onClick={() => deleteDoc(doc(db, "appointments", app.id!))} className="absolute top-6 right-6 text-stone-700 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICIOS */}
          {activeTab === 'services' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <form onSubmit={handleAddService} className="bg-stone-900 border border-rose-900/20 p-8 rounded-[3rem] shadow-xl space-y-6">
                  <h3 className="text-white font-bold flex items-center gap-2"><Plus className="text-rose-500"/> Crear Servicio</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <input required value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" placeholder="Nombre" />
                    <input required value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" placeholder="Precio (ex: 15€)" />
                    <input required type="number" value={newService.duration} onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" placeholder="Minutos" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all">Guardar Servicio</button>
                </form>
                <div className="grid gap-4">
                   {dbServices.map(s => (
                     <div key={s.id} className="bg-stone-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                        <div><h4 className="text-white font-bold">{s.name}</h4><p className="text-stone-500 text-xs">{s.duration} min • {s.price}</p></div>
                        <button onClick={() => deleteDoc(doc(db, "services", s.id!))} className="text-stone-700 hover:text-red-500"><Trash2 size={20}/></button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* TAB: CONFIGURACIÓN (O NOVO) */}
          {activeTab === 'settings' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 pb-20">
              
              {/* 1. HORÁRIO DE TRABALHO */}
              <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl">
                <h3 className="text-white font-bold mb-8 flex items-center gap-3"><Clock className="text-rose-500"/> Horario de Apertura</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block">Inicio Jornada</label>
                    <input type="time" value={workConfig.startHour} onChange={e => setWorkConfig({...workConfig, startHour: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block">Fin Jornada</label>
                    <input type="time" value={workConfig.endHour} onChange={e => setWorkConfig({...workConfig, endHour: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block">Inicio Descanso</label>
                    <input type="time" value={workConfig.breakStart} onChange={e => setWorkConfig({...workConfig, breakStart: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block">Fin Descanso</label>
                    <input type="time" value={workConfig.breakEnd} onChange={e => setWorkConfig({...workConfig, breakEnd: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                  </div>
                </div>
                
                <div className="mt-8 border-t border-white/5 pt-8">
                   <h4 className="text-stone-400 text-sm font-bold mb-4">Días de Cierre (Días Libres)</h4>
                   <div className="flex flex-wrap gap-2">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                        <button 
                          key={day}
                          onClick={() => {
                            const newDays = workConfig.daysOff.includes(idx) ? workConfig.daysOff.filter(d => d !== idx) : [...workConfig.daysOff, idx];
                            setWorkConfig({...workConfig, daysOff: newDays});
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${workConfig.daysOff.includes(idx) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-stone-950 border-white/5 text-stone-500'}`}
                        >
                          {day}
                        </button>
                      ))}
                   </div>
                </div>

                <button onClick={handleSaveConfig} className="mt-10 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-rose-900/20">
                  <Save size={20}/> Guardar Configuración
                </button>
              </div>

              {/* 2. BLOQUEIO MANUAL DE AGENDA */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl h-fit">
                   <h3 className="text-white font-bold mb-6 flex items-center gap-3"><Ban className="text-rose-500"/> Bloquear Agenda</h3>
                   <form onSubmit={handleAddTimeBlock} className="space-y-4">
                      <input required placeholder="Motivo (ex: Médico, Vacaciones)" value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="date" value={newBlock.date} onChange={e => setNewBlock({...newBlock, date: e.target.value})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                        <div className="flex items-center gap-2 bg-stone-950 border border-white/5 rounded-2xl px-4">
                           <input type="checkbox" checked={newBlock.isRecurring} onChange={e => setNewBlock({...newBlock, isRecurring: e.target.checked})} className="accent-rose-500 w-4 h-4" />
                           <span className="text-stone-500 text-xs font-bold">Recurrente</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="time" value={newBlock.startTime} onChange={e => setNewBlock({...newBlock, startTime: e.target.value})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                        <input required type="time" value={newBlock.endTime} onChange={e => setNewBlock({...newBlock, endTime: e.target.value})} className="bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                      </div>
                      <button type="submit" className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-rose-500 font-black rounded-2xl transition-all border border-rose-500/20">Aplicar Bloqueo</button>
                   </form>
                </div>

                <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl">
                   <h3 className="text-white font-bold mb-6 flex items-center gap-3"><LayoutList className="text-rose-500"/> Bloqueos Activos</h3>
                   <div className="space-y-3">
                      {timeBlocks.length === 0 ? <p className="text-stone-600 italic text-sm text-center py-10">No hay bloqueos manuales.</p> : timeBlocks.map(block => (
                        <div key={block.id} className="bg-stone-950 border border-white/5 p-4 rounded-2xl flex justify-between items-center group">
                           <div>
                              <h4 className="text-stone-300 font-bold text-sm">{block.title}</h4>
                              <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest mt-1">{block.date} • {block.startTime}-{block.endTime}</p>
                           </div>
                           <button onClick={() => deleteDoc(doc(db, "timeBlocks", block.id!))} className="text-stone-800 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <footer className="p-4 text-center text-stone-800 text-[10px] uppercase tracking-[0.4em] bg-stone-950 border-t border-white/5">
        Sistema de Control Elías • Allan Dev v1.2
      </footer>
    </div>
  );
};

export default AdminDashboard;