import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastHost } from '@/components/ui';
import { selectIsOnboarded, useStore } from '@/store';
import { ComposerSheet } from '@/features/posts/ComposerSheet';
import { DemoPanel } from '@/features/demo/DemoPanel';
import { PhoneFrame } from './PhoneFrame';
import { TabBar } from './TabBar';

const TAB_ROUTES = ['/', '/forum', '/chats', '/profile'];

/** Signed-in layout: screen + bottom tabs, plus global overlays. */
export function AppShell() {
  const location = useLocation();
  const onboarded = useStore(selectIsOnboarded);
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  const showTabs = TAB_ROUTES.includes(location.pathname);

  return (
    <PhoneFrame>
      {/* Keyed so each screen's enter animation replays on navigation. */}
      <Outlet key={location.pathname} />
      {showTabs && <TabBar />}
      <ComposerSheet />
      <DemoPanel />
      <ToastHost />
    </PhoneFrame>
  );
}

/** Layout for onboarding (no tabs). */
export function BareShell() {
  const onboarded = useStore(selectIsOnboarded);
  if (onboarded) return <Navigate to="/" replace />;
  return (
    <PhoneFrame>
      <Outlet />
      <DemoPanel />
      <ToastHost />
    </PhoneFrame>
  );
}
