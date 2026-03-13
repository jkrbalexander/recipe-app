# Recipe Box — Claude Context

## Project Purpose
A client-side recipe manager called "Recipe Box". Users can add, edit, delete, and view recipes. Recipes are persisted to `localStorage` — there is no backend or database. The app is a personal tool, not a multi-user platform.

## Tech Stack
- **React 18** (JSX, hooks only — no class components)
- **Vite 5** as the dev server and build tool
- **No routing library** — single page, single view
- **No state management library** — plain `useState` / `useEffect`
- **No CSS framework** — hand-written CSS in `App.css` and `index.css`
- **No TypeScript** — plain JavaScript (.jsx)

## Folder Structure
```
recipe-app/
├── index.html          # Vite entry point
├── vite.config.js      # Vite config (just the React plugin)
├── package.json
├── src/
│   ├── main.jsx        # Mounts <App /> into #root
│   ├── App.jsx         # All components and app logic (single file)
│   ├── App.css         # Component-scoped styles
│   └── index.css       # Global reset and body styles
```

Everything lives in `src/App.jsx` — components have not been split into separate files yet.

## Data Model
Each recipe stored in `localStorage` under the key `"recipes"` as a JSON array:
```js
{
  id: string,           // generated via Date.now() + random
  name: string,
  ingredients: string,  // free text, one ingredient per line
  instructions: string, // free text, step-by-step
  tags: string[],       // lowercase, parsed from comma-separated input
  createdAt: string,    // ISO timestamp
}
```

## Components (all in App.jsx)
| Component | Purpose |
|---|---|
| `RecipeForm` | Add new recipe. Validates all required fields. Tags optional. |
| `SearchBar` | Filters list by recipe name as you type. |
| `TagFilter` | Clickable tag chips derived from all recipes. Filters list by tag. |
| `RecipeList` | Renders recipe cards. Tags on cards are also clickable filters. |
| `EditModal` | Modal overlay to edit an existing recipe. Pre-fills all fields. |
| `RecipeDetail` | Read-only modal overlay showing full recipe details. |
| `App` | Root. Owns all state: `recipes`, `selected`, `editing`, `query`, `activeTag`. |

## Coding Conventions
- **Function components only**, declared with `function` keyword (not arrow functions)
- **No prop-types** — keep it simple
- **CSS class names** use kebab-case (`.recipe-card`, `.btn-primary`, etc.)
- **Button variants** follow `.btn .btn-{variant}` pattern (`btn-primary`, `btn-edit`, `btn-delete`)
- **Modals** use `.detail-overlay` + `.detail-card` pattern with backdrop click to close
- **Color palette**: muted green `#6a7c5b` as the primary accent, warm off-whites for backgrounds
- Tags are always stored lowercase; `parseTags()` handles normalization
- Filtering (`query` + `activeTag`) is computed inline in `App`, not in a separate hook

## Dev Commands
```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build locally
```

## What's Not Built Yet (as of last session)
- No image/photo support for recipes
- No structured ingredients (stored as raw text)
- No sorting options
- No backend or sync — data is local to one browser only
- Components have not been split into separate files
