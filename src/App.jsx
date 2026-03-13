import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'recipes'

function loadRecipes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveRecipes(recipes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── Add Recipe Form ─────────────────────────────────────────────────────────

function RecipeForm({ onAdd }) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('All fields are required.')
      return
    }
    onAdd({
      id: generateId(),
      name: name.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      createdAt: new Date().toISOString(),
    })
    setName('')
    setIngredients('')
    setInstructions('')
    setError('')
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <h2>Add a Recipe</h2>
      {error && <p className="form-error">{error}</p>}

      <label htmlFor="name">Recipe Name</label>
      <input
        id="name"
        type="text"
        placeholder="e.g. Classic Pancakes"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="ingredients">Ingredients</label>
      <textarea
        id="ingredients"
        placeholder="One ingredient per line"
        rows={4}
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
      />

      <label htmlFor="instructions">Instructions</label>
      <textarea
        id="instructions"
        placeholder="Step-by-step instructions"
        rows={5}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <button type="submit" className="btn btn-primary">Save Recipe</button>
    </form>
  )
}

// ── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search recipes"
      />
    </div>
  )
}

// ── Recipe List ─────────────────────────────────────────────────────────────

function RecipeList({ recipes, onSelect, onEdit, onDelete }) {
  if (recipes.length === 0) {
    return <p className="empty-state">No recipes yet. Add one above!</p>
  }

  return (
    <ul className="recipe-list">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="recipe-card">
          <button className="recipe-name" onClick={() => onSelect(recipe)}>
            {recipe.name}
          </button>
          <div className="card-actions">
            <button
              className="btn btn-edit"
              onClick={() => onEdit(recipe)}
              aria-label={`Edit ${recipe.name}`}
            >
              Edit
            </button>
            <button
              className="btn btn-delete"
              onClick={() => onDelete(recipe.id)}
              aria-label={`Delete ${recipe.name}`}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ recipe, onSave, onClose }) {
  const [name, setName] = useState(recipe.name)
  const [ingredients, setIngredients] = useState(recipe.ingredients)
  const [instructions, setInstructions] = useState(recipe.instructions)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('All fields are required.')
      return
    }
    onSave({ ...recipe, name: name.trim(), ingredients: ingredients.trim(), instructions: instructions.trim() })
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2>Edit Recipe</h2>
        {error && <p className="form-error">{error}</p>}
        <form className="edit-form" onSubmit={handleSubmit}>
          <label htmlFor="edit-name">Recipe Name</label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="edit-ingredients">Ingredients</label>
          <textarea
            id="edit-ingredients"
            rows={4}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <label htmlFor="edit-instructions">Instructions</label>
          <textarea
            id="edit-instructions"
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  )
}

// ── Recipe Detail ───────────────────────────────────────────────────────────

function RecipeDetail({ recipe, onClose }) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>{recipe.name}</h2>

        <section>
          <h3>Ingredients</h3>
          <pre className="detail-text">{recipe.ingredients}</pre>
        </section>

        <section>
          <h3>Instructions</h3>
          <pre className="detail-text">{recipe.instructions}</pre>
        </section>
      </div>
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [recipes, setRecipes] = useState(loadRecipes)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : recipes

  useEffect(() => {
    saveRecipes(recipes)
  }, [recipes])

  function handleAdd(recipe) {
    setRecipes((prev) => [recipe, ...prev])
  }

  function handleUpdate(updated) {
    setRecipes((prev) => prev.map((r) => r.id === updated.id ? updated : r))
    if (selected?.id === updated.id) setSelected(updated)
    setEditing(null)
  }

  function handleDelete(id) {
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Recipe Box</h1>
      </header>

      <main className="app-main">
        <RecipeForm onAdd={handleAdd} />

        <section className="recipe-section">
          <h2>Saved Recipes ({recipes.length})</h2>
          <SearchBar value={query} onChange={setQuery} />
          <RecipeList
            recipes={filtered}
            onSelect={setSelected}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {selected && (
        <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />
      )}
      {editing && (
        <EditModal recipe={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
