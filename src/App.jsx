import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs,
} from 'firebase/firestore'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, db, googleProvider } from './firebase'
import './App.css'

const LS_KEY = 'recipes'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function parseTags(str) {
  return str.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
}

const SHARED_ID = 'family'

function recipesRef() {
  return collection(db, 'users', SHARED_ID, 'recipes')
}

function recipeDoc(id) {
  return doc(db, 'users', SHARED_ID, 'recipes', id)
}

// ── Sign In Screen ────────────────────────────────────────────────────────────

function SignIn({ onSignIn }) {
  const [error, setError] = useState('')

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch {
      setError('Sign-in failed. Please try again.')
    }
  }

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <h1>Kari's Favorites</h1>
        <p className="signin-subtitle">Save and sync your recipes across all your devices.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-google" onClick={handleSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

// ── Add Recipe Form ─────────────────────────────────────────────────────────

function RecipeForm({ onAdd }) {
  const [name, setName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Recipe name is required.')
      return
    }
    const trimmed = sourceUrl.trim()
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    onAdd({
      id: generateId(),
      name: name.trim(),
      ingredients: '',
      instructions: '',
      tags: parseTags(tags),
      sourceUrl: isUrl ? trimmed : '',
      createdAt: new Date().toISOString(),
    })
    setName('')
    setSourceUrl('')
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

      <label htmlFor="source-url">Link <span className="label-hint">(optional)</span></label>
      <input
        id="source-url"
        type="text"
        placeholder="e.g. https://www.instagram.com/..."
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
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
  const [name, setName] = useState(recipe.name || '')
  const [sourceUrl, setSourceUrl] = useState(recipe.sourceUrl || '')
  const [ingredients, setIngredients] = useState(recipe.ingredients || '')
  const [instructions, setInstructions] = useState(recipe.instructions || '')
  const [tags, setTags] = useState((recipe.tags || []).join(', '))
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Recipe name is required.')
      return
    }
    const trimmed = sourceUrl.trim()
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    onSave({ ...recipe, name: name.trim(), sourceUrl: isUrl ? trimmed : '', ingredients: ingredients.trim(), instructions: instructions.trim(), tags: parseTags(tags) })
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2>Edit Recipe</h2>
        {error && <p className="form-error">{error}</p>}
        <form className="edit-form" onSubmit={handleSubmit}>
          <label htmlFor="edit-name">Recipe Name</label>
          <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="edit-source-url">Link <span className="label-hint">(optional)</span></label>
          <input id="edit-source-url" type="text" placeholder="e.g. https://www.instagram.com/..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <label htmlFor="edit-ingredients">Ingredients</label>
          <textarea id="edit-ingredients" rows={4} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          <label htmlFor="edit-instructions">Instructions</label>
          <textarea id="edit-instructions" rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <label htmlFor="edit-tags">Tags <span className="label-hint">(comma-separated, optional)</span></label>
          <input id="edit-tags" type="text" placeholder="e.g. breakfast, vegetarian, quick" value={tags} onChange={(e) => setTags(e.target.value)} />
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
        <button className="detail-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2>{recipe.name}</h2>

        {recipe.tags?.length > 0 && (
          <div className="card-tags">
            {recipe.tags.map((tag) => (
              <span key={tag} className="tag-chip tag-chip-sm">{tag}</span>
            ))}
          </div>
        )}

        {recipe.sourceUrl && (
          <a className="detail-source-link" href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
            View original post
          </a>
        )}

        {recipe.ingredients && (
          <section>
            <h3>Ingredients</h3>
            <pre className="detail-text">{recipe.ingredients}</pre>
          </section>
        )}

        {recipe.instructions && (
          <section>
            <h3>Instructions</h3>
            <pre className="detail-text">{recipe.instructions}</pre>
          </section>
        )}
      </div>
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [recipes, setRecipes] = useState([])
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('newest')
  const migratedRef = useRef(false)

  // Auth listener with timeout fallback for IndexedDB hang
  useEffect(() => {
    const timer = setTimeout(() => setUser((u) => u === undefined ? null : u), 3000)
    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(timer)
      setUser(u)
    })
    return () => { clearTimeout(timer); unsub() }
  }, [])

  // Firestore real-time listener + migration
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(recipesRef(), (snap) => {
      const docs = snap.docs.map((d) => d.data())
      setRecipes(docs)

      // One-time migration: per-user Firestore → shared, then localStorage → shared
      if (!migratedRef.current && docs.length === 0) {
        migratedRef.current = true
        getDocs(collection(db, 'users', user.uid, 'recipes')).then((oldSnap) => {
          if (!oldSnap.empty) {
            oldSnap.docs.forEach((d) => setDoc(recipeDoc(d.id), d.data()))
          } else {
            try {
              const local = JSON.parse(localStorage.getItem(LS_KEY)) || []
              if (local.length > 0) {
                local.forEach((r) => setDoc(recipeDoc(r.id), r))
                localStorage.removeItem(LS_KEY)
              }
            } catch {}
          }
        })
      } else {
        migratedRef.current = true
      }
    })
    return unsub
  }, [user])

const allTags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort()

  const filtered = recipes
    .filter((r) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || (r.ingredients || '').toLowerCase().includes(q)
      const matchesTag = !activeTag || (r.tags || []).includes(activeTag)
      return matchesQuery && matchesTag
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'za') return b.name.localeCompare(a.name)
    })

  async function handleAdd(recipe) {
    await setDoc(recipeDoc(recipe.id), recipe)
  }

  async function handleUpdate(updated) {
    await setDoc(recipeDoc(updated.id), updated)
    if (selected?.id === updated.id) setSelected(updated)
    setEditing(null)
  }

  async function handleDelete(id) {
    await deleteDoc(recipeDoc(id))
    if (selected?.id === id) setSelected(null)
  }

  if (user === undefined) return <div className="app-loading">Loading…</div>
  if (!user) return <SignIn />

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kari's Favorites</h1>
        <div className="header-user">
          <img className="user-avatar" src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
          <button className="btn-signout" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>

      <main className="app-main">
        <RecipeForm onAdd={handleAdd} />

        <section className="recipe-section">
          <div className="section-header">
            <h2>Saved Recipes ({recipes.length})</h2>
          </div>
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

      {selected && <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />}
      {editing && <EditModal recipe={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />}
    </div>
  )
}
