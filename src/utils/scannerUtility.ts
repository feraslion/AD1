import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem } from '../types';
import { playScannerSound } from './audio';

export interface ScanLogEntry {
  id: string;
  barcode: string;
  timestamp: Date;
  status: 'success' | 'incremented' | 'error' | 'not_found' | 'out_of_stock';
  productName?: string;
  message: string;
}

export interface ScannerConfig {
  timingThresholdMs: number; // Max time between keystrokes to detect scanner (default 50ms)
  scalePrefix: string;       // Prefix for electronic scale barcodes (default '20')
  autoIncrement: boolean;    // Automatically increment cart item quantity if already present
  enableSound: boolean;      // Play sound on scan success/error
  ignoreInInputFields: boolean; // Ignore keystrokes when typing in text inputs
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  timingThresholdMs: 60,
  scalePrefix: '20',
  autoIncrement: true,
  enableSound: true,
  ignoreInInputFields: true
};

export interface ScaleBarcodeInfo {
  isScaleBarcode: boolean;
  itemCode?: string;
  weightKg?: number;
  priceHalala?: number;
}

/**
 * Parses electronic scale EAN-13 barcodes.
 * Standard Format (13 digits starting with prefix, e.g. 20XXXXXYYYYYZ):
 * - Prefix (2 digits, e.g., '20')
 * - Item Code (5 digits)
 * - Weight in grams or total price in halala (5 digits)
 * - Check digit (1 digit)
 */
export function parseScaleBarcode(barcode: string, scalePrefix: string = '20'): ScaleBarcodeInfo {
  const cleanBarcode = barcode.trim();
  if (cleanBarcode.length === 13 && cleanBarcode.startsWith(scalePrefix)) {
    const itemCode = cleanBarcode.substring(2, 7);
    const valuePart = parseInt(cleanBarcode.substring(7, 12), 10);
    // Assume valuePart is weight in grams (e.g. 01250 -> 1.250 kg)
    const weightKg = valuePart / 1000;
    return {
      isScaleBarcode: true,
      itemCode,
      weightKg: weightKg > 0 ? weightKg : 1
    };
  }
  return { isScaleBarcode: false };
}

export interface UseBarcodeScannerOptions {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onScanMessage?: (message: string, type: 'success' | 'error' | 'info') => void;
  config?: Partial<ScannerConfig>;
}

export function useBarcodeScanner({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onScanMessage,
  config: userConfig
}: UseBarcodeScannerOptions) {
  const [config, setConfig] = useState<ScannerConfig>({
    ...DEFAULT_SCANNER_CONFIG,
    ...userConfig
  });

  const [scanHistory, setScanHistory] = useState<ScanLogEntry[]>([]);
  const [isScannerConnected, setIsScannerConnected] = useState<boolean>(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const addLog = useCallback((barcode: string, status: ScanLogEntry['status'], message: string, productName?: string) => {
    const newEntry: ScanLogEntry = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      barcode,
      timestamp: new Date(),
      status,
      productName,
      message
    };
    setScanHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 scans
  }, []);

  const processBarcode = useCallback((barcodeRaw: string) => {
    const barcode = barcodeRaw.trim();
    if (!barcode) return;

    setLastScannedBarcode(barcode);

    // 1. Check for scale barcode
    const scaleInfo = parseScaleBarcode(barcode, config.scalePrefix);
    if (scaleInfo.isScaleBarcode && scaleInfo.itemCode) {
      const prod = products.find(p => p.barcode === scaleInfo.itemCode || p.barcode.endsWith(scaleInfo.itemCode));
      if (prod) {
        const weight = scaleInfo.weightKg || 1;
        onAddToCart(prod, weight);
        if (config.enableSound) playScannerSound('success');
        const msg = `⚖️ ميزان: ${prod.name} (${weight.toFixed(3)} كجم)`;
        if (onScanMessage) onScanMessage(msg, 'success');
        addLog(barcode, 'success', msg, prod.name);
        return;
      }
    }

    // 2. Standard exact product search by barcode or SKU or ID
    const prod = products.find(p => p.barcode === barcode || p.id === barcode);
    if (!prod) {
      if (config.enableSound) playScannerSound('error');
      const msg = `❌ الباركود (${barcode}) غير مسجل بالنظام!`;
      if (onScanMessage) onScanMessage(msg, 'error');
      addLog(barcode, 'not_found', msg);
      return;
    }

    // Check stock
    if (prod.stock !== 999 && prod.stock <= 0) {
      if (config.enableSound) playScannerSound('error');
      const msg = `⚠️ الصنف "${prod.name}" نفد من المخزن!`;
      if (onScanMessage) onScanMessage(msg, 'error');
      addLog(barcode, 'out_of_stock', msg, prod.name);
      return;
    }

    // Check if product is already in cart
    const existingInCart = cart.find(item => item.id === prod.id);

    if (existingInCart && config.autoIncrement) {
      const targetQty = existingInCart.quantity + 1;
      if (prod.stock !== 999 && targetQty > prod.stock) {
        if (config.enableSound) playScannerSound('error');
        const msg = `⚠️ لا يمكن زيادة الكمية! المتوفر فقط ${prod.stock} من ${prod.name}`;
        if (onScanMessage) onScanMessage(msg, 'error');
        addLog(barcode, 'out_of_stock', msg, prod.name);
        return;
      }

      onUpdateQuantity(prod.id, targetQty);
      if (config.enableSound) playScannerSound('success');
      const msg = `➕ زيادة الكمية: ${prod.name} (الكمية الجديدة: ${targetQty})`;
      if (onScanMessage) onScanMessage(msg, 'info');
      addLog(barcode, 'incremented', msg, prod.name);
    } else {
      onAddToCart(prod, 1);
      if (config.enableSound) playScannerSound('success');
      const msg = `✅ تم مسح وإضافة: ${prod.name}`;
      if (onScanMessage) onScanMessage(msg, 'success');
      addLog(barcode, 'success', msg, prod.name);
    }
  }, [products, cart, config, onAddToCart, onUpdateQuantity, onScanMessage, addLog]);

  // Keyboard Wedge USB / Bluetooth Scanner Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is actively focused in input / textarea / select unless configured
      const target = e.target as HTMLElement;
      if (config.ignoreInInputFields && target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT'
      )) {
        // If the focused input is explicitly marked as scanner input, let it buffer
        if (!target.getAttribute('data-scanner-input')) {
          return;
        }
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      // If time between keystrokes exceeds threshold, reset buffer (manual typing vs scanner burst)
      if (timeDiff > config.timingThresholdMs) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 2) {
          processBarcode(bufferRef.current);
          bufferRef.current = '';
          e.preventDefault();
        }
      } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta' && e.key !== 'Tab') {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, processBarcode]);

  return {
    config,
    setConfig,
    scanHistory,
    clearHistory: () => setScanHistory([]),
    isScannerConnected,
    lastScannedBarcode,
    processBarcode
  };
}
