import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { HallOfFameCard } from '@/components/HallOfFameCard';
import { LightRaysBackground } from '@/components/LightRaysBackground';
import { getPublicSettings, type Award } from '@/api/admin/settings';

export const Route = createFileRoute('/awards')({
  component: HallOfFame,
});

function HallOfFame() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSettings().then((res) => {
      console.log('[Awards] API response:', res);
      console.log('[Awards] awards array:', res.awards);
      // Show all awards that have been saved (sorted by order)
      const allAwards = (res.awards || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Temporarily clear test records as requested
      const clearedAwards = allAwards.filter(a => 
        !a.awardTitle.includes('0022') && 
        !a.awardTitle.includes('DFGH') && 
        !a.winnerName.toLowerCase().includes('test')
      );
      
      console.log('[Awards] filtered awards:', clearedAwards);
      setAwards(clearedAwards);
    }).catch((err) => {
      console.error('[Awards] Failed to load:', err);
      setAwards([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090909] text-gold">
        <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#090909] text-foreground overflow-hidden selection:bg-gold/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LightRaysBackground />
        
        {/* Subtle ambient particles can be represented with a repeating grain or noise if needed */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        
        {/* Soft central glow */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-6 sm:px-12 py-24 pb-32">
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center max-w-2xl mx-auto w-full">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gold/5 border border-gold/10 mb-6 animate-rise-in" style={{ animationDelay: '0ms' }}>
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gradient-gold mb-6 tracking-widest uppercase animate-rise-in" style={{ animationDelay: '100ms' }}>
            Hall of Fame
          </h1>
          <p className="text-white/60 tracking-wider text-sm sm:text-base font-light max-w-lg leading-relaxed animate-rise-in" style={{ animationDelay: '200ms' }}>
            A premium collection honoring outstanding achievements and extraordinary talent.
          </p>
        </div>

        {/* Interactive Grid */}
        {awards.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gold/40 animate-rise-in" style={{ animationDelay: '300ms' }}>
            <p className="tracking-widest uppercase text-sm font-medium border border-gold/20 px-6 py-3 rounded-full bg-gold/5">
              The collection is currently empty
            </p>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 justify-items-center">
            {awards.map((award, index) => (
              <div 
                key={award.id} 
                className="animate-rise-in w-full flex justify-center"
                style={{ 
                  animationDelay: `${300 + (index * 80)}ms`,
                  animationFillMode: 'forwards' 
                }}
              >
                <HallOfFameCard entry={award} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
