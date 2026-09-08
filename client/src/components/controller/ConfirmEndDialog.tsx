import { Button } from "@/components/ui/button";
import { DialogOverlay } from "@/components/ui/dialog-overlay";
import { endDeletesPresentation } from "@/lib/flags";

function endCopy(local: boolean): string {
  if (!endDeletesPresentation) {
    return local
      ? "This will close the viewer window. The presentation stays in this browser."
      : "This will disconnect all viewers. The presentation is kept and can be opened again.";
  }
  return local
    ? "This will close the viewer window and delete the presentation from this browser. This action cannot be undone."
    : "This will disconnect all viewers and permanently delete the presentation. This action cannot be undone.";
}

// "End Presentation?" confirmation shared by desktop and mobile. Both surfaces
// route the actual teardown through the same `onConfirm` (Presentation's
// `endPresentation`), so stop-vs-delete (VITE_END_DELETES) and the viewer
// close can't drift between the two.
export function ConfirmEndDialog({
  local,
  onConfirm,
  onClose,
}: {
  local: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <DialogOverlay onClose={onClose}>
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">End Presentation?</h2>
        <p className="text-sm text-muted-foreground">{endCopy(local)}</p>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" variant="destructive" onClick={onConfirm}>
          End Presentation
        </Button>
      </div>
    </DialogOverlay>
  );
}
