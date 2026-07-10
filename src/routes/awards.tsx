import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { HallOfFameCard } from '@/components/HallOfFameCard';
import { GoldenRibbonsBackground } from '@/components/GoldenRibbonsBackground';
import { getPublicSettings, type Award } from '@/api/admin/settings';

export const Route = createFileRoute('/awards')({
  component: HallOfFame,
});

function HallOfFame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSettings().then((res) => {
      // Only show published awards, and sort by order
      const published = (res.awards || [])
        .filter((a) => a.revealed)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAwards(published);
    }).catch(() => {
      setAwards([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Preload next/prev images to ensure smooth reveal
  useEffect(() => {
    if (awards.length === 0) return;
    const imagesToPreload = [
      awards[currentIndex]?.posterSrc,
      awards[currentIndex + 1]?.posterSrc,
      awards[currentIndex - 1]?.posterSrc,
    ].filter(Boolean);

    imagesToPreload.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [currentIndex, awards]);

  const handleNext = () => {
    if (currentIndex < awards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-gold">
        <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <GoldenRibbonsBackground />
        
        {/* Soft radial gold glow behind active card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Decorative corner ornaments */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-gold/20 opacity-50 m-8 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-gold/20 opacity-50 m-8 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-gold/20 opacity-50 m-8 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-gold/20 opacity-50 m-8 rounded-br-3xl" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 pb-24">
        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center mt-16 sm:mt-8">
          <h1 className="font-display text-4xl sm:text-6xl text-gradient-gold mb-4 tracking-widest uppercase animate-rise-in">
            Hall of Fame
          </h1>
          <p className="text-gold/60 tracking-widest text-xs sm:text-sm uppercase font-medium max-w-md animate-rise-in" style={{ animationDelay: '100ms' }}>
            Every card hides a champion. Click to reveal.
          </p>
        </div>

        {/* Card Display Area */}
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {awards.length === 0 ? (
            <div className="flex flex-col items-center text-gold/50 animate-fade-in">
              <Trophy className="w-12 h-12 mb-4 opacity-50" />
              <p className="tracking-widest uppercase text-sm">No awards have been revealed yet</p>
            </div>
          ) : (
            <HallOfFameCard 
              key={awards[currentIndex].id} 
              entry={awards[currentIndex]} 
              isActive={true} 
            />
          )}
        </div>

        {/* Navigation Controls */}
        {awards.length > 0 && (
          <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8 px-6 pointer-events-none">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`pointer-events-auto p-4 rounded-full glass hover:bg-gold/10 hover:border-gold/40 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent ${currentIndex === 0 ? 'cursor-not-allowed' : 'cursor-pointer'} text-gold`}
              aria-label="Previous Award"
            >
              <ChevronLeft size={24} />
            </button>
            
            {/* Pagination Indicators */}
            <div className="flex gap-2 pointer-events-auto items-center">
              {awards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-500 rounded-full ${
                    idx === currentIndex 
                      ? 'w-8 h-2 bg-gold shadow-[0_0_10px_rgba(218,165,32,0.8)]' 
                      : 'w-2 h-2 bg-gold/30 hover:bg-gold/60'
                  }`}
                  aria-label={`Go to award ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === awards.length - 1}
              className={`pointer-events-auto p-4 rounded-full glass hover:bg-gold/10 hover:border-gold/40 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent ${currentIndex === awards.length - 1 ? 'cursor-not-allowed' : 'cursor-pointer'} text-gold`}
              aria-label="Next Award"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
