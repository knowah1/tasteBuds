import { createBrowserRouter } from 'react-router-dom';
import { AppShell, BareShell } from './AppShell';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { MapScreen } from '@/features/map/MapScreen';
import { ForumScreen } from '@/features/forum/ForumScreen';
import { ThreadScreen } from '@/features/forum/ThreadScreen';
import { ChatsScreen } from '@/features/chat/ChatsScreen';
import { ChatRoomScreen } from '@/features/chat/ChatRoomScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { UserProfileScreen } from '@/features/profile/UserProfileScreen';
import { PostDetailScreen } from '@/features/posts/PostDetailScreen';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';

/**
 * Route map. Feature tracks replace the screen components, not the paths:
 *   /               Map                 /forum/:threadId   Forum thread
 *   /forum          Forum               /chats/:roomId     Chat room
 *   /chats          Chats               /user/:userId      Someone's profile
 *   /profile        My profile          /post/:postId      Event detail
 *   /notifications  Notification center /onboarding        First launch
 */
export const router = createBrowserRouter([
  {
    element: <BareShell />,
    children: [{ path: '/onboarding', element: <OnboardingScreen /> }],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <MapScreen /> },
      { path: '/forum', element: <ForumScreen /> },
      { path: '/forum/:threadId', element: <ThreadScreen /> },
      { path: '/chats', element: <ChatsScreen /> },
      { path: '/chats/:roomId', element: <ChatRoomScreen /> },
      { path: '/profile', element: <ProfileScreen /> },
      { path: '/user/:userId', element: <UserProfileScreen /> },
      { path: '/post/:postId', element: <PostDetailScreen /> },
      { path: '/notifications', element: <NotificationsScreen /> },
      { path: '*', element: <MapScreen /> },
    ],
  },
]);
