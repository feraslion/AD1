import { Product, Category, Customer, Unit, StoreSettings, Invoice } from '../../types';

export const INITIAL_SETTINGS: StoreSettings = {
  name: "مجموعة المتاجر الراقية",
  logo: "🛒",
  address: "المملكة العربية السعودية، الرياض، شارع العليا",
  phone: "966500000000",
  taxNumber: "300012345600003", // Standard 15-digit KSA VAT number
  taxRate: 15,
  currency: "ر.س",
  thermalPrinterWidth: "80mm"
};

export const INITIAL_UNITS: Unit[] = [
  { id: '1', name: 'حبة' },
  { id: '2', name: 'كيلو' },
  { id: '3', name: 'كرتون' },
  { id: '4', name: 'لتر' },
  { id: '5', name: 'شدة' },
  { id: '6', name: 'جرام' }
];

export const DEMO_DATASETS: Record<string, {
  categories: Category[];
  products: Product[];
  customers: Customer[];
}> = {
  supermarket: {
    categories: [
      { id: 'cat-1', name: 'المعلبات والأغذية', icon: '🥫' },
      { id: 'cat-2', name: 'المخبوزات والحلويات', icon: '🍞' },
      { id: 'cat-3', name: 'المشروبات والعصائر', icon: '🥤' },
      { id: 'cat-4', name: 'الألبان والأجبان', icon: '🧀' },
      { id: 'cat-5', name: 'الخضروات والفواكه', icon: '🍎' }
    ],
    products: [
      { id: 'p-1', name: 'أرز بسمتي الشعلان 5 كجم', barcode: '6281001123456', price: 45.00, purchasePrice: 32.50, stock: 45, minStock: 10, category: 'cat-1', unit: 'حبة', taxRate: 15 },
      { id: 'p-2', name: 'زيت طبخ صني 1.5 لتر', barcode: '6281001123457', price: 16.50, purchasePrice: 11.20, stock: 28, minStock: 8, category: 'cat-1', unit: 'حبة', taxRate: 15 },
      { id: 'p-3', name: 'حليب كامل الدسم المراعي 1 لتر', barcode: '6281005120102', price: 7.00, purchasePrice: 4.80, stock: 120, minStock: 20, category: 'cat-4', unit: 'حبة', taxRate: 15 },
      { id: 'p-4', name: 'خبز توست أبيض لوزين', barcode: '6281002234012', price: 5.50, purchasePrice: 3.50, stock: 50, minStock: 15, category: 'cat-2', unit: 'حبة', taxRate: 15 },
      { id: 'p-5', name: 'مياه نوفا صحية 24×330مل', barcode: '6281003112233', price: 18.00, purchasePrice: 12.00, stock: 5, minStock: 10, category: 'cat-3', unit: 'شدة', taxRate: 15 }, // Low stock!
      { id: 'p-6', name: 'جبنة موزاريلا المراعي 500 جرام', barcode: '6281005121406', price: 22.00, purchasePrice: 15.00, stock: 35, minStock: 5, category: 'cat-4', unit: 'حبة', taxRate: 15 },
      { id: 'p-7', name: 'تفاح أحمر سكري (كجم)', barcode: '000000001007', price: 9.50, purchasePrice: 6.00, stock: 25, minStock: 8, category: 'cat-5', unit: 'كيلو', taxRate: 15 }
    ],
    customers: [
      { id: 'c-1', name: 'محمد أحمد العتيبي', phone: '0555123456', balance: 150.00 },
      { id: 'c-2', name: 'سارة خالد الدوسري', phone: '0544987654', balance: 0.00 },
      { id: 'c-3', name: 'عميل نقدي سريع', phone: '', balance: 0.00 }
    ]
  },
  pharmacy: {
    categories: [
      { id: 'cat-1', name: 'الأدوية والوصفات', icon: '💊' },
      { id: 'cat-2', name: 'العناية بالبشرة', icon: '🧴' },
      { id: 'cat-3', name: 'المكملات الغذائية', icon: '🥛' },
      { id: 'cat-4', name: 'مستلزمات الطفل', icon: '👶' }
    ],
    products: [
      { id: 'p-1', name: 'بانادول اكسترا 24 قرص', barcode: '5011321404104', price: 14.50, purchasePrice: 10.00, stock: 80, minStock: 15, category: 'cat-1', unit: 'حبة', taxRate: 15 },
      { id: 'p-2', name: 'سيباميد شامبو للأطفال 150مل', barcode: '4103040114067', price: 35.00, purchasePrice: 24.50, stock: 12, minStock: 5, category: 'cat-4', unit: 'حبة', taxRate: 15 },
      { id: 'p-3', name: 'كريم مرطب سيرافي 454 جرام', barcode: '3337875597302', price: 120.00, purchasePrice: 85.00, stock: 4, minStock: 5, category: 'cat-2', unit: 'حبة', taxRate: 15 }, // Low stock!
      { id: 'p-4', name: 'فيتامين سي 1000مجم فوار', barcode: '6281002234050', price: 28.00, purchasePrice: 18.00, stock: 40, minStock: 10, category: 'cat-3', unit: 'حبة', taxRate: 15 },
      { id: 'p-5', name: 'معجون أسنان سنسوداين واقي المينا', barcode: '5011321405011', price: 25.50, purchasePrice: 16.20, stock: 32, minStock: 8, category: 'cat-2', unit: 'حبة', taxRate: 15 }
    ],
    customers: [
      { id: 'c-1', name: 'خالد عبدالله النفيسة', phone: '0505112233', balance: 0.00 },
      { id: 'c-2', name: 'منى صالح المحمود', phone: '0533224455', balance: 45.00 }
    ]
  },
  cafe: {
    categories: [
      { id: 'cat-1', name: 'قهوة ساخنة', icon: '☕' },
      { id: 'cat-2', name: 'مشروبات باردة', icon: '🍹' },
      { id: 'cat-3', name: 'المعجنات والحلى', icon: '🍰' },
      { id: 'cat-4', name: 'حبوب البن والبن المحمص', icon: '🫘' }
    ],
    products: [
      { id: 'p-1', name: 'سبانيش لاتيه ساخن ميديوم', barcode: '100101', price: 18.00, purchasePrice: 3.50, stock: 999, minStock: 0, category: 'cat-1', unit: 'حبة', taxRate: 15 }, // Infinite/service stock
      { id: 'p-2', name: 'امريكانو كبير الكافيه', barcode: '100102', price: 12.00, purchasePrice: 1.20, stock: 999, minStock: 0, category: 'cat-1', unit: 'حبة', taxRate: 15 },
      { id: 'p-3', name: 'بيستاشيو لاتيه بارد', barcode: '100103', price: 22.00, purchasePrice: 4.80, stock: 999, minStock: 0, category: 'cat-2', unit: 'حبة', taxRate: 15 },
      { id: 'p-4', name: 'كرواسون زبدة فرنسي', barcode: '100104', price: 14.00, purchasePrice: 7.00, stock: 3, minStock: 5, category: 'cat-3', unit: 'حبة', taxRate: 15 }, // Low stock!
      { id: 'p-5', name: 'كيكة العسل بالتوفي', barcode: '100105', price: 24.00, purchasePrice: 12.00, stock: 15, minStock: 3, category: 'cat-3', unit: 'حبة', taxRate: 15 },
      { id: 'p-6', name: 'بن اثيوبي هيرلوم 250جرام', barcode: '6281003401011', price: 65.00, purchasePrice: 35.00, stock: 24, minStock: 5, category: 'cat-4', unit: 'حبة', taxRate: 15 }
    ],
    customers: [
      { id: 'c-1', name: 'فيصل السديري', phone: '0566778899', balance: 0.00 },
      { id: 'c-2', name: 'نورة السليمان', phone: '0544112233', balance: 18.00 }
    ]
  },
  gold: {
    categories: [
      { id: 'cat-1', name: 'أطقم ومجوهرات ذهبية', icon: '👑' },
      { id: 'cat-2', name: 'خواتم ودبل', icon: '💍' },
      { id: 'cat-3', name: 'أساور وعقود', icon: '📿' },
      { id: 'cat-4', name: 'سبائك وجنيهات ذهبية', icon: '🪙' }
    ],
    products: [
      { id: 'p-1', name: 'سوار ذهب عيار 21 إيطالي', barcode: '700101', price: 3450.00, purchasePrice: 2800.00, stock: 5, minStock: 2, category: 'cat-3', unit: 'حبة', taxRate: 15 },
      { id: 'p-2', name: 'خاتم ألماس ناعم عيار 18', barcode: '700102', price: 5800.00, purchasePrice: 4200.00, stock: 2, minStock: 1, category: 'cat-2', unit: 'حبة', taxRate: 15 },
      { id: 'p-3', name: 'سباكة ذهب صافي 10 جرام', barcode: '700103', price: 3100.00, purchasePrice: 2900.00, stock: 12, minStock: 3, category: 'cat-4', unit: 'حبة', taxRate: 15 },
      { id: 'p-4', name: 'عقد ملكي ذهبي عيار 24', barcode: '700104', price: 12500.00, purchasePrice: 10500.00, stock: 1, minStock: 1, category: 'cat-1', unit: 'حبة', taxRate: 15 }
    ],
    customers: [
      { id: 'c-1', name: 'أم ريان الدوسري', phone: '0505121212', balance: 0.00 },
      { id: 'c-2', name: 'شركة البريق للمجوهرات', phone: '0599121212', balance: 5000.00 }
    ]
  }
};

export const GENERATE_INITIAL_INVOICES = (products: Product[]): Invoice[] => {
  const pList = products.length > 0 ? products : DEMO_DATASETS.supermarket.products;
  const getProduct = (index: number) => pList[index % pList.length];

  // Generate 12 mock invoices spread over the last 12 days to populate reports perfectly!
  const invoices: Invoice[] = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const invoiceDate = new Date();
    invoiceDate.setDate(currentDate.getDate() - i);
    invoiceDate.setHours(10 + (i % 8), 15 * (i % 4), 0);

    const invoiceId = `inv-2026-${1000 + i}`;
    const invoiceNumber = `FT-${2026}${100 + i}`;

    const prod1 = getProduct(i);
    const prod2 = getProduct(i + 1);

    const price1 = prod1.price;
    const price2 = prod2.price;

    const item1Qty = 1 + (i % 3);
    const item2Qty = 1;

    const item1Tax = parseFloat((price1 * item1Qty * 0.15).toFixed(2));
    const item2Tax = parseFloat((price2 * item2Qty * 0.15).toFixed(2));

    const item1Total = price1 * item1Qty;
    const item2Total = price2 * item2Qty;

    const subtotal = item1Total + item2Total;
    const taxAmount = item1Tax + item2Tax;
    const discountAmount = i % 4 === 0 ? 5.00 : 0.00;
    const grandTotal = subtotal + taxAmount - discountAmount;

    invoices.push({
      id: invoiceId,
      invoiceNumber: invoiceNumber,
      date: invoiceDate.toISOString(),
      items: [
        {
          productId: prod1.id,
          productName: prod1.name,
          price: price1,
          quantity: item1Qty,
          discount: 0,
          discountType: 'percentage',
          total: item1Total,
          taxAmount: item1Tax
        },
        {
          productId: prod2.id,
          productName: prod2.name,
          price: price2,
          quantity: item2Qty,
          discount: 0,
          discountType: 'percentage',
          total: item2Total,
          taxAmount: item2Tax
        }
      ],
      totalWithoutTax: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: discountAmount,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMethod: i % 3 === 0 ? 'card' : i % 3 === 1 ? 'cash' : 'credit',
      paymentDetails: {
        cashAmount: i % 3 === 1 ? grandTotal : 0,
        cardAmount: i % 3 === 0 ? grandTotal : 0
      },
      status: i % 3 === 2 ? 'unpaid' : 'paid',
      customerId: i % 3 === 2 ? 'c-1' : undefined,
      customerName: i % 3 === 2 ? 'محمد أحمد العتيبي' : 'عميل نقدي سريع',
      taxNumber: '300012345600003',
      cashierName: 'أحمد الكاشير'
    });
  }

  return invoices;
};
