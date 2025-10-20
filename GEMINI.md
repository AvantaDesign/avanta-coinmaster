# Project Overview

This project is a personal and business accounting system called Avanta Finance. It is designed for individuals with business activities in Mexico. The application helps manage financial transactions, calculate monthly taxes (ISR/IVA), handle CFDI invoices, and provides financial dashboards and reports.

## Main Technologies

*   **Frontend:** React 18, TailwindCSS, Vite
*   **Backend:** Cloudflare Workers Functions
*   **Database:** Cloudflare D1 (SQLite)
*   **Storage:** Cloudflare R2
*   **CI/CD:** GitHub Actions to Cloudflare Pages
*   **Automation:** n8n

## Architecture

The application follows a client-server architecture. The frontend is a single-page application built with React and Vite. The backend is a set of serverless functions running on Cloudflare Workers, which interact with a Cloudflare D1 database for data storage and Cloudflare R2 for file storage.

## Implementation Status

*   **Current Phase:** Phase 39 completed (Accessibility and Performance Audit)
*   **Last Implementation Plan:** V8 (Phases 30-39)
*   **Next Implementation Plan:** V9 (will start with Phase 40+)
*   **Total Phases Completed:** 35 phases (5-39)
*   **Phase Documentation:** See `PHASES_INDEX.md` for complete history
*   **Future Planning:** See `IMPLEMENTATION_ROADMAP.md` for guidance on creating V9, V10, V11+

# Building and Running

## Key Commands

*   **Install dependencies:**
    ```bash
    npm install
    ```
*   **Run development server:**
    ```bash
    npm run dev
    ```
*   **Build for production:**
    ```bash
    npm run build
    ```
*   **Deploy to Cloudflare Pages:**
    ```bash
    npm run deploy
    ```

## Development Conventions

*   The project uses `vite` for the frontend development server and build process.
*   The backend consists of Cloudflare Workers functions located in the `functions` directory.
*   The database schema is defined in `schema.sql`.
*   Cloudflare configuration is managed in `wrangler.toml`.
*   The project uses GitHub Actions for continuous integration and deployment.
