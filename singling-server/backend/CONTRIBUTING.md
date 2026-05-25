# Contributing

Thank you for considering a contribution! This project follows standard open-source conventions.

---

## Development Setup

```bash
git clone <repo-url>
cd signaling-server
npm install
cp .env.example .env
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine
# Start dev server
npm run dev
```

---

## Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run checks: `npm run type-check && npm run lint && npm run build`
5. Commit with a conventional commit message (see below)
6. Push and open a Pull Request against `main`

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add TURN server credential endpoint
fix: handle race condition in room cleanup
docs: update socket events reference
refactor: extract room state to Redis repository
chore: upgrade socket.io to 4.8
```

---

## Code Style

- TypeScript strict mode — no `any` without justification
- Prettier + ESLint enforced (`npm run lint:fix && npm run format`)
- No `console.log` — use the Winston logger
- Zod validation on all external inputs
- Keep modules decoupled — no cross-module direct imports except through the types layer

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Update relevant documentation if you change behavior
- Add or update types if you change data shapes
- Describe what you changed and why in the PR description

---

## Reporting Issues

Open a GitHub issue with:
- Node.js version
- Redis version
- Steps to reproduce
- Expected vs actual behavior
- Relevant log output

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
