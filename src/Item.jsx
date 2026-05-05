export default function Item({
  id,
  name,
  done,
  quantity,
  pending,
  handleDeleteItems,
  handleToggleItem,
}) {
  return (
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
          onClick={() => handleDeleteItems(id)}
        ></button>
      </div>
    </li>
  );
}
