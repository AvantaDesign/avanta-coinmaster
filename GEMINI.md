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

*   **Current Phase:** Phase 46 - Integration Testing & Quality Assurance
*   **Current Implementation Plan:** V9 (Phases 40-60) - ACTIVE
*   **Progress:** 6/21 phases complete (Phases 40-45 ✅, Phase 46 🔄)
*   **Total Phases Completed:** 40 phases (5-45)
*   **Phase Documentation:** See `PHASES_INDEX.md` for complete history
*   **Current Plan:** See `IMPLEMENTATION_PLAN_V9.md` for V9 details
*   **Database Management:** See `DATABASE_TRACKING_SYSTEM.md` for database system
*   **AI Agent Rules:** See `.cursorrules` for development guidelines

## Current Project State

*   **React Components:** 114+ reusable components
*   **API Endpoints:** 78+ RESTful endpoints
*   **Database Tables:** 43 tables with full relationships
*   **Database Views:** 7 optimized views
*   **Migration Files:** 51 database migrations
*   **Documentation Files:** 100+ comprehensive guides
*   **Total Lines of Code:** 50,000+ lines (200+ files)

## Database Management

*   **Database Health Monitoring:** Comprehensive system for tracking all tables and views
*   **Migration System:** 51 migration files for database evolution
*   **Schema Validation:** Automated checks for 43 tables + 7 views
*   **Health Endpoints:** `/api/health` for database connectivity
*   **Tracking System:** `DATABASE_TRACKING_SYSTEM.md` for complete database management

## Development Guidelines

*   **AI Agent Rules:** `.cursorrules` contains comprehensive development guidelines
*   **Database-First Development:** Always verify database requirements before coding
*   **Documentation-First Process:** Always update documentation when adding features
*   **Implementation Plan Context:** Always follow V9 phase context
*   **Quality Assurance:** Comprehensive testing and validation requirements

## Current Phase Focus (Phase 46)

*   **Database Health & Schema Testing:** Comprehensive database health check API endpoint
*   **Schema Validation Tests:** 43 tables + 7 views validation
*   **Migration Status Verification:** Automated migration status checks
*   **Data Integrity Tests:** Foreign keys and constraints validation
*   **Database Performance Monitoring:** Query execution monitoring
*   **Automated Database Health Alerts:** Real-time health monitoring
*   **Database Backup/Restore Verification:** Backup system testing

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
*   The database schema is defined in `schema.sql` with 43 tables and 7 views.
*   Database migrations are managed through 46 migration files in the `migrations` directory.
*   Cloudflare configuration is managed in `wrangler.toml`.
*   The project uses GitHub Actions for continuous integration and deployment.
*   **Database-First Development:** Always check `DATABASE_TRACKING_SYSTEM.md` before development.
*   **Documentation-First Process:** Always update documentation when adding features.
*   **Implementation Plan Context:** Always follow V9 phase context from `IMPLEMENTATION_PLAN_V9.md`.
*   **AI Agent Guidelines:** Follow rules in `.cursorrules` for consistent development.
