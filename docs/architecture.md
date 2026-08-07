# System Architecture Specification

## 1. Overview
The system adopts a modular architecture focused on operational simplicity. The core objective is to allow seamless field management (revenues, inventory, check-ins, and financial operations) without unnecessary bureaucracy, ensuring that administration can independently operate everything.

## 2. Technology Stack
- **Frontend (UI/UX):** React structured with Vite, styled with Tailwind CSS. Exclusively responsible for the user interface and experience.
- **Backend (Business Logic):** Node.js (Express/Fastify) operating as a REST API. Centralizes all cash-flow logic, check-in validations, and communication with external services.
- **Database & Auth:** Supabase (PostgreSQL). The database is primarily accessed by the Backend to ensure the integrity of financial rules.
- **External Integrations:** 
  - Payment gateways (e.g., Mercado Pago / Stripe) for processing upfront transactions.

## 3. Communication Patterns
- The Frontend **never** performs sensitive financial calculations or accesses gateway API secret keys.
- All data traffic passes through the Node.js API.
- API responses follow a standardized format: `{ success: boolean, data: any, error?: string }`.