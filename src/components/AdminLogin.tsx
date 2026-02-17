import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, X, Loader2, Scissors } from 'lucide-react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-stone-900 border border-rose-900/30 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-900/40">
            <Scissors size={32} />
          </div>
          <h2 className="text-2xl font-serif text-white font-bold">Acceso de Gestión</h2>
          <p className="text-stone-500 text-sm mt-2 font-light">Peluquería Elías León</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
              <input 
                type="email" 
                placeholder="Email de administrador"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-rose-500/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-rose-500/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-900/20 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Entrar en el Panel"}
          </button>
        </form>

        <p className="text-center text-stone-600 text-[10px] mt-8 uppercase tracking-widest">
          Sistema de Gestión Allan Dev
        </p>
      </div>
    </div>
  );
};

export default AdminLogin; 