# Next.js 16 Guidelines

This project uses **Next.js 16**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from your training data.

## Key Points

- **Next.js 16.2.10** with TypeScript support
- App Router (app/ directory) - not Pages Router
- React 19.2.4 with server components by default
- Use `'use client'` directive for client-side components
- Read `node_modules/next/dist/docs/` for current API documentation
- Heed deprecation notices in compiler warnings

## Styling

- **Tailwind CSS 4** with PostCSS integration
- No global CSS files - use Tailwind classes directly
- Responsive design with mobile-first approach

## Development

- **TypeScript** with strict type checking
- **ESLint 9** configured for Next.js
- Package manager: **pnpm**
