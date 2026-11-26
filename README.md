# Gonçalo Silva — Portfolio

Personal portfolio website presenting my background, projects, CV, and contact information in a bilingual interface.

## Overview

The site is built as a single-page React application with dedicated sections for my academic and professional journey, selected projects, CV, and contact details. It supports Portuguese and English and includes interactive navigation and project/timeline filtering.

## Highlights

- Portuguese and English interface
- Academic and professional timeline with filtering
- Personal and professional project filtering
- Built-in CV viewer
- Responsive single-page layout
- Interactive visual effects and section-aware navigation
- Vercel Analytics integration

## Tech stack

- React 19
- TypeScript
- Vite
- CSS
- Vercel Analytics

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

## Project structure

```text
src/
├── components/       Reusable UI components
├── App.tsx           Main application and interactions
├── content.ts        Static content and CV assets
├── translations.ts   Portuguese and English copy
└── styles.css        Application styling
```

## Portfolio redesign with Codex

The project defines four roles in `.codex/agents/`. Start a Codex session in the repository and delegate with a prompt like this:

> Coordinate the portfolio redesign with `portfolio_motion_research`, `portfolio_design`, `portfolio_motion`, and `portfolio_qa`. Have research look at Bürocratik websites and QA check the current site while design reviews the layout. Use their findings to agree on one interaction to prototype. Assign files to the motion agent, integrate the prototype, then ask QA to test it in Portuguese and English with desktop, touch, keyboard, and reduced motion. Run `npm run build` after integration.

## About

This repository contains the source code for my personal portfolio website. It is designed to keep my work, experience, and projects in one place while remaining lightweight and easy to maintain.
