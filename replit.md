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
- **Authorization**: Role-based access control for 14 user types
  - **Core Roles**: applicant, admin, board, accountant
  - **Management Roles**: records, procurement, hod, a.i.e Holder
  - **RMS Roles**: recordsOfficer, boardSecretary, chiefOfficer, boardChair, boardCommittee, HR
- **User Management**: Automatic user creation and profile management on first login
- **Role Assignment**: Admin interface with dynamic role dropdown fetching all available roles from `/api/admin/roles` endpoint

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

### Records Management System (RMS) Module
The Records Management System provides comprehensive document tracking and workflow management for the Trans Nzoia County Public Service Board, with Board Secretary as the central workflow coordinator.

**User Roles**:
- **Records Officer**: Document intake, registration, and dispatch
- **Board Secretary**: Central workflow coordinator - receives, reviews, routes, and manages agenda
- **Board Chairperson**: Executive review with decision-making authority (Approve/Reject/Defer)
- **Chief Officer**: Decision input and oversight (role defined but not actively used in current workflow)
- **Board Committee**: Collaborative review and position recommendations
- **HR Office**: Committee coordination bridge between Board Secretary and Committee

**Key Features**:
- **Document Registry**: Central repository for all incoming documents with metadata tracking (reference number, subject, department, priority, type)
- **PDF Document Preview**: All RMS roles can preview attached PDF documents using integrated DocumentViewer component with zoom, rotate, and pagination
- **Workflow Tracking**: Complete audit trail of document movement with status transitions and role-specific actions
- **Electronic Comments**: Role-based commenting system with required commentType field (remark, recommendation, decision, note)
- **Priority Management**: Urgent, high, normal, and low priority classification
- **File Attachments**: Upload and store PDF/DOC documents securely
- **Status Visualization**: Real-time dashboard with document statistics and workflow progress
- **Dispatch Mechanism**: Automated communication of board decisions back to initiating departments

**Database Tables**:
- `rms_documents`: Main document registry with full metadata
- `rms_comments`: Comments and remarks with role attribution and required commentType field
- `rms_workflow_log`: Complete audit trail with fromStatus and toStatus tracking

**Document Workflow** (Board Secretary as Central Hub):
1. **Records Officer** registers document (received) → forwards to Board Secretary (forwarded_to_secretary)
2. **Board Secretary** reviews → forwards to Board Chair (sent_to_chair)
3. **Board Chair** reviews with PDF preview → makes decision → returns to Board Secretary (returned_to_secretary_from_chair)
4. **Board Secretary** receives from Chair → forwards to HR Office (sent_to_hr)
5. **HR Office** forwards to Board Committee (sent_to_committee)
6. **Board Committee** reviews collaboratively → returns to HR (returned_to_hr_from_committee)
7. **HR Office** receives from Committee → returns to Board Secretary (returned_to_secretary_from_hr)
8. **Board Secretary** sets agenda → schedules meeting → forwards to Records Officer (sent_to_records)
9. **Records Officer** dispatches final decision to initiating department (dispatched) → files (filed)

**New Workflow Statuses** (as of October 2025):
- `returned_to_secretary_from_chair`: Document returned from Chair to Board Secretary
- `returned_to_hr_from_committee`: Document returned from Committee to HR Office
- `returned_to_secretary_from_hr`: Document returned from HR to Board Secretary after committee review
- `sent_to_records`: Document sent from Board Secretary to Records Officer for final dispatch

**UI/UX**: Role-specific gradient themes (Secretary: teal, Chair: purple, HR: indigo, Committee: purple, Records: teal), tabbed interfaces for multi-path workflows, responsive layouts, role-based access control, real-time statistics dashboard, proper data-testid attributes for testing, consistent DocumentViewer integration across all roles.