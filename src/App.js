import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import Item from "./Item";
import "@fontsource/abril-fatface";
import Login from "./Login";
import {
  getToken,
  tryRefresh,
  logout,
  apiFetch,
  AUTH_REQUIRED,
} from "./auth";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("pending"); // 'all' | 'pending' | 'completed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [addingItem, setAddingItem] = useState(false);

  // Items derivados sin estado extra ni useEffect
  const displayedItems = useMemo(() => {
    if (inputValue.trim()) {
      return items.filter(
        (item) =>
          item.name.toLowerCase().startsWith(inputValue.toLowerCase()) ||
          pendingIds.has(item.id)
      );
    }
    if (filter === "pending")
      return items.filter((i) => !i.done || pendingIds.has(i.id));
    if (filter === "completed")
      return items.filter((i) => i.done || pendingIds.has(i.id));
    return items;
  }, [items, filter, inputValue, pendingIds]);

  const addPendingId = (id) =>
    setPendingIds((prev) => new Set([...prev, id]));

  const removePendingId = (id) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  // Carga inicial con spinner
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_URL}`);
      if (!res.ok) throw new Error(`Error al cargar los items (${res.status})`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      if (err.message === AUTH_REQUIRED) {
        setShowLogin(true);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronización silenciosa en background (sin spinner, sin flash)
  const syncItems = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data);
    } catch (err) {
      if (err.message === AUTH_REQUIRED) setShowLogin(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const existingToken = getToken();
      if (existingToken) {
        try {
          await loadItems();
        } catch {
          const refreshed = await tryRefresh();
          if (refreshed) await loadItems();
          else setShowLogin(true);
        }
      } else {
        const refreshed = await tryRefresh();
        if (refreshed) await loadItems();
        else setShowLogin(true);
      }
    };
    init();
  }, [loadItems]);

  function handleName(e) {
    setInputValue(e?.target?.value ?? "");
  }

  async function handleAddItems(event) {
    if (event.keyCode !== 13) return;
    const name = event.target.value.trim();
    if (!name) return;

    // Optimistic: añadir item temporal inmediatamente
    const tempId = `temp_${Date.now()}`;
    setItems((prev) => [
      ...prev,
      { id: tempId, name, done: false, quantity: null, _temp: true },
    ]);
    setInputValue("");
    setAddingItem(true);

    try {
      const res = await apiFetch(`${API_URL}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Error al guardar el item");

      // Intentar usar el item real devuelto por el servidor
      let realItem = null;
      try {
        realItem = await res.json();
      } catch {}

      if (realItem?.id) {
        // Reemplazar temp con el item real (sin refetch, sin flash)
        setItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...realItem } : i))
        );
      } else {
        // Fallback silencioso: sync en background
        setItems((prev) => prev.filter((i) => i.id !== tempId));
        await syncItems();
      }
    } catch (err) {
      // Revertir: quitar el item temporal
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      if (err.message === AUTH_REQUIRED) {
        setShowLogin(true);
      } else {
        setError("Error al guardar el item");
      }
      setInputValue(name); // Restaurar lo que escribía
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteItems(id) {
    // Optimistic: eliminar inmediatamente
    const backup = items.find((i) => i.id === id);
    const backupIndex = items.findIndex((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el item");
    } catch (err) {
      // Revertir: reinsertar en la posición original
      setItems((prev) => {
        const next = [...prev];
        next.splice(backupIndex, 0, backup);
        return next;
      });
      if (err.message === AUTH_REQUIRED) setShowLogin(true);
      else setError("Error al eliminar el item");
    }
  }

  async function handleToggleItem(id) {
    const item = items.find((i) => i.id === id);
    if (!item || pendingIds.has(id)) return; // prevenir doble tap

    addPendingId(id);

    try {
      const endpoint = item.done ? "mark-undone" : "mark-done";
      const res = await apiFetch(`${API_URL}/${id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Error al actualizar el item");
      // Solo actualizar estado tras éxito
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
      );
    } catch (err) {
      if (err.message === AUTH_REQUIRED) setShowLogin(true);
      else setError("Error al actualizar el item");
    } finally {
      setTimeout(() => removePendingId(id), 300);
    }
  }

  const handleLogout = async () => {
    await logout();
    setItems([]);
    setShowLogin(true);
  };

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    await loadItems();
  };

  const pendingCount = items.filter((i) => !i.done && !i._temp).length;

  return (
    <div className="App">
      {showLogin && <Login onSuccess={handleLoginSuccess} />}
      <div>
        <section className="todoapp">
          <header className="header">
            <h1>
              Lista de la compra
              <small
                style={{ fontSize: "0.5em", marginLeft: "10px", color: "#888" }}
              >
                v0.1.11
              </small>
            </h1>

            <input
              id="new-todo-input"
              className={`new-todo${addingItem ? " adding" : ""}`}
              placeholder="¿Qué falta?"
              autoFocus=""
              autoComplete="off"
              maxLength={120}
              onKeyUp={handleAddItems}
              onChange={handleName}
              value={inputValue}
              disabled={showLogin || addingItem}
            />
          </header>

          <section className="main">
            <input id="toggle-all" className="toggle-all" type="checkbox" />
            <label htmlFor="toggle-all">Mark all as complete</label>
            <ul className="todo-list">
              {loading ? (
                <li className="loading">Cargando...</li>
              ) : error ? (
                <li className="error" onClick={() => setError(null)}>
                  {error} &nbsp;✕
                </li>
              ) : (
                displayedItems.map((item) => (
                  <Item
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    done={item.done}
                    quantity={item.quantity}
                    pending={pendingIds.has(item.id) || !!item._temp}
                    handleDeleteItems={handleDeleteItems}
                    handleToggleItem={handleToggleItem}
                  />
                ))
              )}
            </ul>
          </section>

          <footer className="footer">
            <span className="todo-count">
              <strong id="pending-count">{pendingCount}</strong>
              &nbsp;pendiente(s)
            </span>
            <ul className="filters">
              <li onClick={() => setFilter("all")}>
                <a className={`filtro${filter === "all" ? " selected" : ""}`} href="#/">
                  Todos
                </a>
              </li>
              <li onClick={() => setFilter("pending")}>
                <a className={`filtro${filter === "pending" ? " selected" : ""}`} href="#/active">
                  Pendientes
                </a>
              </li>
              <li onClick={() => setFilter("completed")}>
                <a className={`filtro${filter === "completed" ? " selected" : ""}`} href="#/completed">
                  Completados
                </a>
              </li>
            </ul>
            {!showLogin && (
              <button className="logout" onClick={handleLogout}>
                Salir
              </button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}

export default App;
