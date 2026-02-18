import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  deleteDoc, doc, addDoc, setDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  LogOut, Trash2, Calendar as CalendarIcon, User, 
  Phone, Clock, Loader2, Scissors, Plus, LayoutDashboard, 
  Settings, Briefcase, LayoutList, CalendarDays, Ban, Save, Repeat, Hash
} from 'lucide-react';
import { Appointment, Service, WorkConfig, TimeBlock } from '../types';
import AdminCalendar from './AdminCalendar';
import AdminBookingModal from './AdminBookingModal';
import { BUSINESS_INFO, CLIENT_ID } from '../constants';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // --- NAVEGAÇÃO E MODAIS ---
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'settings'>('appointments');
  const [appointmentsMode, setAppointmentsMode] = useState<'calendar' | 'list'>('calendar');
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // --- DADOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [workConfig, setWorkConfig] = useState<WorkConfig>({
    startHour: '11:00', endHour: '21:00', breakStart: '14:00', breakEnd: '15:00', daysOff: [0]
  });
  
  const [loadingApp, setLoadingApp] = useState(true);
  const [loadingServ, setLoadingServ] = useState(true);

  // --- FORMULÁRIOS DE CRIAÇÃO RÁPIDA (SERVIÇOS E BLOQUEIOS) ---
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: 30 });
  const [newBlock, setNewBlock] = useState<Partial<TimeBlock>>({
    title: '', date: new Date().toISOString().split('T')[0], startTime: '11:00', endTime: '12:00', 
    isRecurring: false, recurringType: 'weekly', repeatCount: 1
  });

  const hoursOptions = Array.from({ length: 29 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const qApp = query(
      collection(db, "businesses", CLIENT_ID, "appointments"), 
      where("date", ">=", today), 
      orderBy("date", "asc")
    );
    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoadingApp(false);
    });

    const qServ = query(collection(db, "businesses", CLIENT_ID, "services"), orderBy("name", "asc"));
    const unsubServ = onSnapshot(qServ, (snap) => {
      setDbServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      setLoadingServ(false);
    });

    const unsubConfig = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), (snap) => {
      if (snap.exists()) setWorkConfig(snap.data() as WorkConfig);
    });

    const unsubBlocks = onSnapshot(collection(db, "businesses", CLIENT_ID, "timeBlocks"), (snap) => {
      setTimeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock)));
    });

    return () => { unsubApp(); unsubServ(); unsubConfig(); unsubBlocks(); };
  }, []);

  // --- HANDLERS DE AGENDAMENTO ---
  const handleOpenNewBooking = () => {
    setSelectedAppointment(null);
    setIsAdminBookingOpen(true);
  };

  const handleEditAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsAdminBookingOpen(true);
  };

  // --- OUTRAS AÇÕES ---
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    try {
      await addDoc(collection(db, "businesses", CLIENT_ID, "services"), { ...newService, createdAt: serverTimestamp() });
      setNewService({ name: '', description: '', price: '', duration: 30 });
      alert("Servicio creado.");
    } catch (error) { alert("Error."); }
  };

  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "work-schedule"), workConfig);
      alert("Configuración guardada.");
    } catch (e) { alert("Error."); }
  };

  const handleAddTimeBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.title) return;
    try {
      await addDoc(collection(db, "businesses", CLIENT_ID, "timeBlocks"), newBlock);
      setNewBlock({ title: '', date: new Date().toISOString().split('T')[0], startTime: '11:00', endTime: '12:00', isRecurring: false, recurringType: 'weekly', repeatCount: 1 });
      alert("Bloqueo aplicado.");
    } catch (e) { alert("Error."); }
  };

  const handleDeleteApp = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no lixo
    if (window.confirm("¿Eliminar cita?")) await deleteDoc(doc(db, "businesses", CLIENT_ID, "appointments", id));
  };

  const handleSignOut = async () => { await auth.signOut(); onLogout(); };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950 flex flex-col text-left overflow-hidden">
      {/* HEADER */}
      <header className="bg-stone-900 border-b border-rose-900/20 p-6 z-30 shadow-2xl">
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">Gestión {BUSINESS_INFO.name}</h2>
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Panel Administrativo</p>
            </div>
          </div>

          <nav className="flex bg-stone-800/40 p-1 rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('appointments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'appointments' ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-200'}`}>
              <LayoutDashboard size={16} /> CITAS
            </button>
            <button onClick={() => setActiveTab('services')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-200'}`}>
              <Briefcase size={16} /> SERVICIOS
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-200'}`}>
              <Settings size={16} /> CONFIG
            </button>
          </nav>
          
          <button onClick={handleSignOut} className="text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2 font-bold text-sm">
            <LogOut size={18} /> <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">

          {/* ABA: AGENDAMENTOS */}
          {activeTab === 'appointments' && (
            <div className="animate-in fade-in duration-500 h-full flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="text-white font-bold flex items-center gap-3 text-lg">
                  <CalendarIcon className="text-rose-500" size={24}/> 
                  Agenda de Reservas
                </h3>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={handleOpenNewBooking}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-900/20 active:scale-95"
                  >
                    <Plus size={16} /> NUEVA CITA
                  </button>

                  <div className="flex bg-stone-900 border border-white/5 p-1 rounded-xl">
                    <button onClick={() => setAppointmentsMode('calendar')} className={`p-2 rounded-lg transition-all ${appointmentsMode === 'calendar' ? 'bg-stone-800 text-rose-500' : 'text-stone-600 hover:text-stone-400'}`}>
                      <CalendarDays size={20}/>
                    </button>
                    <button onClick={() => setAppointmentsMode('list')} className={`p-2 rounded-lg transition-all ${appointmentsMode === 'list' ? 'bg-stone-800 text-rose-500' : 'text-stone-600 hover:text-stone-400'}`}>
                      <LayoutList size={20}/>
                    </button>
                  </div>
                </div>
              </div>

              {loadingApp ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={40} /></div>
              ) : (
                appointmentsMode === 'calendar' ? (
                  <AdminCalendar 
                    appointments={appointments} 
                    timeBlocks={timeBlocks} 
                    onEditAppointment={handleEditAppointment} 
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {appointments.length === 0 ? (
                      <div className="col-span-full bg-stone-900/50 border border-dashed border-white/10 rounded-[2.5rem] py-20 text-center">
                        <p className="text-stone-600 italic">No hay citas registradas.</p>
                      </div>
                    ) : (
                      appointments.map(app => (
                        <div 
                          key={app.id} 
                          onClick={() => handleEditAppointment(app)}
                          className="bg-stone-900 border border-white/5 p-6 rounded-[2.5rem] relative group shadow-lg hover:border-rose-500/30 transition-all cursor-pointer"
                        >
                          <span className="bg-rose-600/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{app.serviceName}</span>
                          <div className="mt-4 text-white font-bold text-lg leading-tight">{app.clientName}</div>
                          <div className="text-stone-400 text-sm mt-2 font-medium">
                            {new Date(app.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {app.startTime} - {app.endTime}
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-rose-400 font-bold text-sm">
                            <Phone size={14}/> {app.clientPhone}
                          </div>
                          <button 
                            onClick={(e) => handleDeleteApp(e, app.id!)} 
                            className="absolute top-6 right-6 text-stone-700 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* ABA: SERVIÇOS */}
          {activeTab === 'services' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <form onSubmit={handleAddService} className="bg-stone-900 border border-rose-900/20 p-8 rounded-[3rem] shadow-2xl space-y-6">
                  <h3 className="text-white font-bold flex items-center gap-2 text-lg"><Plus className="text-rose-500"/> Nuevo Servicio</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-stone-500 ml-1">Nombre</label>
                       <input required value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-stone-500 ml-1">Precio</label>
                       <input required value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" placeholder="15€" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-stone-500 ml-1">Duración (Mins)</label>
                       <input required type="number" value={newService.duration} onChange={e => setNewService({...newService, duration: parseInt(e.target.value)})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl shadow-xl transition-all">Crear Servicio</button>
                </form>
                <div className="grid gap-4">
                   {loadingServ ? <Loader2 className="animate-spin text-rose-500 mx-auto"/> : dbServices.map(s => (
                     <div key={s.id} className="bg-stone-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center group transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-stone-950 rounded-xl flex items-center justify-center text-rose-500"><Briefcase size={18}/></div>
                           <div><h4 className="text-white font-bold">{s.name}</h4><p className="text-stone-500 text-xs">{s.duration} min • {s.price}</p></div>
                        </div>
                        <button onClick={() => { if(window.confirm("¿Eliminar?")) deleteDoc(doc(db, "businesses", CLIENT_ID, "services", s.id!)) }} className="text-stone-700 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* ABA: CONFIGURAÇÃO */}
          {activeTab === 'settings' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 pb-24">
              <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-2xl">
                <h3 className="text-white font-bold mb-8 flex items-center gap-3"><Clock className="text-rose-500"/> Jornada Laboral</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {['startHour', 'endHour', 'breakStart', 'breakEnd'].map((key) => (
                    <div key={key}>
                      <label className="text-[10px] text-stone-500 uppercase font-black mb-2 block">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <select 
                        value={(workConfig as any)[key]} 
                        onChange={e => setWorkConfig({...workConfig, [key]: e.target.value})}
                        className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500 appearance-none font-bold"
                      >
                        {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-white/5">
                   <h4 className="text-stone-400 text-sm font-bold mb-4">Días de Cierre:</h4>
                   <div className="flex flex-wrap gap-2">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                        <button key={day} onClick={() => {
                          const newDays = workConfig.daysOff.includes(idx) ? workConfig.daysOff.filter(d => d !== idx) : [...workConfig.daysOff, idx];
                          setWorkConfig({...workConfig, daysOff: newDays});
                        }} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${workConfig.daysOff.includes(idx) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-stone-950 border-white/5 text-stone-600'}`}>{day.toUpperCase()}</button>
                      ))}
                   </div>
                </div>
                <button onClick={handleSaveConfig} className="mt-10 flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-rose-900/30 transition-all"><Save size={20}/> Guardar Jornada</button>
              </div>

              {/* BLOQUEIOS MANUAIS */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl">
                   <h3 className="text-white font-bold mb-6 flex items-center gap-3"><Ban className="text-rose-500"/> Bloquear Agenda</h3>
                   <form onSubmit={handleAddTimeBlock} className="space-y-6">
                      <input required placeholder="Motivo (ex: Médico)" value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                      <input required type="date" value={newBlock.date} onChange={e => setNewBlock({...newBlock, date: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-rose-500" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Desde</label>
                           <select value={newBlock.startTime} onChange={e => setNewBlock({...newBlock, startTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500">
                              {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] uppercase text-stone-500 font-bold ml-1">Hasta</label>
                           <select value={newBlock.endTime} onChange={e => setNewBlock({...newBlock, endTime: e.target.value})} className="w-full bg-stone-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500">
                              {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                           </select>
                        </div>
                      </div>

                      <div className="bg-stone-950 border border-white/5 p-4 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 text-stone-300 font-bold text-sm"><Repeat size={18} className="text-rose-500"/> Recurrente</div>
                           <input type="checkbox" checked={newBlock.isRecurring} onChange={e => setNewBlock({...newBlock, isRecurring: e.target.checked})} className="w-6 h-6 accent-rose-500" />
                        </div>
                        {newBlock.isRecurring && (
                          <div className="space-y-4 animate-in slide-in-from-top-2">
                             <div className="flex gap-2">
                               {['daily', 'weekly', 'monthly'].map(type => (
                                 <button key={type} type="button" onClick={() => setNewBlock({...newBlock, recurringType: type as any})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${newBlock.recurringType === type ? 'bg-rose-600 border-rose-600 text-white' : 'text-stone-500 border-white/5'}`}>
                                   {type === 'daily' ? 'Diario' : type === 'weekly' ? 'Semanal' : 'Mensual'}
                                 </button>
                               ))}
                             </div>
                             <div className="flex items-center justify-between bg-stone-900 p-4 rounded-2xl border border-white/5">
                                <span className="text-stone-400 font-bold text-xs flex items-center gap-2"><Hash size={16} className="text-rose-500"/> Repeticiones:</span>
                                <input type="number" min="1" max="52" value={newBlock.repeatCount} onChange={e => setNewBlock({...newBlock, repeatCount: parseInt(e.target.value)})} className="w-16 bg-stone-950 border border-white/5 rounded-lg p-2 text-white text-center font-black" />
                             </div>
                          </div>
                        )}
                      </div>
                      <button type="submit" className="w-full py-5 bg-white text-stone-950 font-black rounded-2xl shadow-xl active:scale-95 transition-all">Aplicar Bloqueo</button>
                   </form>
                </div>

                <div className="bg-stone-900 border border-white/5 p-8 rounded-[3rem] shadow-xl flex flex-col">
                   <h3 className="text-white font-bold mb-6 flex items-center gap-3"><LayoutList className="text-rose-500"/> Lista de Bloqueos</h3>
                   <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2 scrollbar-thin scrollbar-thumb-stone-800 text-left">
                      {timeBlocks.length === 0 ? <div className="text-center py-10 text-stone-600 italic">No hay bloqueos activos.</div> : timeBlocks.map(block => (
                        <div key={block.id} className="bg-stone-950 border border-white/5 p-5 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                           <div>
                              <div className="flex items-center gap-2 mb-1"><h4 className="text-stone-200 font-bold text-sm">{block.title}</h4>{block.isRecurring && <Repeat size={12} className="text-rose-500"/>}</div>
                              <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">{block.date} • {block.startTime}-{block.endTime}</p>
                              {block.isRecurring && <p className="text-rose-600/60 text-[9px] font-black uppercase mt-1">{block.recurringType} ({block.repeatCount}x)</p>}
                           </div>
                           <button onClick={() => deleteDoc(doc(db, "businesses", CLIENT_ID, "timeBlocks", block.id!))} className="text-stone-800 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-stone-800 text-[10px] uppercase font-bold tracking-[0.4em] bg-stone-950 border-t border-white/5">
        Gestión Elías León • Allan Dev v2.0
      </footer>

      {/* MODAL HÍBRIDO (CRIAÇÃO E EDIÇÃO) */}
      <AdminBookingModal 
        isOpen={isAdminBookingOpen} 
        onClose={() => setIsAdminBookingOpen(false)} 
        services={dbServices} 
        initialData={selectedAppointment}
      />
    </div>
  );
};

export default AdminDashboard;