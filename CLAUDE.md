# Recipe Box — Claude Context

## Project Purpose
A client-side recipe manager called "Recipe Box". Users can add, edit, delete, search, sort, and view recipes. Recipes are persisted to `localStorage` — there is no backend or database. The app is a personal tool, not a multi-user platform. Deployed on Vercel.

## Tech Stack
- **React 18** (JSX, hooks only — no class components)
- **Vite 5** as the dev server and build tool
- **Firebase** — Firestore for real-time sync, Firebase Auth for Google sign-in
- **PWA** — includes `manifest.json`, `sw.js`, and app icon for installability
- **No routing library** — single page, single view
- **No state management library** — plain `useState` / `useEffect`
- **No CSS framework** — hand-written CSS in `App.css` and `index.css`
- **No TypeScript** — plain JavaScript (.jsx)

## Folder Structure
```
recipe-app/
├── index.html          # Vite entry point, registers service worker
├── vite.config.js      # Vite config (just the React plugin)
├── package.json
├── .env                # Firebase config (gitignored — never commit)
├── public/
│   ├── manifest.json   # PWA manifest with share_target declaration
│   ├── sw.js           # Service worker (cache-first, enables install)
│   └── icon.svg        # App icon
├── src/
│   ├── main.jsx        # Mounts <App /> into #root
│   ├── firebase.js     # Firebase app init, exports auth/db/googleProvider
│   ├── App.jsx         # All components and app logic (single file)
│   ├── App.css         # Component-scoped styles
│   └── index.css       # Global reset and body styles
```

Everything lives in `src/App.jsx` — components have not been split into separate files yet.

## Firebase Setup
- **Project ID:** `recipe-box-f12e4`
- **Auth:** Google sign-in only. Authorized domains must include `localhost` and the Vercel URL.
- **Firestore path:** `users/{uid}/recipes/{recipeId}` — each document is a full recipe object
- **Security rules:** Users can only read/write their own recipes (`request.auth.uid == userId`)
- **Offline persistence:** Enabled via `enableIndexedDbPersistence(db)` in `firebase.js`
- **Environment variables:** All `VITE_FIREBASE_*` — set in `.env` locally and in Vercel dashboard for production
- **Migration:** On first sign-in, if Firestore is empty and `localStorage` has recipes, they are auto-migrated and localStorage is cleared

## Data Model
Each recipe stored in Firestore as a document:
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
| `SignIn` | Full-page sign-in screen shown when user is not authenticated. |
| `RecipeForm` | Add new recipe. Validates all required fields. Tags optional. |
| `SearchBar` | Filters list by name or ingredients. Includes sort dropdown. |
| `TagFilter` | Clickable tag chips derived from all recipes. Filters list by tag. |
| `RecipeList` | Renders recipe cards. Tags on cards are also clickable filters. |
| `EditModal` | Modal overlay to edit an existing recipe. Pre-fills all fields including tags. |
| `RecipeDetail` | Read-only modal overlay showing full recipe details and tags. |
| `ShareImport` | Modal for importing a recipe. Has a paste area for Instagram links/captions. |
| `App` | Root. Owns all state. Manages auth listener and Firestore snapshot listener. |

## Key State in App
- `user` — Firebase auth user (`undefined` while loading, `null` if signed out, user object if signed in)
- `recipes` — populated by Firestore `onSnapshot` listener
- `selected` — recipe currently shown in RecipeDetail modal
- `editing` — recipe currently open in EditModal
- `query` — search string (filters by name + ingredients)
- `activeTag` — currently selected tag filter
- `sort` — one of `'newest' | 'oldest' | 'az' | 'za'`
- `shareData` — object `{ title, text, url }` populated from URL params (Web Share Target) or the manual Import button; triggers ShareImport modal

## Instagram Import Flow
- **Android (PWA):** Web Share Target declared in `manifest.json`. When installed and shared to from Instagram, app opens with `?title=&text=&url=` params. `App` reads these on mount via `URLSearchParams`, sets `shareData`, clears params with `history.replaceState`.
- **iOS:** Web Share Target not supported. An **+ Import** button next to the recipe list heading opens `ShareImport` with empty `shareData`. User pastes the Instagram URL or caption into a textarea for reference while filling in the form.

## Coding Conventions
- **Function components only**, declared with `function` keyword (not arrow functions)
- **No prop-types** — keep it simple
- **CSS class names** use kebab-case (`.recipe-card`, `.btn-primary`, etc.)
- **Button variants** follow `.btn .btn-{variant}` pattern (`btn-primary`, `btn-edit`, `btn-delete`, `btn-import`)
- **Modals** use `.detail-overlay` + `.detail-card` pattern with backdrop click to close
- **Color palette**: muted green `#6a7c5b` as the primary accent, warm off-whites for backgrounds
- Tags are always stored lowercase; `parseTags()` handles normalization
- Filtering and sorting are computed inline in `App`, not in a separate hook

## Dev Commands
```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build locally
```

## What's Not Built Yet
- No image/photo support for recipes
- No structured ingredients (stored as raw text)
- Components have not been split into separate files
