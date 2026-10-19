import { Drawer, useMediaQuery, useTheme } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import usePermissions from '@/hooks/usePermissions';
import Logo from './Logo';
import { adminNav, type AdminNavItem, type AdminRole } from './adminNav';

const DRAWER_WIDTH = 248;

interface AdminSidebarProps {
  open: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useAppSelector((state) => state.auth.user);
  const { hasPermission } = usePermissions();

  const canSee = (item: AdminNavItem) => {
    if (item.roles && (!user?.role || !item.roles.includes(user.role as AdminRole))) return false;
    if (item.permissionEntity && !hasPermission(item.permissionEntity, 'read')) return false;
    return true;
  };

  const groups = adminNav
    .map((group) => ({ ...group, items: group.items.filter(canSee) }))
    .filter((group) => group.items.length > 0);

  const content = (
    <nav aria-label="Admin" className="flex h-full flex-col bg-[#14232b] text-white">
      <div className="flex items-center gap-3 px-5 pb-5 pt-5">
        <NavLink to="/admin/dashboard" onClick={() => isMobile && onClose?.()} className="shrink-0">
          <Logo variant="admin" size="sm" />
        </NavLink>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Glyde Curtains</p>
          <p className="truncate text-xs text-white/55">Admin panel</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, index) => (
          <div key={group.label ?? index} className="mt-3 first:mt-0">
            {group.label && (
              <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => isMobile && onClose?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_#d9733f]'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="flex text-white/80 [&_svg]:text-[20px]">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
        >
          View website
          <OpenInNewIcon sx={{ fontSize: 16 }} />
        </a>
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <Drawer variant="temporary" open={open} onClose={onClose} PaperProps={{ sx: { width: DRAWER_WIDTH, bgcolor: '#14232b' } }}>
        {content}
      </Drawer>
    );
  }

  return (
    <aside className="sticky top-0 h-screen shrink-0" style={{ width: DRAWER_WIDTH }}>
      {content}
    </aside>
  );
}
