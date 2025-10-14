# Project Overview

This project is a personal and business accounting system for a freelancer in Mexico. It is a web application built with React, TailwindCSS, and Vite for the frontend, and Cloudflare Workers, D1, and R2 for the backend. The application allows the user to manage their personal and business transactions, calculate their monthly taxes (ISR and IVA), manage their CFDI invoices, and view financial dashboards.

# Building and Running

## Key Commands

*   **`npm install`**: Installs the project dependencies.
*   **`npm run dev`**: Starts the Vite development server for the frontend.
*   **`npx wrangler pages dev dist`**: Starts a local development server that includes the Cloudflare Workers backend.
*   **`npm run build`**: Builds the frontend for production.
*   **`npm run deploy`**: Builds and deploys the application to Cloudflare Pages.

## Development Conventions

*   The project uses `react-router-dom` for routing.
*   The project uses a utility file (`src/utils/api.js`) to make API calls to the backend.
*   The backend is built with Cloudflare Workers Functions and uses Cloudflare D1 for the database and Cloudflare R2 for file storage.
*   The database schema is defined in `schema.sql`.
*   The project includes a comprehensive test suite.
*   The project uses GitHub Actions for continuous integration and deployment.
