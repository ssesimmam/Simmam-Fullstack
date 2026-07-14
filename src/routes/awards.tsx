import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GalleryCard, type GalleryEntry } from '@/components/GalleryCard';
import { LightRaysBackground } from '@/components/LightRaysBackground';

export const Route = createFileRoute('/awards')({
  component: Gallery,
});

function Gallery() {
  const [items, setItems] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      // Automatically find all webp files in the public/reveal folder using Vite's glob import
      const images = import.meta.glob('/public/reveal/*.webp');
      
      const loadedItems = Object.keys(images).map((key, index) => {
        // key will be like '/public/reveal/7.webp'
        // we need to convert it to the public URL path '/reveal/7.webp'
        return {
          id: index + 1,
          image: key.replace('/public', '')
        };
      });
      
      setItems(loadedItems);
    } catch (err) {
      console.error('[Gallery] Failed to load:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
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
          {/* Glowing Icon Badge */}
          <div className="relative inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-b from-gold/10 to-transparent border border-gold/20 mb-6 shadow-[0_0_30px_rgba(218,165,32,0.15)] animate-rise-in backdrop-blur-sm" style={{ animationDelay: '0ms' }}>
            <div className="absolute inset-0 rounded-full border border-gold/20 animate-[pulse_3s_ease-in-out_infinite] opacity-30" />
            <Sparkles className="w-6 h-6 text-gold drop-shadow-[0_0_10px_rgba(218,165,32,0.5)]" />
          </div>
          
          {/* Majestic Title with Flankers */}
          <div className="flex items-center gap-4 mb-6 animate-rise-in" style={{ animationDelay: '100ms' }}>
            <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-gold/40" />
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gradient-gold tracking-widest uppercase drop-shadow-[0_2px_15px_rgba(218,165,32,0.3)]">
              Awards
            </h1>
            <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
          
          {/* Elegant Subtitle */}
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-white/60 via-gold/70 to-white/60 tracking-wider uppercase text-xs sm:text-sm font-medium max-w-lg leading-relaxed animate-rise-in" style={{ animationDelay: '200ms' }}>
            A premium collection of memorable moments
          </p>
        </div>

        {/* Interactive Grid */}
        {error || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gold/40 animate-rise-in" style={{ animationDelay: '300ms' }}>
            <p className="tracking-widest uppercase text-sm font-medium border border-gold/20 px-6 py-3 rounded-full bg-gold/5">
              The gallery is currently empty
            </p>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 justify-items-center">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={`animate-rise-in w-full flex justify-center ${
                  index === items.length - 1 && items.length % 3 === 1 ? 'lg:col-start-2' : ''
                } ${
                  index === items.length - 1 && items.length % 2 === 1 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
                style={{ 
                  animationDelay: `${300 + (index * 80)}ms`,
                  animationFillMode: 'forwards' 
                }}
              >
                <GalleryCard entry={item} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
