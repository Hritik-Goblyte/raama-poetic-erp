import { toast as sonnerToast } from 'sonner';

export const toast = sonnerToast;

export function Toaster({ ...props }) {
  return (
    <div {...props}>
      {/* Sonner handles its own rendering */}
    </div>
  );
}