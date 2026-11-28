/**
 * RAPSONYX Native <dialog> Modal Helper (Modern Web Guidance Compliant)
 * - Uses native showModal() / close() with closedby="any"
 * - Adds pointerdown/pointerup outside-rect light dismiss ONLY when !('closedBy' in HTMLDialogElement.prototype) (Safari)
 */

const supportsClosedBy = typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;

export function bindDialogLightDismiss(dialogEl) {
  if (!dialogEl || dialogEl.__rapBoundDismiss) return;
  dialogEl.__rapBoundDismiss = true;
  if (supportsClosedBy) return;

  let pressedOutside = false;
  dialogEl.addEventListener('pointerdown', (e) => {
    const rect = dialogEl.getBoundingClientRect();
    pressedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
  });
  dialogEl.addEventListener('pointerup', (e) => {
    if (!pressedOutside) return;
    pressedOutside = false;
    const rect = dialogEl.getBoundingClientRect();
    const stillOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (stillOutside && dialogEl.open) {
      dialogEl.close();
    }
  });
}

export function openModalDialog(dialogEl) {
  if (!dialogEl) return;
  bindDialogLightDismiss(dialogEl);
  if (typeof dialogEl.showModal === 'function') {
    if (!dialogEl.open) dialogEl.showModal();
  } else {
    dialogEl.setAttribute('open', '');
  }
}

export function closeModalDialog(dialogEl) {
  if (!dialogEl) return;
  if (typeof dialogEl.close === 'function') {
    if (dialogEl.open) dialogEl.close();
  } else {
    dialogEl.removeAttribute('open');
  }
}
