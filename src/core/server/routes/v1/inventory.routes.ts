import { Router } from 'express';
import { InventoryRepository } from '../../../repositories/InventoryRepository.ts';
import { authorize } from '../../middleware/rbac.ts';

const router = Router();

// Warehouses
router.get('/warehouses', async (req, res, next) => {
  try {
    const list = await InventoryRepository.getWarehouses();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/warehouses', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const result = await InventoryRepository.upsertWarehouse(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.delete('/warehouses/:id', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const result = await InventoryRepository.deleteWarehouse(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Stock Moves
router.get('/stock-moves', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const { productId, warehouseId, type } = req.query;
    const moves = await InventoryRepository.getStockMoves(
      productId as string,
      warehouseId as string,
      type as string
    );
    res.json({ success: true, data: moves });
  } catch (err) {
    next(err);
  }
});

router.post('/stock-moves/manual', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const result = await InventoryRepository.recordManualStockMove(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/stock-moves/transfer', authorize(['manager', 'inventory']), async (req, res, next) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    const result = await InventoryRepository.transferStock(productId, fromWarehouseId, toWarehouseId, parseFloat(quantity), notes);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/stock-moves/adjustment', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const { productId, warehouseId, actualQuantity, notes } = req.body;
    const result = await InventoryRepository.adjustPhysicalStock(productId, warehouseId, parseFloat(actualQuantity), notes);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/ledger/:productId', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const ledger = await InventoryRepository.getProductStockLedger(req.params.productId);
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});

router.get('/valuation', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const method = (req.query.method === 'fifo' ? 'fifo' : 'average') as 'average' | 'fifo';
    const valuation = await InventoryRepository.getInventoryValuation(method);
    res.json({ success: true, data: valuation });
  } catch (err) {
    next(err);
  }
});

router.get('/low-stock', authorize(['manager', 'inventory', 'accountant']), async (req, res, next) => {
  try {
    const alerts = await InventoryRepository.getLowStockAlerts();
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

export default router;
