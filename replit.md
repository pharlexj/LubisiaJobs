# Trans Nzoia County Public Service Board Recruitment System

## Overview
This project is a comprehensive job recruitment and application management system for the Trans Nzoia County Public Service Board. It provides a digital platform for managing job postings, applicant profiles, applications, and the entire recruitment workflow. The system supports multiple user roles, including applicants, administrators, board members, accountants, and A.I.E Holders, each with tailored interfaces and functionality to streamline the hiring process and financial management within the board. The system aims to enhance efficiency, transparency, and accountability in public service recruitment and financial operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is a React-based application using TypeScript. Key technologies include:
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing with role-based protection
- **State Management**: Zustand for global state, with persistence for authentication
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query (React Query) for server state management

### Backend Architecture
The backend is an Express.js REST API:
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Structure**: RESTful endpoints organized by feature
- **File Handling**: Multer for document uploads with validation
- **Session Management**: Express sessions with PostgreSQL storage

### Authentication & Authorization
The system uses Replit's OpenID Connect for authentication and implements role-based access control:
- **Authentication Provider**: Replit OIDC
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Authorization**: Role-based access control for five user types (applicant, admin, board, accountant, a.i.e Holder)
- **User Management**: Automatic user creation and profile management on first login

### Database Design
PostgreSQL is used with a comprehensive schema supporting recruitment and financial workflows:
- **Core Tables**: Users, Counties, Constituencies, Wards, Jobs, Applications, Departments, Designations, Awards.
- **Accounting Tables**: `votes`, `vote_accounts`, `budgets`, `allowances`, `transactions`, `master_imprest_register`, `audits` to align with legacy system structure.

### Development & Build Architecture
The project utilizes a monorepo structure:
- **Monorepo Structure**: Shared schema and types between client and server
- **Build System**: Vite for frontend bundling, ESBuild for server
- **TypeScript**: Shared configuration across modules
- **Path Aliases**: Configured for clean code organization

### Accounting Module
The accounting module provides financial management for two roles: Accountant and A.I.E Holder.
- **Accountant Features**: Claims, payments, Master Imprest Register (MIR) management, financial reports, charts, vote management, budget planning, employee records, system settings.
- **A.I.E Holder Features**: Approval workflow for financial transactions, dashboard overview, MIR and budget monitoring.
- **UI/UX**: Expandable sidebar navigation, responsive design, color-coded status indicators, search/filter, data visualization.
- **Backend**: API endpoints for managing accounting entities, document generation using `docxtemplater` for .docx templates with dynamic data and currency formatting.

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL database hosting
- **Drizzle Kit**: For schema migrations and database management

### Authentication Services
- **Replit Authentication**: OpenID Connect provider

### File Storage & Upload
- **Multer**: For handling document uploads to the local file system

### UI & Component Libraries
- **Radix UI**: Headless component primitives
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### Development & Build Tools
- **Vite**: Frontend build tool
- **ESBuild**: Server-side TypeScript compilation
- **PostCSS**: CSS processing
- **TypeScript**: Static type checking

### Data Validation & Forms
- **Zod**: Schema validation
- **React Hook Form**: Form state management
- **Drizzle Zod**: Integration for ORM and Zod schemas

### Additional Libraries
- **Date-fns**: Date manipulation
- **Class Variance Authority**: Component variant management
- **Memoizee**: Function memoization
- **docxtemplater**: .docx template processing for document generation
- **WebSocket**: Real-time communication support