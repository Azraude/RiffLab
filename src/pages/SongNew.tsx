import { useNavigate } from 'react-router-dom';
import { Sheet } from '@/components/ui/Sheet';
import { SongForm } from '@/components/songs/SongForm';
import { Songs } from './Songs';

/**
 * Route /songs/new — pattern "modal route".
 *
 * Rend la page Songs en arrière-plan (le user voit sa bibliothèque) ET
 * le Sheet (modal centré desktop / bottom sheet mobile) avec le SongForm.
 *
 * Close du modal (X, ESC, clic backdrop, drag bas) → navigate vers /songs.
 * Save réussi → navigate vers /songs/:id du nouveau song.
 */
export function SongNew() {
  const navigate = useNavigate();
  const close = () => navigate('/songs');

  return (
    <>
      <Songs />
      <Sheet
        open
        onOpenChange={(o) => {
          if (!o) close();
        }}
        title="Nouveau son"
        description="Ajoute un morceau à ta bibliothèque."
      >
        <SongForm
          onSaved={(id) => navigate(`/songs/${id}`)}
          onCancel={close}
        />
      </Sheet>
    </>
  );
}
