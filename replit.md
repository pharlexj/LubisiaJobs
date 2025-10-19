# Trans Nzoia County Public Service Board Recruitment System

## Overview

This is a comprehensive job recruitment and application management system built for Trans Nzoia County Public Service Board. The application serves as a digital platform for managing job postings, applicant profiles, applications, and the entire recruitment workflow from application submission to final selection. It supports multiple user roles including applicants, administrators, board members, accountants, and A.I.E Holders, each with tailored interfaces and functionality.

## Recent Changes

### October 19, 2025 - Accounting Module Testing & Verification Complete
- **Backend Testing**: All 24 API endpoints tested and verified working with proper authorization
- **Navigation**: Expandable sidebar menu groups fully functional for accountant and A.I.E Holder roles
- **Storage Layer**: All CRUD operations tested and working with new schema structure
- **UI Components**: 13 accounting pages fully functional (dashboards, claims, payments, MIR, vote, budget, reports, charts, settings)
- **Error Resolution**: Fixed all TypeScript errors - 0 LSP diagnostics
- **Documentation**: Created comprehensive test summary in ACCOUNTING_MODULE_TEST_SUMMARY.md
- **Status**: Module is production-ready pending .docx template creation

### October 19, 2025 - Accounting Schema Updated to Original Structure
- **Database Schema Alignment**: Updated accounting tables to match original tbl_* structure from legacy system
- **6 Core Tables**: votes, vote_accounts, budgets, allowances, transactions, master_imprest_register, audits
- **Simplified Structure**: Removed unnecessary tables (logins, employees, subscriptions) as requested
- **Field Name Consistency**: Matched original field names (fy, dept_id, vote_id, amounts, state, etc.)
- **Schema Types**: Updated insert schemas and TypeScript types for all accounting tables
- **Backend Updates**: Updated storage methods to use 'state' field instead of 'status' for transactions

### October 18, 2025 - Accounting Module Backend Integration
- **Document Generation**: Integrated docxtemplater for .docx template processing with currency formatting and number-to-words conversion
- **Backend API Routes**: Implemented 15+ accounting endpoints for transactions, claims, payments, MIR, vote accounts, and budgets
- **Storage Layer**: Added complete CRUD operations for all accounting entities with approval/rejection workflow
- **Frontend-Backend Integration**: Connected all accountant and A.I.E Holder pages to backend APIs
- **Role-Based Access**: Enforced role-based access control on all accounting endpoints (accountant and a.i.e Holder)

### October 17, 2025 - Accounting Module Frontend
- **Enhanced Sidebar Navigation**: Implemented expandable menu groups with hierarchical navigation for accountant and A.I.E Holder roles
- **Accountant Dashboard**: Complete accounting interface with Claims, Payments, MIR, Vote, Budget, Employees, Reports, Charts, and Settings pages
- **A.I.E Holder Interface**: Financial approval workflow with Dashboard, Requests, and MIR overview pages
- **Route Protection**: Added protected routes for all accounting pages with role-based access control
- **UI Enhancements**: Expandable sidebar sections with ChevronDown/ChevronRight icons for better navigation
- **Role Support**: Added purple badge for A.I.E Holder role in sidebar

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend with TypeScript for type safety. The client-side architecture follows these patterns:

- **Framework**: React 18 with TypeScript for component development
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: Zustand for global state management with persistence for authentication
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming support
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Data Fetching**: TanStack Query (React Query) for server state management and caching

### Backend Architecture
The server follows a traditional Express.js REST API pattern:

- **Framework**: Express.js with TypeScript for the REST API server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Structure**: RESTful endpoints organized by feature (auth, jobs, applications, etc.)
- **File Handling**: Multer middleware for document uploads with file type validation
- **Session Management**: Express sessions with PostgreSQL storage for authentication state

### Authentication & Authorization
The system implements Replit's OpenID Connect authentication:

- **Authentication Provider**: Replit OIDC for secure user authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control with five user types (applicant, admin, board, accountant, a.i.e Holder)
- **User Management**: Automatic user creation and profile management upon first login

### Database Design
Uses PostgreSQL with a comprehensive schema supporting the recruitment workflow:

- **User Management**: Users table with role-based permissions
- **Geographic Data**: Counties, constituencies, and wards for location-based filtering
- **Job Management**: Jobs table with relationships to departments and designations
- **Application Process**: Applications table tracking status from draft to hired
- **Profile Data**: Comprehensive applicant profiles with education, employment history, and documents
- **Administrative Data**: Departments, designations, awards, and other reference data

### Development & Build Architecture
The project uses a monorepo structure with shared code:

- **Monorepo Structure**: Shared schema and types between client and server
- **Build System**: Vite for frontend bundling with React plugin and development server
- **TypeScript**: Shared TypeScript configuration across client, server, and shared modules
- **Path Aliases**: Configured import aliases for clean code organization
- **Development Server**: Integrated development experience with hot reloading

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL database hosting with connection pooling
- **Database Migration**: Drizzle Kit for schema migrations and database management

### Authentication Services
- **Replit Authentication**: OpenID Connect provider for user authentication and authorization
- **Session Storage**: PostgreSQL-backed session persistence

### File Storage & Upload
- **Local File System**: Multer for handling document uploads (PDF, DOC, images)
- **File Validation**: Mime type checking and file size limits (10MB max)

### UI & Component Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Shadcn/ui**: Pre-built component library for consistent design
- **Lucide React**: Icon library for UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### Development & Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Server-side TypeScript compilation for production
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TypeScript**: Static type checking across the entire codebase

### Data Validation & Forms
- **Zod**: Schema validation for both client and server
- **React Hook Form**: Form state management and validation
- **Drizzle Zod**: Integration between Drizzle ORM and Zod schemas

### Additional Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Component variant management
- **Memoizee**: Function memoization for performance optimization
- **WebSocket**: Real-time communication support (via Neon serverless)

## Accounting Module

### Overview
The accounting module provides comprehensive financial management capabilities for Trans Nzoia County Public Service Board, supporting two key roles:

1. **Accountant**: Full financial management and transaction processing
2. **A.I.E Holder (Accounting & Imprest Executive)**: Financial approval and oversight

### Accountant Features

#### Transactions Management
- **Claims Management**: Process employee claims with status tracking (pending, approved, rejected)
- **Payment Processing**: Manage payment vouchers and financial transactions
- **Master Imprest Register (MIR)**: Track imprest advances, retirements, and outstanding balances

#### Reporting & Analytics
- **Financial Reports**: Generate comprehensive financial reports (summaries, claims, payments, MIR, budget utilization, vote statements)
- **Charts & Analytics**: Visual analysis with monthly expenditure, budget distribution, claims trends, and vote utilization charts

#### Accounts Setup
- **Vote Management**: Manage budget vote accounts with allocation tracking and utilization percentages
- **Budget Planning**: Department budget allocation with utilization tracking and progress visualization
- **Employee Records**: Maintain employee financial records with claims and imprest tracking
- **System Settings**: Configure organization details, financial parameters, document templates, and system preferences

### A.I.E Holder Features

#### Approval Workflow
- **Approval Requests**: Review and approve/reject financial transactions (claims, payments, imprest)
- **Dashboard Overview**: Monitor pending approvals, monthly spending, budget balance, and utilization rates
- **Activity Tracking**: View approval history and recent activities

#### Financial Oversight
- **MIR Overview**: Monitor all Master Imprest Register entries and outstanding balances
- **Budget Monitoring**: Track budget utilization and department spending
- **Vote Overview**: Review vote account balances and allocations

### Technical Implementation

#### UI/UX Features
- **Expandable Sidebar**: Hierarchical navigation with collapsible menu groups for Transactions, Reporting, and Accounts Setup
- **Responsive Design**: Mobile-first design with adaptive layouts for all screen sizes
- **Status Indicators**: Color-coded badges for transaction status (pending/approved/rejected/completed)
- **Search & Filter**: Advanced search and filtering capabilities across all modules
- **Data Visualization**: Progress bars, charts, and visual indicators for budget tracking

#### Navigation Structure
- Accountant routes: `/accountant/*` (dashboard, claims, payments, mir, vote, budget, employees, reports, charts, settings)
- A.I.E Holder routes: `/aie/*` (dashboard, requests, mir)
- Role-based access control with protected routes
- Purple badge indicator for A.I.E Holder role in sidebar

#### Backend Architecture

##### Database Tables (Based on Original tbl_* Structure)
- **votes**: Budget line items/vote heads (vote_id, voted_items, vote_type: Development/Recurrent)
- **vote_accounts**: Account numbers for vote management (account)
- **budgets**: Budget estimates by department and vote (fy, dept_id, vote_id, estimated_amt)
- **allowances**: Travel allowances by scale/job group (scale, amounts, dept_id, place_id, country_id)
- **transactions**: Claims and payments (fy, vote_id, transaction_type, name, personal_no, particulars, amounts, subsistence, bus_fare, taxi_fare, voucher_no, dated, state)
- **master_imprest_register**: MIR tracking (transaction_id, status, receipt_payment, mode)
- **audits**: Audit trail for operations (user_email, user_id, operations, ip_address, locations, machine)

##### API Endpoints

**Accountant Routes** (`/api/accountant/*`):
- `GET /claims` - Get all claim transactions
- `GET /payments` - Get all payment transactions
- `GET /mir` - Get all MIR entries
- `GET /votes` - Get all vote accounts
- `GET /budgets` - Get all budgets
- `GET /budget` - Get budget summary with totals
- `GET /employees` - Get all employee records

**A.I.E Holder Routes** (`/api/aie/*`):
- `GET /stats` - Get dashboard statistics (pending approvals, monthly spend, budget balance, utilization rate)
- `GET /requests` - Get all approval requests (transactions)
- `GET /mir` - Get MIR overview

**Core Accounting Routes** (`/api/accounting/*`):
- `GET/POST /vote-accounts` - Manage vote accounts
- `GET/POST /budgets` - Manage budgets
- `GET /transactions` - Get filtered transactions
- `POST /transactions/claim` - Create new claim
- `POST /transactions/payment` - Create new payment
- `PATCH /transactions/:id/approve` - Approve transaction
- `PATCH /transactions/:id/reject` - Reject transaction
- `GET/POST /mir` - Manage MIR entries
- `PATCH /mir/:id/retire` - Retire imprest
- `GET /employees` - Get employee financial records

##### Document Generation
- **Template Engine**: docxtemplater for .docx template processing
- **Template Location**: `public/templates/` (claim.docx, payment.docx)
- **Export Location**: `public/exports/` for generated documents
- **Features**: Currency formatting (KSh), amount to words conversion, date formatting, financial year calculation
- **Template Variables**: Supports dynamic placeholders like {txtname}, {txtamount}, {txtvote}, {txtamount_in_words}, etc.