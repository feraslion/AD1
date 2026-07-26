import { Router } from 'express';
import { ProductService } from '../../../services/ProductService.ts';
import { authorize } from '../../middleware/rbac.ts';
import { validateRequest } from '../../middleware/validator.ts';

const router = Router();

// GET /api/v1/products
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, category, search, companyId, branchId } = req.query;
    const result: any = await ProductService.getAllProducts({
      category: category as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      companyId: companyId as string,
      branchId: branchId as string
    });
    const data = Array.isArray(result) ? result : result.items;
    const pagination = Array.isArray(result) ? undefined : result.pagination;
    res.json({ success: true, data, pagination });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/:id/history
router.get('/:id/history', async (req, res, next) => {
  try {
    const history = await ProductService.getProductHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/products
router.post(
  '/',
  authorize(['manager', 'inventory']),
  validateRequest({
    body: [
      { field: 'name', required: true, type: 'string', minLength: 2 },
      { field: 'barcode', required: true, type: 'string' },
      { field: 'category', required: true, type: 'string' },
      { field: 'unit', required: true, type: 'string' }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await ProductService.saveProduct(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/products/:id
router.delete('/:id', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const result = await ProductService.deleteProduct(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
