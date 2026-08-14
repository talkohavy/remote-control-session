import { useCustomContextMenu } from '@renderer/hooks/useCustomContextMenu';
import { useIncomingMenuEvents } from '@renderer/hooks/useIncomingMenuEvents';

export function useAppLogic() {
  useIncomingMenuEvents();
  useCustomContextMenu();
}
