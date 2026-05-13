import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <Sidebar />
        <main className="relative pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto max-w-[1400px] px-5 py-7 md:px-12 md:py-9">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
