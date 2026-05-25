# Backend Contributing

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Workflow

1. Create branch.
2. Implement and test.
3. Run checks:

```bash
npm run type-check
npm run lint
npm run build
```

4. Update docs for any behavior changes.
5. Open PR.

## Engineering Rules

- Validate external input with Zod.
- Keep room lifecycle and call lifecycle separate.
- Use logger, avoid ad-hoc console logs.
- Preserve socket event contract compatibility.
