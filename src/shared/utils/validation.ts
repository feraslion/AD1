// Request Validation Layer for Enterprise POS & ERP System
import { Product, Customer, StoreSettings, Invoice } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  message?: string;
}

export const ValidationLayer = {
  /**
   * Validate Product details
   */
  validateProduct: (p: Partial<Product>): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!p.name || p.name.trim() === '') {
      errors.name = 'اسم المنتج مطلوب ولا يمكن تركه فارغاً.';
    }

    if (!p.barcode || p.barcode.trim() === '') {
      errors.barcode = 'رمز الباركود مطلوب لتسجيل المنتج.';
    }

    if (p.price === undefined || p.price < 0) {
      errors.price = 'سعر البيع يجب أن يكون صفراً أو قيمة موجبة.';
    }

    if (p.purchasePrice === undefined || p.purchasePrice < 0) {
      errors.purchasePrice = 'سعر الشراء يجب أن يكون صفراً أو قيمة موجبة.';
    }

    if (p.stock === undefined || p.stock < 0) {
      errors.stock = 'كمية المخزون لا يمكن أن تكون قيمة سالبة.';
    }

    if (p.minStock === undefined || p.minStock < 0) {
      errors.minStock = 'الحد الأدنى للمخزون لا يمكن أن يكون قيمة سالبة.';
    }

    if (!p.category || p.category.trim() === '') {
      errors.category = 'يجب اختيار فئة/تصنيف للمنتج.';
    }

    if (!p.unit || p.unit.trim() === '') {
      errors.unit = 'يجب تحديد وحدة القياس (مثال: حبة، كرتون).';
    }

    if (p.taxRate === undefined || p.taxRate < 0 || p.taxRate > 100) {
      errors.taxRate = 'نسبة الضريبة غير صالحة (يجب أن تكون بين 0% و 100%).';
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      message: isValid ? undefined : 'بيانات المنتج غير مكتملة أو تحتوي على أخطاء.'
    };
  },

  /**
   * Validate Customer details
   */
  validateCustomer: (c: Partial<Customer>): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!c.name || c.name.trim() === '') {
      errors.name = 'اسم العميل مطلوب.';
    }

    if (c.phone && c.phone.trim() !== '') {
      // Validate Saudi or common phone format if provided
      const cleanedPhone = c.phone.trim().replace(/[\s\-\+]/g, '');
      if (cleanedPhone.length < 9) {
        errors.phone = 'رقم الجوال المدخل غير صحيح (يجب ألا يقل عن 9 أرقام).';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      message: isValid ? undefined : 'بيانات العميل غير صالحة.'
    };
  },

  /**
   * Validate Store Settings
   */
  validateSettings: (s: Partial<StoreSettings>): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!s.name || s.name.trim() === '') {
      errors.name = 'اسم المتجر/المنشأة مطلوب.';
    }

    if (!s.address || s.address.trim() === '') {
      errors.address = 'العنوان الرئيسي مطلوب لطباعة الفاتورة والالتزام الضريبي.';
    }

    if (!s.phone || s.phone.trim() === '') {
      errors.phone = 'رقم هاتف المنشأة مطلوب.';
    }

    if (!s.taxNumber || s.taxNumber.trim() === '') {
      errors.taxNumber = 'الرقم الضريبي مطلوب للفوترة الإلكترونية (فاتورة هيئة الزكاة والضريبة والجمارك).';
    } else {
      // KSA VAT number is usually 15 digits
      const cleanedTaxNum = s.taxNumber.trim().replace(/\s/g, '');
      if (cleanedTaxNum.length !== 15 || !/^\d+$/.test(cleanedTaxNum)) {
        errors.taxNumber = 'الرقم الضريبي للمنشأة غير صالح (يجب أن يتكون من 15 رقماً ويبدأ وينتهي بالرقم 3 حسب معايير هيئة الزكاة).';
      }
    }

    if (s.taxRate === undefined || s.taxRate < 0 || s.taxRate > 100) {
      errors.taxRate = 'نسبة ضريبة القيمة المضافة الافتراضية يجب أن تكون بين 0 و 100.';
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      message: isValid ? undefined : 'إعدادات المنشأة غير صالحة.'
    };
  },

  /**
   * Validate Invoice (Checkout verification)
   */
  validateInvoice: (i: Partial<Invoice>): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!i.items || i.items.length === 0) {
      errors.items = 'لا يمكن إنشاء فاتورة فارغة. يرجى إضافة منتجات إلى السلة أولاً.';
    } else {
      i.items.forEach((item, index) => {
        if (!item.productId) {
          errors[`item_${index}_productId`] = `المنتج رقم ${index + 1} غير صالح.`;
        }
        if (item.quantity <= 0) {
          errors[`item_${index}_quantity`] = `كمية المنتج "${item.productName}" يجب أن تكون أكبر من الصفر.`;
        }
        if (item.price < 0) {
          errors[`item_${index}_price`] = `سعر المنتج "${item.productName}" لا يمكن أن يكون سالباً.`;
        }
      });
    }

    if (i.paymentMethod === 'split') {
      const details = i.paymentDetails || { cashAmount: 0, cardAmount: 0 };
      const totalPaid = (details.cashAmount || 0) + (details.cardAmount || 0);
      const difference = Math.abs(totalPaid - (i.grandTotal || 0));
      if (difference > 0.05) {
        errors.paymentMethod = `طريقة الدفع المختلطة غير مطابقة. المبلغ المدفوع (${totalPaid}) لا يساوي إجمالي الفاتورة (${i.grandTotal}).`;
      }
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      message: isValid ? undefined : 'عملية الدفع أو عناصر الفاتورة تحتوي على أخطاء.'
    };
  },

  /**
   * Validate double-entry journal logs
   */
  validateJournalEntry: (lines: any[], description: string): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!description || description.trim() === '') {
      errors.description = 'بيان القيد اليومي مطلوب ولا يمكن تركه فارغاً.';
    }

    if (!lines || lines.length < 2) {
      errors.lines = 'يجب أن يحتوي القيد اليومي المتزن على سطرين محاسبيين على الأقل (حساب مدين وحساب دائن).';
    } else {
      let totalDebit = 0;
      let totalCredit = 0;

      lines.forEach((line, index) => {
        if (!line.accountId) {
          errors[`line_${index}_account`] = `السطر رقم ${index + 1}: يجب اختيار الحساب المحاسبي المرتبط.`;
        }
        const debit = parseFloat(line.debit) || 0;
        const credit = parseFloat(line.credit) || 0;

        if (debit < 0 || credit < 0) {
          errors[`line_${index}_value`] = `السطر رقم ${index + 1}: لا يمكن إدخال قيم سالبة في الحسابات المحاسبية.`;
        }
        if (debit > 0 && credit > 0) {
          errors[`line_${index}_both`] = `السطر رقم ${index + 1}: لا يمكن أن يكون الحساب مديناً ودائناً في آن واحد بنفس السطر.`;
        }
        if (debit === 0 && credit === 0) {
          errors[`line_${index}_zero`] = `السطر رقم ${index + 1}: يجب إدخال قيمة للمدين أو الدائن.`;
        }

        totalDebit += debit;
        totalCredit += credit;
      });

      const discrepancy = Math.abs(totalDebit - totalCredit);
      if (discrepancy > 0.01) {
        errors.unbalanced = `قيد محاسبي غير متزن! مجموع المدين (${totalDebit.toFixed(2)}) لا يساوي مجموع الدائن (${totalCredit.toFixed(2)}). الفرق: ${discrepancy.toFixed(2)}`;
      }
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      message: isValid ? undefined : 'القيد المحاسبي يحتوي على أخطاء وغير متزن.'
    };
  }
};
