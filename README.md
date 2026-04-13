# DevOps Pipeline

A modern, themeable Next.js dashboard application built as a polished UI for a DevOps pipeline experience.

## Overview

This repository contains a Next.js + TypeScript application with custom design system components, a dashboard layout, theme switching, and a responsive interface.

The app is structured around reusable UI components, a dashboard overview section, and a developer-friendly workflow for building and maintaining the frontend.

## Key Features

- **Next.js 16** with **React 19** and **TypeScript**
- **Tailwind CSS 4** for utility-first styling
- **Radix UI** primitives for accessible components
- **Theme switching** and custom theme support
- **Dashboard layout** with overview charts and panels
- **Reusable components** for buttons, cards, modals, inputs, sidebar, and more
- **Command palette** powered by `kbar`
- **Charting** with `recharts`
- **Strong linting and formatting** with ESLint and Prettier

## Getting Started

### Install dependencies

```bash
bun install
```

### Start development server

```bash
bun run dev
```

Open `http://localhost:3000` in your browser.

### Build for production

```bash
bun run build
```

### Start production server

```bash
bun run start
```

## Scripts

- `bun run dev` - Start the Next.js development server
- `bun run build` - Build the application for production
- `bun run start` - Start the production server
- `bun run lint` - Run ESLint on the `src` directory
- `bun run lint:fix` - Fix lint issues and format with Prettier
- `bun run lint:strict` - Run ESLint with zero warnings allowed
- `bun run format` - Format project files with Prettier
- `bun run format:check` - Check formatting with Prettier

## Project Structure

- `src/app/` - Next.js app routes, layouts, and pages
- `src/components/` - Shared UI components and design system primitives
- `src/features/` - Feature-specific UI and data-fetching logic
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility helpers
- `src/styles/` - Global CSS and theme definitions
- `src/types/` - Shared TypeScript types

## UI & Theme Support

The app includes a theme system with support for multiple theme presets and a theme selector component. The UI uses Radix primitives and custom components for consistent styling across the app.

## Contributing

This repository includes Husky and lint-staged to enforce formatting and linting on commit.

- Ensure code is formatted before committing: `npm run format`
- Run linting before pushing changes: `npm run lint`

## Notes

- The app is configured as a private package in `package.json`.
- The component library uses `class-variance-authority`, `clsx`, and Tailwind utility classes for styling.
- `sonner` is used for toast notifications and user feedback.

## License

This repository does not include a license file. Add one if you want to open source the project.
