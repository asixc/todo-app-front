import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

export default function Item({
  id,
  name,
  done,
  quantity,
  pending,
  handleDeleteItems,
  handleToggleItem,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  function handleConfirmDelete() {
    setShowConfirm(false);
    handleDeleteItems(id);
  }

  return (
    <>
      <li className={`${done ? "completed" : ""} ${pending ? "item-pending" : ""}`.trim()}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={done}
            disabled={pending}
            onChange={() => handleToggleItem(id)}
            onTouchStart={() => handleToggleItem(id)}
          />
          <label>{name}</label>
          <button
            className="destroy"
            disabled={pending}
            onClick={() => setShowConfirm(true)}
            onTouchEnd={(e) => { e.preventDefault(); setShowConfirm(true); }}
          ></button>
        </div>
      </li>
      {showConfirm && (
        <ConfirmModal
          itemName={name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
