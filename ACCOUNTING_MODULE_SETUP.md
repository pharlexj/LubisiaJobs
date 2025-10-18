# Accounting Module Setup Guide

## ✅ What's Been Completed

### 1. Database Schema (4 Tables)
- ✅ **vote_accounts** - Budget vote codes with allocation tracking
- ✅ **budgets** - Department budget allocations
- ✅ **transactions** - Claims and payments with approval workflow
- ✅ **master_imprest_register** - Imprest advances and retirements

### 2. Backend API (24 Endpoints)
All endpoints are fully functional with role-based access control:

**Accountant Routes** (`/api/accountant/*`):
- GET /claims
- GET /payments
- GET /mir
- GET /votes
- GET /budgets
- GET /budget (summary)
- GET /employees

**A.I.E Holder Routes** (`/api/aie/*`):
- GET /stats (dashboard statistics)
- GET /requests (approval requests)
- GET /mir (overview)

**Core Accounting Routes** (`/api/accounting/*`):
- GET/POST /vote-accounts
- GET/POST /budgets
- GET /transactions
- POST /transactions/claim
- POST /transactions/payment
- PATCH /transactions/:id/approve
- PATCH /transactions/:id/reject
- GET/POST /mir
- PATCH /mir/:id/retire
- GET /employees

### 3. Frontend Pages
All pages are connected to backend APIs:
- ✅ Claims Management
- ✅ Payment Processing
- ✅ Master Imprest Register (MIR)
- ✅ Vote Management
- ✅ Budget Planning
- ✅ Employee Records
- ✅ A.I.E Holder Dashboard
- ✅ Approval Requests

### 4. Document Generation System
- ✅ Installed `docxtemplater` package
- ✅ Created `DocumentGenerator` utility class
- ✅ Currency formatting (KSh)
- ✅ Amount-to-words conversion
- ✅ Date formatting
- ✅ Financial year calculation

---

## 📋 What You Need To Do

### Create .docx Template Files

You need to create **2 Microsoft Word documents** in the `public/templates/` folder:

#### 1. Claim Template (`public/templates/claim.docx`)

This template is used to generate claim documents. Create a professional Word document with the following structure:

**Header:**
```
TRANS NZOIA COUNTY PUBLIC SERVICE BOARD
CLAIM FORM
```

**Body (use these variables):**
- `{txtname}` - Employee name
- `{txtdesignation}` - Employee designation
- `{txtjg}` - Job group
- `{txtdate_travel}` - Travel date
- `{txtdate_return}` - Return date
- `{txtdestination}` - Travel destination
- `{txtdays}` - Number of days
- `{txtamount}` - Claim amount (formatted as KSh 10,000.00)
- `{txtamount_in_words}` - Amount in words (e.g., "Ten Thousand Shillings Only")
- `{txtvote}` - Vote code
- `{txtvoucher}` - Voucher number
- `{txtparticulars}` - Claim particulars/description
- `{txtbus}` - Bus fare
- `{txttaxi}` - Taxi fare
- `{txtperdiem}` - Per diem amount
- `{txtsubsistence}` - Subsistence allowance
- `{txtfy}` - Fiscal year (e.g., "2024/2025")
- `{txtdate}` - Current date

**Example Layout:**
```
Claim Form

Employee Name: {txtname}
Designation: {txtdesignation}
Job Group: {txtjg}

Travel Details:
- Destination: {txtdestination}
- Travel Date: {txtdate_travel}
- Return Date: {txtdate_return}
- Duration: {txtdays} days

Financial Details:
- Amount: {txtamount}
- Amount in Words: {txtamount_in_words}
- Vote Code: {txtvote}
- Voucher No: {txtvoucher}

Breakdown:
- Bus Fare: {txtbus}
- Taxi Fare: {txttaxi}
- Per Diem: {txtperdiem}
- Subsistence: {txtsubsistence}

Total Claim: {txtamount}

Fiscal Year: {txtfy}
Date: {txtdate}

_______________________
Employee Signature

_______________________
Authorized By
```

#### 2. Payment Template (`public/templates/payment.docx`)

This template is used to generate payment vouchers:

**Header:**
```
TRANS NZOIA COUNTY PUBLIC SERVICE BOARD
PAYMENT VOUCHER
```

**Body (use these variables):**
- `{txtname}` - Payee name
- `{txtdated}` - Payment date
- `{txtamount}` - Payment amount (formatted as KSh)
- `{txtamount_in_words}` - Amount in words
- `{txtvote}` - Vote code
- `{txtvoucher}` - Voucher number
- `{txtparticulars}` - Payment description
- `{txtdepartment}` - Department name
- `{txtfy}` - Fiscal year
- `{txtallocation}` - Budget allocation
- `{txttotal_balance}` - Remaining balance

**Example Layout:**
```
Payment Voucher

Voucher No: {txtvoucher}
Date: {txtdated}
Fiscal Year: {txtfy}

Pay To: {txtname}
Department: {txtdepartment}

Amount: {txtamount}
Amount in Words: {txtamount_in_words}

Particulars:
{txtparticulars}

Budget Details:
- Vote Code: {txtvote}
- Allocation: {txtallocation}
- Balance: {txttotal_balance}

_______________________          _______________________
Prepared By                      Approved By

_______________________          _______________________
Accountant                       A.I.E Holder
```

---

## 🎯 How to Create Templates

### Option 1: Using Microsoft Word
1. Create a new Word document
2. Design your layout (add headers, tables, formatting)
3. Insert variables using `{variableName}` syntax
4. Save as `.docx` format
5. Place in `public/templates/` folder

### Option 2: Using Google Docs
1. Create your document in Google Docs
2. Add variables using `{variableName}`
3. Download as Microsoft Word (.docx)
4. Place in `public/templates/` folder

### Important Notes:
- ✅ Use curly braces for variables: `{txtname}` not `txtname`
- ✅ Variables are case-sensitive
- ✅ You can format the text around variables (bold, italic, etc.)
- ✅ The variable placeholders will be replaced with actual values
- ✅ Add your organization logo and official formatting

---

## 🚀 Testing the Module

Once templates are created:

1. **Log in as Accountant** (role: `accountant`)
   - Navigate to Claims page
   - Click "New Claim"
   - Fill in the form
   - Submit to generate Word document

2. **Log in as A.I.E Holder** (role: `a.i.e Holder`)
   - Navigate to Approval Requests
   - Review pending transactions
   - Approve or reject

3. **Test Document Generation**
   - Create a claim or payment
   - Check `public/exports/` folder for generated .docx file
   - Open file to verify all variables are replaced

---

## 📊 API Usage Examples

### Create a Claim
```javascript
POST /api/accounting/transactions/claim
{
  "payeeName": "John Doe",
  "amount": 15000,
  "description": "Travel claim for Nairobi workshop",
  "voteCode": "210501",
  "voucherNo": "CLM/2024/001",
  "transactionType": "claim"
}
```

### Approve Transaction
```javascript
PATCH /api/accounting/transactions/123/approve
{
  "approvedBy": "Jane Smith"
}
```

### Create Vote Account
```javascript
POST /api/accounting/vote-accounts
{
  "code": "210501",
  "description": "Travel and Transport",
  "allocatedAmount": 500000,
  "fiscalYear": "2024/2025"
}
```

---

## 📁 File Structure

```
project/
├── public/
│   ├── templates/           # ← Create templates here
│   │   ├── claim.docx      # ← Claim template
│   │   └── payment.docx    # ← Payment template
│   └── exports/             # Generated documents saved here
├── server/
│   ├── utils/
│   │   └── documentGenerator.ts  # Document generation logic
│   ├── routes.ts            # API endpoints
│   └── storage.ts           # Database operations
└── shared/
    └── schema.ts            # Database schema
```

---

## ✨ Features Available

### For Accountants:
- ✅ Create and manage claims
- ✅ Process payment vouchers
- ✅ Track Master Imprest Register
- ✅ Manage vote accounts
- ✅ Monitor budget utilization
- ✅ Maintain employee financial records
- ✅ Generate financial documents

### For A.I.E Holders:
- ✅ Review approval requests
- ✅ Approve/reject transactions
- ✅ Monitor budget spending
- ✅ Track MIR outstanding balances
- ✅ View dashboard statistics

---

## 🔐 Role-Based Access

All accounting endpoints are protected:
- **Accountant role** - Full access to all accounting operations
- **A.I.E Holder role** - Approval and oversight functions
- **Admin role** - Can access accountant endpoints

---

## 🎉 Summary

The accounting module is **fully functional** and ready to use! 

**Next Step:** Create the 2 .docx template files in `public/templates/` and you're all set!

After creating templates, the system can:
- Generate professional claim documents
- Generate payment vouchers
- Track all financial transactions
- Manage approvals workflow
- Monitor budget utilization
- Generate financial reports

All data is stored in PostgreSQL and accessible through the API endpoints.
