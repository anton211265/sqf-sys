import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  History,
  Home as HomeIcon,
  Package,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { setAccessToken } from 'api/axiosClient';
import { Button } from 'components/ui/button';
import { ADMIN, AUTH, CONFIG, HOME } from 'constants/routes';
import { useManifest } from 'hooks/useRbac';
import { cn } from 'lib/utils';
import { RootState } from 'redux/store';
import { setData } from 'redux/user';
import { DirtyGuardProvider, useDirtyGuard } from './dirty-guard';

/**
 * Manifest-driven navigation shell (dashboard design principles in
 * CLAUDE.md): items render only when the caller holds their gate key —
 * nothing greyed out, no forbidden errors, no role checks. Route ↔ key
 * mapping lives here until the manifest itself carries the navigation
 * structure (open design item).
 */
interface NavItem {
  label: string;
  route: string;
  gateKey: string | null;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_SECTIONS: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ label: 'Home', route: HOME, gateKey: null, icon: HomeIcon }],
  },
  {
    title: 'Security & Access',
    items: [
      { label: 'Role Builder', route: ADMIN.ROLES, gateKey: 'admin_roles_manage', icon: ShieldCheck },
      { label: 'User Directory', route: ADMIN.USERS, gateKey: 'admin_users_view', icon: Users },
      { label: 'Audit Ledger', route: ADMIN.AUDIT, gateKey: 'admin_audit_view', icon: ScrollText },
    ],
  },
  {
    title: 'Product Configuration',
    items: [
      { label: 'Products', route: CONFIG.PRODUCTS, gateKey: 'config_products_view', icon: Package },
      { label: 'Legal Templates', route: CONFIG.TEMPLATES, gateKey: 'config_products_view', icon: FileText },
      { label: 'Config Audit', route: CONFIG.AUDIT, gateKey: 'config_products_view', icon: History },
    ],
  },
];

const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user?.data);
  const { confirmIfDirty } = useDirtyGuard();
  const { data: manifest, isLoading } = useManifest();

  const holds = (key: string | null) =>
    key === null ||
    manifest?.user?.isSuperAdmin === true ||
    (manifest?.permissions ?? []).includes(key);

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => holds(item.gateKey)),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () =>
    confirmIfDirty(() => {
      setAccessToken(null);
      dispatch(setData({ data: null }));
      navigate(AUTH.LOGIN);
    });

  // Deep-linking a route whose gate key isn't held: silently land Home —
  // "features that are not permitted do not appear", never a 403 screen.
  const current = NAV_ITEMS.find((item) => item.route === location.pathname);
  if (!isLoading && manifest && current && !holds(current.gateKey)) {
    return <Navigate to={HOME} replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#0F172A] text-slate-200">
        <div className="px-5 py-6">
          <div className="text-xl font-semibold text-white">SQF</div>
          <div className="text-xs text-slate-400">Funder Administration</div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3">
          {visibleSections.map((section) => (
            <div key={section.title ?? 'root'} className="space-y-1">
              {section.title && (
                <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = location.pathname.startsWith(item.route) &&
                  (item.route !== HOME || location.pathname === HOME);
                const Icon = item.icon;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => confirmIfDirty(() => navigate(item.route))}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <div className="truncate text-sm text-white">
            {manifest?.user?.name ?? user?.email ?? ''}
          </div>
          <div className="truncate text-xs text-slate-400">
            {manifest?.user?.email ?? ''}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-muted/30">
        <Outlet />
      </main>
    </div>
  );
}

export default function PortalLayout() {
  return (
    <DirtyGuardProvider>
      <Shell />
    </DirtyGuardProvider>
  );
}
