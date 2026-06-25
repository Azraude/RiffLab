/**
 * SettingsGroup — groupe de réglages style iOS : header gris CAPS + carte
 * arrondie qui wrappe les SettingsRow. Refonte Settings 2026-06-25.
 */
import type { ReactNode } from 'react';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-text-soft">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-2">
        {children}
      </div>
    </section>
  );
}
