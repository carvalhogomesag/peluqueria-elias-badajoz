import React, { useState, useEffect } from 'react';
import { Scissors, Menu, X, Phone } from 'lucide-react';
import { BUSINESS_INFO } from '../constants';

// Definimos a interface para receber a função que abre o login
interface NavbarProps {
  onAdminClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- LÓGICA DO CLIQUE SECRETO (EASTER EGG) ---
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    
    // Resetar o contador se o utilizador demorar mais de 2 segundos entre cliques
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    if (clickCount + 1 === 5) {
      clearTimeout(timer);
      onAdminClick(); // Dispara a abertura do modal de login
      setClickCount(0);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Servicios', href: '#servicos' },
    { name: 'Sobre Elías', href: '#sobre' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/95 backdrop-blur-md py-4 shadow-xl border-b border-rose-900/20' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        
        {/* LOGO PELUQUERÍA ELÍAS COM ACESSO SECRETO */}
        <div 
          className="flex items-center gap-2 group cursor-pointer select-none" 
          onClick={handleLogoClick}
          title="Peluquería Elías León"
        >
          <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-lg shadow-rose-900/40">
            <Scissors size={24} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-white leading-none uppercase">Elías</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-rose-500 font-bold">Peluquería León</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-stone-300 hover:text-rose-500 transition-colors uppercase tracking-wider"
            >
              {link.name}
            </a>
          ))}
          <a 
            href={BUSINESS_INFO.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-900/20 uppercase tracking-wide flex items-center gap-2"
          >
            <Phone size={16} />
            Llamar Ahora
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-stone-900 border-t border-rose-900/20 animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-lg font-medium text-stone-100 hover:text-rose-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a 
              href={BUSINESS_INFO.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose-600 text-white text-center py-4 rounded-xl font-bold mt-2 shadow-lg uppercase"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reservar Cita
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;