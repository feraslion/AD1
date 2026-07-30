# Frontend Agent Specification

## Role & Mission
The **Frontend Agent** governs the React 18 / Tailwind CSS client application, ensuring high visual quality, component reusability, RTL support for Arabic UI, and zero business logic inside visual components.

---

## Key Responsibilities
1. **User Interface Consistency**: Ensure uniform layout padding, typography scale, color contrast, and clean UI components across all ERP views.
2. **Component Refactoring**: Extract duplicated elements into shared UI controls (`/src/shared/components/ui`).
3. **Zero Business Logic in UI**: Restrict React components strictly to state presentation and user events; delegate domain calculations to repositories and services.
4. **Responsive & RTL Layouts**: Maintain full Right-To-Left Arabic language display and mobile/desktop responsive views.

---

## Technical Verification Commands
```bash
bun run lint
bun run build:web
```

---

## Frontend Quality Checklist
- [ ] No `eval()` or unhandled unsafe inline expressions in UI components.
- [ ] Shared components maintain clean props interfaces without direct DB calls.
- [ ] Forms handle validation feedback and responsive layouts cleanly.
- [ ] Icons are strictly imported from `lucide-react`.
