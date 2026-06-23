/**
 * useCloudSync — déclenche la synchro Dexie ↔ Supabase au login.
 *
 * Monté une fois au boot (cf. main.tsx). Observe `useAuth().user` :
 *  - user devient non-null (login) → on lance la sync UNE fois.
 *  - 1ère connexion (pas de flag) → push local → cloud + toast récap.
 *  - connexions suivantes → pull cloud → local (nouveau device).
 *  - user devient null (logout) → on réarme pour la prochaine session.
 *
 * Échec silencieux côté UX (console.error only) : la sync ne doit jamais
 * casser l'app. Si la migration échoue, le flag n'est pas écrit → retry
 * au prochain login.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/stores/authStore';
import {
  migrateLocalDataToCloud,
  pullCloudDataToLocal,
  hasCloudSyncBeenDone,
  totalSynced,
} from '@/lib/cloudSync';
import { useToast } from '@/hooks/useToast';

export function useCloudSync() {
  const user = useAuth((s) => s.user);
  const toast = useToast();
  // useToast() renvoie un objet neuf à chaque render → on le garde dans un
  // ref pour ne pas le mettre en dépendance de l'effet.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  // Garde anti-double-run (StrictMode monte 2× en dev + re-renders).
  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      syncedForUser.current = null;
      return;
    }
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;

    void (async () => {
      try {
        if (hasCloudSyncBeenDone(user.id)) {
          // Déjà migré → on récupère ce qui a pu changer sur un autre device.
          await pullCloudDataToLocal(user.id);
        } else {
          // 1ère sync : push tout le local vers le cloud.
          const result = await migrateLocalDataToCloud(user.id);
          if (totalSynced(result) > 0) {
            toastRef.current.success(
              `🎉 Tes données sont sauvegardées dans le cloud — ${result.sessionsCount} sessions, ${result.masteredCount} riffs maîtrisés.`,
              { duration: 5000 },
            );
          }
        }
      } catch (err) {
        // On réarme pour permettre un retry au prochain changement d'auth.
        syncedForUser.current = null;
        // eslint-disable-next-line no-console
        console.error('[CloudSync] échec sync:', err);
      }
    })();
  }, [user]);
}
