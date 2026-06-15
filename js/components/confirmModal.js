// js/components/confirmModal.js
// Centered, promise-returning confirmation dialog — a drop-in replacement for the
// native confirm(), which Chrome/Edge anchor to the TOP of the window and cannot be
// repositioned. Follows the house Modal Pattern (.modal-backdrop centers via flex).
// Resolves true on confirm; false on cancel / backdrop click / ✕ / Escape.
//
//   if (!await confirmModal({ message: 'Delete this?', confirmText: 'Delete', danger: true })) return;
//
import { esc } from '../format.js';

let _busy = false;

export function confirmModal({
  title       = 'Please confirm',
  message     = '',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  danger      = false,
} = {}) {
  return new Promise(resolve => {
    if (_busy) { resolve(false); return; }   // never stack confirm dialogs

    _busy = true;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div class="modal-header">
          <div class="modal-title" id="confirm-modal-title">${esc(title)}</div>
          <button class="modal-close" type="button" aria-label="Cancel">&times;</button>
        </div>
        <div class="modal-body"><p style="margin:0;line-height:1.5;">${esc(message)}</p></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" type="button" data-confirm="no">${esc(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm="yes">${esc(confirmText)}</button>
        </div>
      </div>`;

    const close = (result) => {
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      _busy = false;
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape')     { e.preventDefault(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true);  }
    };

    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(false); });
    backdrop.querySelector('.modal-close').addEventListener('click',        () => close(false));
    backdrop.querySelector('[data-confirm="no"]').addEventListener('click',  () => close(false));
    backdrop.querySelector('[data-confirm="yes"]').addEventListener('click', () => close(true));
    document.addEventListener('keydown', onKey, true);

    document.body.appendChild(backdrop);
    backdrop.querySelector('[data-confirm="yes"]').focus();
  });
}
