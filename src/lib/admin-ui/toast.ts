export type AdminToastType = 'error' | 'success' | 'info';

export interface AdminToastPayload {
  type?: AdminToastType;
  message: string;
}

const ADMIN_TOAST_EVENT = 'admin-toast';

export function showAdminToast(payload: AdminToastPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AdminToastPayload>(ADMIN_TOAST_EVENT, { detail: payload }));
}

export function subscribeAdminToast(listener: (payload: AdminToastPayload) => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    listener((event as CustomEvent<AdminToastPayload>).detail);
  };

  window.addEventListener(ADMIN_TOAST_EVENT, handler);
  return () => window.removeEventListener(ADMIN_TOAST_EVENT, handler);
}
