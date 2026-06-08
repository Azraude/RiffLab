/**
 * FeedbackButton — bouton flottant 💬 monté dans Layout.
 *
 * Click → Sheet avec textarea + 3 chips type (bug / idée / autre)
 * + email optionnel + Envoyer.
 *
 * Stratégie d'envoi (à l'ordre) :
 *  1. Si VITE_DISCORD_FEEDBACK_WEBHOOK est set → POST Discord webhook.
 *     Format Discord : embed avec couleur selon type + champs structurés.
 *  2. Sinon → fallback `mailto:melvin.bruhat@gmail.com` avec sujet
 *     préformaté `[RiffLab Feedback]` et body markdown. Ouvre le client
 *     mail natif (mac Mail, Gmail, Outlook).
 *
 * On capture aussi automatiquement : page courante (location.pathname),
 * user agent (anonyme), locale, et l'heure. Permet de reproduire les
 * bugs sans devoir poser des questions.
 *
 * Position : bouton fixé bottom-right, au-dessus du MobileNav 72px
 * (calc safe-area + 88px).
 */
import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Bug, Lightbulb, Mic, Send, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet } from '@/components/ui/Sheet';

const WEBHOOK_URL = import.meta.env.VITE_DISCORD_FEEDBACK_WEBHOOK as string | undefined;
const FALLBACK_EMAIL = 'melvin.bruhat@gmail.com';

type FeedbackType = 'bug' | 'idea' | 'other';

const TYPES: { id: FeedbackType; label: string; emoji: string; color: number; Icon: typeof Bug }[] = [
  { id: 'bug', label: 'Bug', emoji: '🐛', color: 0xd4685e, Icon: Bug },
  { id: 'idea', label: 'Idée', emoji: '💡', color: 0xf5d97a, Icon: Lightbulb },
  { id: 'other', label: 'Autre', emoji: '💬', color: 0x9a8454, Icon: Mic },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<'success' | 'fallback' | 'error' | null>(null);
  const location = useLocation();

  const reset = () => {
    setType('idea');
    setMessage('');
    setEmail('');
    setSent(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setSent(null);

    const typeMeta = TYPES.find((t) => t.id === type)!;
    const page = location.pathname;
    const userAgent = navigator.userAgent;
    const locale = navigator.language;
    const timestamp = new Date().toISOString();

    if (WEBHOOK_URL) {
      try {
        const payload = {
          embeds: [
            {
              title: `${typeMeta.emoji} Nouveau feedback ${typeMeta.label}`,
              color: typeMeta.color,
              description: message.trim(),
              fields: [
                { name: 'Page', value: `\`${page}\``, inline: true },
                { name: 'Email', value: email.trim() || '_anonyme_', inline: true },
                { name: 'Locale', value: locale, inline: true },
                { name: 'User-Agent', value: `\`\`\`${userAgent.slice(0, 200)}\`\`\`` },
              ],
              timestamp,
              footer: { text: 'RiffLab feedback' },
            },
          ],
        };
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSent('success');
        setMessage('');
        window.setTimeout(() => {
          setOpen(false);
          reset();
        }, 1500);
      } catch (err) {
        console.error('[feedback] webhook fail', err);
        // Fallback mailto si webhook fail
        openMailto({ type: typeMeta.label, message, email, page, userAgent });
        setSent('fallback');
      }
    } else {
      // Pas de webhook configuré → mailto direct
      openMailto({ type: typeMeta.label, message, email, page, userAgent });
      setSent('fallback');
    }
    setSending(false);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Donner mon avis"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 320, damping: 24 }}
        className="group fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-surface text-gold shadow-lg backdrop-blur-md hover:border-gold hover:bg-gold/10 md:right-6 md:h-14 md:w-14"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
        }}
      >
        <MessageCircle size={20} className="md:hidden" strokeWidth={2} />
        <MessageCircle size={22} className="hidden md:block" strokeWidth={2} />
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text shadow-lg opacity-0 transition-opacity group-hover:opacity-100 md:block">
          Donne ton avis
        </span>
      </motion.button>

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
        title="💬 Ton avis"
        description="Bug, idée, troll, suggestion… tout passe. Anonyme par défaut."
      >
        {sent === 'success' ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">
              ✓
            </div>
            <h3 className="display mt-4 text-display-sm">Merci !</h3>
            <p className="mt-2 text-sm text-text-muted">
              On a bien reçu ton message. Tu auras une réponse si tu as laissé un email.
            </p>
          </div>
        ) : sent === 'fallback' ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl">
              ✉️
            </div>
            <h3 className="display mt-4 text-display-sm">Ton client mail s'ouvre</h3>
            <p className="mt-2 text-sm text-text-muted">
              Vérifie qu'il s'est bien lancé, sinon écris directement à{' '}
              <a href={`mailto:${FALLBACK_EMAIL}`} className="text-gold underline">
                {FALLBACK_EMAIL}
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-border px-5 text-sm hover:bg-surface-2"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type chips */}
            <div>
              <label className="label-small mb-2 block">Type</label>
              <div className="flex gap-2">
                {TYPES.map((t) => {
                  const active = t.id === type;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors ${
                        active
                          ? 'border-gold bg-gold/15 text-text'
                          : 'border-border bg-surface text-text-muted hover:border-gold-soft'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="feedback-msg" className="label-small mb-1.5 block">
                Ton message
              </label>
              <textarea
                id="feedback-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Décris ce qui s\'est passé, ce que tu t\'attendais à voir, et sur quel device si tu sais.'
                    : type === 'idea'
                      ? 'Balance ton idée, même mal formulée. C\'est moi qui mettrai au propre.'
                      : 'Dis-moi ce qui te passe par la tête.'
                }
                rows={5}
                maxLength={1500}
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-text-soft">
                {message.length}/1500
              </div>
            </div>

            {/* Email optional */}
            <div>
              <label htmlFor="feedback-email" className="label-small mb-1.5 block">
                Email <span className="ml-1 text-text-soft">(optionnel — pour avoir une réponse)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@example.com"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              />
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-soft">
                Anonyme par défaut · {WEBHOOK_URL ? 'envoi instantané' : 'ouvre ton mail'}
              </span>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright disabled:opacity-60"
              >
                {sending ? (
                  'Envoi…'
                ) : WEBHOOK_URL ? (
                  <>
                    <Send size={14} /> Envoyer
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} /> Ouvrir mon mail
                  </>
                )}
              </button>
            </div>

            {sent === 'error' && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                Échec d'envoi. Réessaie ou écris à{' '}
                <a href={`mailto:${FALLBACK_EMAIL}`} className="underline">
                  {FALLBACK_EMAIL}
                </a>
                .
              </div>
            )}
          </form>
        )}
      </Sheet>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function openMailto({
  type,
  message,
  email,
  page,
  userAgent,
}: {
  type: string;
  message: string;
  email: string;
  page: string;
  userAgent: string;
}) {
  const subject = encodeURIComponent(`[RiffLab Feedback] ${type}`);
  const body = encodeURIComponent(
    [
      `Type : ${type}`,
      `Page : ${page}`,
      `Email (si réponse souhaitée) : ${email || '_anonyme_'}`,
      `User-Agent : ${userAgent}`,
      '',
      '— Message —',
      message,
    ].join('\n'),
  );
  window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
}
