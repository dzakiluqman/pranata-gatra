import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';

import NotificationModal from '@/components/navigation/NotificationModal';

interface NotificationModalContextValue {
  isNotificationModalOpen: boolean;
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationModalContext = createContext<
  NotificationModalContextValue | undefined
>(undefined);

export function NotificationModalProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const openNotificationModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeNotificationModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleNotificationCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  return (
    <NotificationModalContext.Provider
      value={{
        isNotificationModalOpen: isOpen,
        openNotificationModal,
        closeNotificationModal,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
      <NotificationModal
        visible={isOpen}
        onClose={closeNotificationModal}
        onNotificationCountChange={handleNotificationCountChange}
      />
    </NotificationModalContext.Provider>
  );
}

export function useNotificationModal() {
  const context = useContext(NotificationModalContext);
  if (!context) {
    throw new Error(
      'useNotificationModal must be used within a NotificationModalProvider'
    );
  }
  return context;
}
