import { Router } from 'express';
import productsRouter from './products.ts';
import currenciesRouter from './currencies.ts';
import customersRouter from './customers.ts';
import salesRouter from './sales.ts';
import expensesRouter from './expenses.ts';
import accountingRouter from './accounting.ts';
import usersRouter from './users.ts';
import treasuryRouter from './treasury.ts';
import reportsRouter from './reports.ts';
import purchasesRouter from './purchases.ts';
import paymentsRouter from './payments.ts';

const apiRouter = Router();

// Mount domain routes directly (since they expect paths under /api/* e.g. /products, /customers, etc.)
apiRouter.use('/', productsRouter);
apiRouter.use('/', currenciesRouter);
apiRouter.use('/', customersRouter);
apiRouter.use('/', salesRouter);
apiRouter.use('/', expensesRouter);
apiRouter.use('/', accountingRouter);
apiRouter.use('/', usersRouter);
apiRouter.use('/', treasuryRouter);
apiRouter.use('/', reportsRouter);
apiRouter.use('/', purchasesRouter);
apiRouter.use('/', paymentsRouter);

export default apiRouter;
