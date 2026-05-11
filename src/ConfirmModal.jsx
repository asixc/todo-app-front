import './Login.css';

export default function ConfirmModal({ itemName, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>¿Eliminar nota?</h2>
        <p className="hint">«{itemName}» se eliminará permanentemente.</p>
        <div className="confirm-actions">
          <button className="back" onClick={onCancel}>Cancelar</button>
          <button className="confirm-delete" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
