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

function parseTags(str) {
  return str.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
}

// ── Add Recipe Form ─────────────────────────────────────────────────────────

function RecipeForm({ onAdd }) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tags, setTags] = useState('')
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
      tags: parseTags(tags),
      createdAt: new Date().toISOString(),
    })
    setName('')
    setIngredients('')
    setInstructions('')
    setTags('')
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

      <label htmlFor="tags">Tags <span className="label-hint">(comma-separated, optional)</span></label>
      <input
        id="tags"
        type="text"
        placeholder="e.g. breakfast, vegetarian, quick"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <button type="submit" className="btn btn-primary">Save Recipe</button>
    </form>
  )
}

// ── Search Bar + Sort ────────────────────────────────────────────────────────

function SearchBar({ value, onChange, sort, onSort }) {
  return (
    <div className="search-row">
      <input
        className="search-input"
        type="search"
        placeholder="Search recipes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search recipes"
      />
      <select
        className="sort-select"
        value={sort}
        onChange={(e) => onSort(e.target.value)}
        aria-label="Sort recipes"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="az">A – Z</option>
        <option value="za">Z – A</option>
      </select>
    </div>
  )
}

// ── Tag Filter ───────────────────────────────────────────────────────────────

function TagFilter({ allTags, activeTag, onSelect }) {
  if (allTags.length === 0) return null

  return (
    <div className="tag-filter">
      {allTags.map((tag) => (
        <button
          key={tag}
          className={`tag-chip ${activeTag === tag ? 'tag-chip-active' : ''}`}
          onClick={() => onSelect(activeTag === tag ? null : tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

// ── Recipe List ─────────────────────────────────────────────────────────────

function RecipeList({ recipes, onSelect, onEdit, onDelete, onTagClick, activeTag }) {
  if (recipes.length === 0) {
    return <p className="empty-state">No recipes found.</p>
  }

  return (
    <ul className="recipe-list">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="recipe-card">
          <div className="card-main">
            <button className="recipe-name" onClick={() => onSelect(recipe)}>
              {recipe.name}
            </button>
            {recipe.tags?.length > 0 && (
              <div className="card-tags">
                {recipe.tags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-chip tag-chip-sm ${activeTag === tag ? 'tag-chip-active' : ''}`}
                    onClick={() => onTagClick(activeTag === tag ? null : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
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
  const [tags, setTags] = useState((recipe.tags || []).join(', '))
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('All fields are required.')
      return
    }
    onSave({ ...recipe, name: name.trim(), ingredients: ingredients.trim(), instructions: instructions.trim(), tags: parseTags(tags) })
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
          <label htmlFor="edit-tags">Tags <span className="label-hint">(comma-separated, optional)</span></label>
          <input
            id="edit-tags"
            type="text"
            placeholder="e.g. breakfast, vegetarian, quick"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  )
}

// ── Share Import Modal ───────────────────────────────────────────────────────

function ShareImport({ shared, onSave, onClose }) {
  const [name, setName] = useState(shared.title || '')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('All fields are required.')
      return
    }
    onSave({
      id: generateId(),
      name: name.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      tags: parseTags(tags),
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card share-import-card" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2>Import Recipe</h2>

        {(shared.url || shared.text) && (
          <div className="share-source">
            <p className="share-source-label">Shared from Instagram</p>
            {shared.url && (
              <a className="share-source-url" href={shared.url} target="_blank" rel="noreferrer">
                {shared.url}
              </a>
            )}
            {shared.text && <p className="share-source-text">{shared.text}</p>}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        <form className="edit-form" onSubmit={handleSubmit}>
          <label htmlFor="share-name">Recipe Name</label>
          <input
            id="share-name"
            type="text"
            placeholder="e.g. Classic Pancakes"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="share-ingredients">Ingredients</label>
          <textarea
            id="share-ingredients"
            rows={4}
            placeholder="One ingredient per line"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <label htmlFor="share-instructions">Instructions</label>
          <textarea
            id="share-instructions"
            rows={5}
            placeholder="Step-by-step instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <label htmlFor="share-tags">Tags <span className="label-hint">(comma-separated, optional)</span></label>
          <input
            id="share-tags"
            type="text"
            placeholder="e.g. breakfast, vegetarian, quick"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Save Recipe</button>
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

        {recipe.tags?.length > 0 && (
          <div className="card-tags">
            {recipe.tags.map((tag) => (
              <span key={tag} className="tag-chip tag-chip-sm">{tag}</span>
            ))}
          </div>
        )}

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
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('newest')
  const [shareData, setShareData] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const title = params.get('title') || ''
    const text = params.get('text') || ''
    const url = params.get('url') || ''
    if (title || text || url) {
      setShareData({ title, text, url })
      history.replaceState(null, '', '/')
    }
  }, [])

  const allTags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort()

  const filtered = recipes
    .filter((r) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.ingredients.toLowerCase().includes(q)
      const matchesTag = !activeTag || (r.tags || []).includes(activeTag)
      return matchesQuery && matchesTag
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'za') return b.name.localeCompare(a.name)
    })

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
          <SearchBar value={query} onChange={setQuery} sort={sort} onSort={setSort} />
          <TagFilter allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
          <RecipeList
            recipes={filtered}
            onSelect={setSelected}
            onEdit={setEditing}
            onDelete={handleDelete}
            onTagClick={setActiveTag}
            activeTag={activeTag}
          />
        </section>
      </main>

      {selected && (
        <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />
      )}
      {editing && (
        <EditModal recipe={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />
      )}
      {shareData && (
        <ShareImport
          shared={shareData}
          onSave={(recipe) => { handleAdd(recipe); setShareData(null) }}
          onClose={() => setShareData(null)}
        />
      )}
    </div>
  )
}
