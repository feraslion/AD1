import { Router } from 'express';
import productsRoutes from './products.routes.ts';
import customersRoutes from './customers.routes.ts';
import suppliersRoutes from './suppliers.routes.ts';
import salesRoutes from './sales.routes.ts';
import purchasesRoutes from './purchases.routes.ts';
import inventoryRoutes from './inventory.routes.ts';
import accountsRoutes from './accounts.routes.ts';
import accountingRoutes from './accounting.routes.ts';
import treasuryRoutes from './treasury.routes.ts';
import expensesRoutes from './expenses.routes.ts';
import currenciesRoutes from './currencies.routes.ts';
import usersRoutes from './users.routes.ts';
import reportsRoutes from './reports.routes.ts';
import systemRoutes from './system.routes.ts';
import searchRoutes from './search.routes.ts';

const router = Router();

router.use('/search', searchRoutes);
router.use('/products', productsRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/sales', salesRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/accounts', accountsRoutes);
router.use('/accounting', accountingRoutes);
router.use('/treasury', treasuryRoutes);
router.use('/expenses', expensesRoutes);
router.use('/currencies', currenciesRoutes);
router.use('/', usersRoutes);
router.use('/reports', reportsRoutes);
router.use('/system', systemRoutes);

export default router;
