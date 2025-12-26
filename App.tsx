import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import PendulumEffect from './PendulumEffect';
import ChristmasTreeEffect from './ChristmasTreeEffect';
import SyntaxFreedomEffect from './SyntaxFreedomEffect';
import EntropyEffect from './EntropyEffect';
import GravityEffect from './GravityEffect';
import RippleEffect from './RippleEffect';
import SporeEffect from './SporeEffect';
import ChasmEffect from './ChasmEffect';
import ThreadEffect from './ThreadEffect';
import NeonEffect from './NeonEffect';
import GalaxyEffect from './GalaxyEffect';
import EclipseEffect from './EclipseEffect';
import VelocityEffect from './VelocityEffect';
import BloomEffect from './BloomEffect';
import NoirEffect from './NoirEffect';

type Page = 'pendulum' | 'tree' | 'syntax' | 'entropy' | 'gravity' | 'ripple' | 'spore' | 'chasm' | 'thread' | 'neon' | 'galaxy' | 'eclipse' | 'velocity' | 'bloom' | 'noir';

const PAGES: { id: Page; label: string; desc: string }[] = [
  { id: 'bloom', label: 'BLOOM', desc: 'Floral growth' },
  { id: 'noir', label: 'NOIR', desc: 'Smoky cinema' },
  { id: 'pendulum', label: 'IMPRESSION', desc: 'Time erases memory' },
  { id: 'tree', label: 'CHRISTMAS', desc: 'Festive structure' },
  { id: 'syntax', label: 'SYNTAX', desc: 'Freedom of lines' },
  { id: 'entropy', label: 'ENTROPY', desc: 'Order to chaos' },
  { id: 'gravity', label: 'GRAVITY', desc: 'Weight of words' },
  { id: 'ripple', label: 'RIPPLE', desc: 'Reflection in water' },
  { id: 'spore', label: 'SPORE', desc: 'Organic growth' },
  { id: 'chasm', label: 'CHASM', desc: 'Infinite abyss' },
  { id: 'thread', label: 'THREAD', desc: 'Invisible connections' },
  { id: 'neon', label: 'NEON', desc: 'Cyberpunk rain' },
  { id: 'galaxy', label: 'GALAXY', desc: 'Stardust cosmos' },
  { id: 'eclipse', label: 'ECLIPSE', desc: 'Shadow & Light' },
  { id: 'velocity', label: 'VELOCITY', desc: 'Warp speed' },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('bloom');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dark mode detection based on current page
  const isDarkMode = ['neon', 'galaxy', 'chasm', 'eclipse', 'velocity', 'noir'].includes(currentPage);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-1000 ${
      currentPage === 'neon' || currentPage === 'velocity' ? 'bg-[#05050a]' : 
      (currentPage === 'galaxy' || currentPage === 'eclipse' || currentPage === 'noir' ? 'bg-[#080808]' : 
      (currentPage === 'chasm' ? 'bg-[#111]' : 
      (currentPage === 'bloom' ? 'bg-[#fdfbf7]' : 'bg-[#f5f5f5]')))
    }`}>
      
      {/* Menu Toggle Button */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className={`absolute top-6 right-6 z-50 p-2 rounded-full transition-all duration-300 ${
          isMenuOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        } ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'}`}
      >
        <Menu size={24} />
      </button>

      {/* Full Screen Overlay Menu */}
      <div 
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
        >
          <X size={32} />
        </button>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl w-full">
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 border ${
                  currentPage === page.id 
                    ? 'bg-white text-black border-white scale-105 shadow-xl' 
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="relative z-10">
                  <h3 className="text-xl font-serif font-bold tracking-wider mb-2">{page.label}</h3>
                  <p className={`text-xs uppercase tracking-widest ${currentPage === page.id ? 'text-gray-500' : 'text-gray-400'}`}>
                    {page.desc}
                  </p>
                </div>
                {/* Decoration */}
                <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl transition-opacity duration-500 ${
                  currentPage === page.id ? 'bg-indigo-500/20' : 'bg-blue-500/0 group-hover:bg-blue-500/20'
                }`} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 text-center text-white/20 text-xs tracking-[0.3em] font-serif">
          TIME IMPRESSION COLLECTION
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full h-full">
        {currentPage === 'pendulum' && <PendulumEffect />}
        {currentPage === 'tree' && <ChristmasTreeEffect />}
        {currentPage === 'syntax' && <SyntaxFreedomEffect />}
        {currentPage === 'entropy' && <EntropyEffect />}
        {currentPage === 'gravity' && <GravityEffect />}
        {currentPage === 'ripple' && <RippleEffect />}
        {currentPage === 'spore' && <SporeEffect />}
        {currentPage === 'chasm' && <ChasmEffect />}
        {currentPage === 'thread' && <ThreadEffect />}
        {currentPage === 'neon' && <NeonEffect />}
        {currentPage === 'galaxy' && <GalaxyEffect />}
        {currentPage === 'eclipse' && <EclipseEffect />}
        {currentPage === 'velocity' && <VelocityEffect />}
        {currentPage === 'bloom' && <BloomEffect />}
        {currentPage === 'noir' && <NoirEffect />}
      </div>

      {/* Minimal Footer (Hidden when menu open) */}
      {!isMenuOpen && (
        <div className={`absolute bottom-6 left-6 text-xs font-serif pointer-events-none transition-colors duration-1000 ${
          isDarkMode ? 'text-white/20' : 'text-black/20'
        }`}>
           {PAGES.find(p => p.id === currentPage)?.label}
        </div>
      )}
    </div>
  );
};

export default App;