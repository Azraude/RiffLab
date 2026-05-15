import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Music2, Grid3x3, Waves, Timer, Mic, Wrench, Ear } from 'lucide-react';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const TOOLS: Array<{ to: string; label: string; description: string; icon: React.ReactNode }> = [
  {
    to: '/tuner',
    label: 'Tuner',
    description: 'Accordage au micro avec détection de pitch',
    icon: <Mic size={20} />,
  },
  {
    to: '/metronome',
    label: 'Métronome',
    description: 'Garde le tempo, 40-220 BPM',
    icon: <Timer size={20} />,
  },
  {
    to: '/ear-training',
    label: 'Oreille',
    description: 'Devine intervalles, accords et progressions',
    icon: <Ear size={20} />,
  },
];

const toolPaths = TOOLS.map((t) => t.to);

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);

  const toolsActive = toolPaths.includes(location.pathname);

  const handleToolPick = (to: string) => {
    setToolsOpen(false);
    navigate(to);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5">
          {/* Home — flamme logo RiffLab. Animation flicker active toujours,
              opacity réduite quand inactif pour rester reconnaissable
              comme nav (le "tab actif" doit ressortir). */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
                isActive ? 'text-gold' : 'text-text-soft hover:text-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-60'
                  )}
                >
                  <RiffLabLogo size={20} />
                </span>
                <span>Home</span>
              </>
            )}
          </NavLink>

          <NavItem to="/songs" label="Sons" icon={<Music2 size={20} />} />
          <NavItem to="/chords" label="Accords" icon={<Grid3x3 size={20} />} />
          <NavItem to="/scales" label="Gammes" icon={<Waves size={20} />} />

          {/* Outils — bouton (pas NavLink) qui ouvre une sheet */}
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={toolsOpen}
            className={clsx(
              'flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
              toolsActive ? 'text-gold' : 'text-text-soft hover:text-text'
            )}
          >
            <Wrench size={20} />
            <span>Outils</span>
          </button>
        </div>
      </nav>

      <Dialog.Root open={toolsOpen} onOpenChange={setToolsOpen}>
        <AnimatePresence>
          {toolsOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild aria-describedby={undefined}>
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-surface shadow-2xl md:hidden"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                  drag="y"
                  dragConstraints={{ top: 0 }}
                  dragElastic={{ top: 0, bottom: 0.5 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 500) {
                      setToolsOpen(false);
                    }
                  }}
                >
                  <div className="flex justify-center pb-1 pt-3">
                    <span className="h-1.5 w-12 rounded-full bg-text-soft/40" />
                  </div>
                  <div className="px-5 pb-2">
                    <Dialog.Title className="display text-display-sm">Outils</Dialog.Title>
                    <Dialog.Description className="mt-0.5 text-sm text-text-muted">
                      Tes outils de pratique
                    </Dialog.Description>
                  </div>
                  <div className="px-3 pb-3 pt-2">
                    {TOOLS.map((tool) => {
                      const active = location.pathname === tool.to;
                      return (
                        <button
                          key={tool.to}
                          type="button"
                          onClick={() => handleToolPick(tool.to)}
                          className={clsx(
                            'flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors',
                            active
                              ? 'border-gold bg-gold/10'
                              : 'border-transparent hover:bg-surface-2'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                              active
                                ? 'border-gold-soft bg-gold/10 text-gold'
                                : 'border-border bg-surface-2 text-text-muted'
                            )}
                          >
                            {tool.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={clsx(
                                'block text-sm font-semibold',
                                active ? 'text-gold' : 'text-text'
                              )}
                            >
                              {tool.label}
                            </span>
                            <span className="block text-xs text-text-muted">
                              {tool.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
          isActive ? 'text-gold' : 'text-text-soft hover:text-text'
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
