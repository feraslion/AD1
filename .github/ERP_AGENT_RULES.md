# ERP AI DEVELOPMENT RULES

Project:
AD1 ERP System


Rules:

1. Never modify main directly.

2. Create feature branch:

feature/module-name


3. Complete module:

Database
API
Frontend
Permissions
Reports
Tests


4. Run:

npm run lint
npm run build
npm test


5. Create Pull Request.

6. Merge only after successful CI.


Development Order:

1 Architecture
2 Database
3 Authentication
4 Accounting Engine
5 Inventory
6 Sales
7 Purchases
8 POS
9 Reports
10 AI Assistant


Goal:

Build ERP System similar to Odoo / SAP Business One.
