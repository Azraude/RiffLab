/**
 * LoginModal — Radix Dialog avec magic link email + Google OAuth.
 *
 * États :
 * - 'idle' : form visible, prêt à submit
 * - 'sending' : Supabase appel en cours (spinner)
 * - 'sent' : email envoyé, prompt "vérifie ta boîte mail"
 * - 'error' : message d'erreur affiché, retry possible
 *
 * Le mode signup est identique au mode signin avec magic link : Supabase
 * crée le user si l'email n'existe pas. On affiche juste les deux tabs
 * pour clarifier l'intention côté UX.
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, X, Loader2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/stores/authStore';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const signInWithMagicLink = useAuth((s) => s.signInWithMagicLink);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>('');

  const reset = () => {
    setEmail('');
    setStatus('idle');
    setErrorMsg(null);
    setSentTo('');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset après l'animation de fermeture (200ms)
    window.setTimeout(reset, 250);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Renseigne ton email.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await signInWithMagicLink(trimmed);
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setSentTo(trimmed);
      setStatus('sent');
    }
  };

  const handleGoogle = async () => {
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    }
    // Si OK, le redirect OAuth prend le relais — pas besoin de gérer le success ici
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount aria-describedby={undefined} className="outline-none">
              {/* Mobile-first : bottom-sheet collé en bas (items-end) sur < sm,
                  modale centrée (sm:items-center) sur desktop. L'anim opacity+
                  scale+y reste subtile et fonctionne pour les deux positions. */}
              <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none sm:items-center sm:p-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 24 }}
                  transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                  className="pointer-events-auto max-h-[90vh] w-full overflow-y-auto overflow-x-hidden rounded-t-3xl border-t border-border-gold bg-bg shadow-gold-strong sm:max-w-md sm:rounded-2xl sm:border"
                >
                <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
                  {/* Poignée drag — affordance bottom-sheet (mobile uniquement) */}
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="eyebrow">RiffLab</div>
                      <Dialog.Title className="display mt-1 text-display-sm">
                        {tab === 'signin' ? 'Se connecter' : 'Créer un compte'}
                      </Dialog.Title>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Fermer"
                        className="-mr-1.5 -mt-1 flex h-11 w-11 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Tabs signin/signup */}
                  <div className="mt-4 inline-flex w-full rounded-xl border border-border bg-surface-2 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className={clsx(
                        'flex-1 rounded-lg px-3 py-2.5 font-semibold transition-colors',
                        tab === 'signin' ? 'bg-gold text-bg' : 'text-text-muted hover:text-text'
                      )}
                    >
                      Se connecter
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('signup')}
                      className={clsx(
                        'flex-1 rounded-lg px-3 py-2.5 font-semibold transition-colors',
                        tab === 'signup' ? 'bg-gold text-bg' : 'text-text-muted hover:text-text'
                      )}
                    >
                      Créer un compte
                    </button>
                  </div>

                  {status === 'sent' ? (
                    <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-4 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                        <CheckCircle2 size={26} />
                      </div>
                      <h3 className="display mt-3 text-display-sm text-success">
                        Mail envoyé !
                      </h3>
                      <p className="mt-2 text-sm text-text-muted">
                        Un lien magique vient d'être envoyé à{' '}
                        <strong className="font-mono text-text">{sentTo}</strong>.
                        Clique dessus depuis ta boîte mail pour te connecter.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStatus('idle')}
                        className="mt-4 text-xs text-gold hover:text-gold-bright"
                      >
                        Renvoyer le lien
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Form magic link */}
                      <form onSubmit={handleMagicLink} className="mt-5 space-y-3">
                        <div>
                          <label htmlFor="auth-email" className="label-small mb-1.5 block">
                            Email
                          </label>
                          <input
                            id="auth-email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (status === 'error') {
                                setStatus('idle');
                                setErrorMsg(null);
                              }
                            }}
                            placeholder="toi@exemple.com"
                            autoComplete="email"
                            autoFocus
                            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base focus:border-gold-soft focus:outline-none"
                          />
                        </div>
                        {errorMsg && status === 'error' && (
                          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                            {errorMsg}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={status === 'sending'}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold font-semibold text-bg shadow-gold transition-all hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          {status === 'sending' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Mail size={16} />
                          )}
                          {status === 'sending' ? 'Envoi…' : 'Recevoir un lien magique'}
                        </button>
                      </form>

                      {/* Séparateur */}
                      <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase tracking-wider text-text-soft">ou</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      {/* Google OAuth */}
                      <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={status === 'sending'}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-surface px-4 text-sm font-semibold text-text transition-all hover:bg-gold/5 disabled:opacity-60"
                      >
                        <GoogleIcon />
                        Continuer avec Google
                      </button>

                      <p className="mt-5 text-xs text-text-soft leading-relaxed">
                        Pas de mot de passe nécessaire — RiffLab utilise les liens magiques pour
                        plus de sécurité. À la première connexion, ton compte se crée automatiquement.
                      </p>
                    </>
                  )}
                </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Google "G" SVG inline — couleurs officielles brand Google. */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 11v3.2h4.5c-.2 1.2-1.4 3.5-4.5 3.5-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.7 3.2 1.2l2.2-2.1C15.9 5.5 14.1 4.7 12 4.7c-4 0-7.3 3.3-7.3 7.3s3.3 7.3 7.3 7.3c4.2 0 7-3 7-7.1 0-.5 0-.9-.1-1.2H12z"
      />
      <path
        fill="#34A853"
        d="M12 19.3c2 0 3.6-.7 4.8-1.8l-2.3-1.8c-.6.4-1.5.7-2.5.7-1.9 0-3.6-1.3-4.2-3l-2.3 1.8c1.2 2.4 3.7 4.1 6.5 4.1z"
      />
      <path
        fill="#FBBC05"
        d="M7.8 13.4c-.1-.4-.2-.9-.2-1.4s.1-1 .2-1.4l-2.3-1.8c-.5 1-.8 2.1-.8 3.2s.3 2.2.8 3.2l2.3-1.8z"
      />
      <path
        fill="#4285F4"
        d="M19 12c0-.5 0-.9-.1-1.2H12v3.2h4.5c-.2.9-.8 1.7-1.7 2.2l2.3 1.8c1.3-1.3 2-3.2 2-6z"
      />
    </svg>
  );
}
