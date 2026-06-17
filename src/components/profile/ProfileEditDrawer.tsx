/**
 * ProfileEditDrawer — Sheet d'édition du profil (sess PROFIL).
 *
 * Champs : display_name, bio (compteur), instruments multi-chips,
 * 4 liens externes (Insta/YT/SC/site), cover picker (5 defaults +
 * upload custom), avatar upload existant via Profile.tsx legacy.
 *
 * Validation client : URLs regex via `validateProfileUrl`. On envoie
 * un patch partiel à `updateProfileExtended` (champs non touchés
 * laissés intacts côté DB).
 */
import { useEffect, useState } from 'react';
import { Save, Upload, Image as ImageIcon, Check } from 'lucide-react';
import clsx from 'clsx';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/hooks/useToast';
import {
  DEFAULT_COVERS,
  INSTRUMENTS,
  resolveCoverUrl,
  updateProfileExtended,
  uploadCover,
  validateProfileUrl,
  type ProfilePatch,
} from '@/lib/profileApi';
import type { FullProfile } from './ProfileHero';

interface ProfileEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: FullProfile;
  onSaved: (next: FullProfile) => void;
}

export function ProfileEditDrawer({
  open,
  onOpenChange,
  profile,
  onSaved,
}: ProfileEditDrawerProps) {
  const toast = useToast();

  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [instruments, setInstruments] = useState<string[]>(profile.instruments ?? []);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_url ?? null);
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtube_url ?? '');
  const [soundcloudUrl, setSoundcloudUrl] = useState(profile.soundcloud_url ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Resync depuis le profile quand on rouvre le drawer
  useEffect(() => {
    if (open) {
      setDisplayName(profile.display_name ?? '');
      setBio(profile.bio ?? '');
      setInstruments(profile.instruments ?? []);
      setCoverUrl(profile.cover_url ?? null);
      setInstagramUrl(profile.instagram_url ?? '');
      setYoutubeUrl(profile.youtube_url ?? '');
      setSoundcloudUrl(profile.soundcloud_url ?? '');
      setWebsiteUrl(profile.website_url ?? '');
    }
  }, [open, profile]);

  const toggleInstrument = (id: string) => {
    setInstruments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const { data, error } = await uploadCover(profile.id, file);
    setUploadingCover(false);
    if (error || !data) {
      toast.error(error?.message ?? 'Upload échoué');
      return;
    }
    setCoverUrl(data);
    toast.success('Cover uploadée');
  };

  const handleSave = async () => {
    // Validation client
    const errors = [
      validateProfileUrl(instagramUrl, 'Instagram'),
      validateProfileUrl(youtubeUrl, 'YouTube'),
      validateProfileUrl(soundcloudUrl, 'SoundCloud'),
      validateProfileUrl(websiteUrl, 'Site web'),
    ].filter(Boolean);
    if (errors.length > 0) {
      toast.error(errors[0]!);
      return;
    }
    if (bio.length > 280) {
      toast.error('Bio trop longue (max 280)');
      return;
    }

    const patch: ProfilePatch = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      cover_url: coverUrl,
      instagram_url: instagramUrl.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      soundcloud_url: soundcloudUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      instruments,
    };

    setSaving(true);
    const { error } = await updateProfileExtended(profile.id, patch);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Profil mis à jour');
    onSaved({ ...profile, ...patch });
    onOpenChange(false);
  };

  const bioLength = bio.length;
  const bioOverflow = bioLength > 280;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier mon profil"
      description="Cover, bio, instruments, liens externes."
    >
      <div className="space-y-5 pb-2">
        {/* ─── Cover picker ─── */}
        <div>
          <div className="label-small mb-2 flex items-center gap-1.5">
            <ImageIcon size={11} /> Cover photo
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DEFAULT_COVERS.map((c) => {
              const selected =
                (coverUrl ?? '') === c.path ||
                (coverUrl == null && c.path === DEFAULT_COVERS[0].path);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCoverUrl(c.path)}
                  aria-pressed={selected}
                  aria-label={`Cover ${c.label}`}
                  className={clsx(
                    'relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all active:scale-95',
                    selected ? 'border-gold shadow-gold' : 'border-border hover:border-gold-soft',
                  )}
                >
                  <img
                    src={c.path}
                    alt={c.label}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {selected && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-bg">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
            {/* Upload custom */}
            <label
              className={clsx(
                'flex h-16 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-border text-text-soft transition-colors hover:border-gold-soft hover:text-gold',
                uploadingCover && 'pointer-events-none opacity-50',
              )}
            >
              <Upload size={14} />
              <span className="text-[9px]">{uploadingCover ? 'Upload…' : 'Custom'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingCover}
                onChange={(e) => void handleCoverUpload(e)}
              />
            </label>
          </div>
          {/* Preview de la cover sélectionnée */}
          <div className="mt-2 h-16 w-full overflow-hidden rounded-lg border border-border bg-surface-2">
            <img
              src={resolveCoverUrl(coverUrl)}
              alt="Aperçu cover"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* ─── Display name ─── */}
        <div>
          <label htmlFor="pe-display" className="label-small mb-1.5 block">
            Nom affiché
          </label>
          <input
            id="pe-display"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ex: Melvin G."
            maxLength={60}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
          />
        </div>

        {/* ─── Bio ─── */}
        <div>
          <label htmlFor="pe-bio" className="label-small mb-1.5 block">
            Bio
          </label>
          <textarea
            id="pe-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Genre, niveau, ce que tu travailles…"
            rows={3}
            maxLength={400}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
          />
          <div
            className={clsx(
              'mt-1 text-right text-[10px]',
              bioOverflow ? 'text-danger' : 'text-text-soft',
            )}
          >
            {bioLength}/280
          </div>
        </div>

        {/* ─── Instruments ─── */}
        <div>
          <div className="label-small mb-2">Instruments</div>
          <div className="flex flex-wrap gap-1.5">
            {INSTRUMENTS.map((i) => {
              const active = instruments.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggleInstrument(i.id)}
                  aria-pressed={active}
                  className={clsx(
                    'inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors active:scale-95',
                    active
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
                  )}
                >
                  <span aria-hidden>{i.emoji}</span>
                  {i.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Liens externes ─── */}
        <div className="space-y-2">
          <div className="label-small">Liens externes</div>
          <UrlField label="Instagram" value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/..." />
          <UrlField label="YouTube" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@..." />
          <UrlField label="SoundCloud" value={soundcloudUrl} onChange={setSoundcloudUrl} placeholder="https://soundcloud.com/..." />
          <UrlField label="Site web" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://..." />
        </div>

        {/* ─── Save ─── */}
        <div className="sticky bottom-0 -mx-5 -mb-2 flex items-center justify-end gap-2 border-t border-border bg-bg/95 px-5 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm text-text-muted hover:border-gold-soft hover:text-text"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || bioOverflow}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function UrlField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-soft">
        {label}
      </span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="url"
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
      />
    </label>
  );
}
