# Contributing

## Development Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Make sure the backend is running at `http://localhost:3000` before starting the frontend.

---

## Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes
4. Run checks: `npm run lint && npm run build`
5. Commit with a conventional commit message
6. Open a Pull Request against `main`

---

## Commit Convention

```
feat: add screen sharing support
fix: cleanup peer connection on tab close
refactor: extract signaling logic to useSignaling hook
chore: upgrade socket.io-client to 4.8
```

---

## Code Style

- TypeScript strict mode — no `any` without justification
- No logic in page components — use hooks
- No direct store mutations outside store actions
- Clean up all event listeners and media tracks on unmount
- Use `cn()` for conditional class names, never string concatenation

---

## Adding a New Feature

1. **New socket event** → add constant to `src/types/events.ts`, handle in `useSocket.ts` or `useWebRTC.ts`
2. **New API endpoint** → add typed method to `src/lib/api.ts`
3. **New shared state** → add to the relevant Zustand store in `src/store/`
4. **New UI component** → add to `src/components/ui/` (primitive) or the relevant feature folder
5. **New page** → add to `src/app/` following App Router conventions

---

## Pull Request Guidelines

- One feature or fix per PR
- Update relevant docs if behavior changes
- Describe what changed and why in the PR description
