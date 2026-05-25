# Frontend Contributing

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Run backend at `http://localhost:3000`.

## Workflow

1. Create branch.
2. Implement change.
3. Run checks.
4. Update docs when behavior changes.
5. Open PR.

## Quality Rules

- Keep call/signaling logic inside hooks.
- Keep rendering components stateless.
- Clean up listeners and streams on unmount.
- Avoid duplicate peer connection ownership.

## Validation

Before PR:

```bash
npm run lint
npm run build
```

Then do a manual 2-browser call test.
