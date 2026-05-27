/**
 * /profile — placeholder Phase 5.1.
 *
 * Affiche les infos de base du user connecté (email, date inscription)
 * + form édit username/bio (persisté dans la table `profiles` Supabase
 * via le trigger handle_new_user au signup).
 *
 * La vraie page profil avec avatar upload + stats publiques sera Phase 5.3
 * quand le sync Dexie↔Postgres sera livré.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { LogOut, Save, User as UserIcon, Mail, Calendar, Shield } from 'lucide-react';

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  tier: 'free' | 'pro';
  language: string | null;
  created_at: string;
};

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Redirect Landing si pas loggé (une fois le bootstrap résolu)
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  // Fetch le profile row à l'arrivée
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, bio, tier, language, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        return;
      }
      if (data) {
        setProfile(data as ProfileRow);
        setUsername(data.username ?? '');
        setBio(data.bio ?? '');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setFetchError(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setFetchError(error.message);
    } else {
      setSavedAt(Date.now());
      window.setTimeout(() => setSavedAt(null), 2500);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  const createdLabel = profile?.created_at
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(profile.created_at))
    : '—';

  return (
    <>
      <PageHeader
        title="Mon profil"
        subtitle="Tes infos de compte. La sync de tes données (sons, sessions, stats) arrive en Phase 5.2."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {/* Avatar + identité */}
        <Card className="md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-mono text-3xl font-bold text-gold">
              {(user.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <Mail size={13} />
              <span className="font-mono break-all">{user.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-text-soft">
              <Calendar size={11} />
              Inscrit le {createdLabel}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              <Shield size={10} />
              Tier {profile?.tier ?? 'free'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </Card>

        {/* Form édit */}
        <Card className="md:col-span-2">
          <h3 className="display text-display-sm">Édite ton profil</h3>
          <p className="mt-1 text-sm text-text-muted">
            Ces infos seront utilisées pour ton profil public guitariste (Phase 5.3).
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-username" className="label-small mb-1.5 flex items-center gap-1.5">
                <UserIcon size={11} /> Pseudo
              </label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: melvinguitar"
                maxLength={40}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="profile-bio" className="label-small mb-1.5">
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Genre musical, niveau, ce que tu travailles en ce moment…"
                maxLength={280}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-text-soft">
                {bio.length}/280
              </div>
            </div>

            {fetchError && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {fetchError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {savedAt && (
                <span className="text-xs text-success">✓ Sauvegardé</span>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
