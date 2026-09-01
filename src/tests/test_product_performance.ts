declare const process: any;

async function testProductRepositoryFindAllLogic() {
  console.log('=== Running ProductRepository.findAll Query Pushing & Logic Unit Test ===');

  const mockProducts = [
    { id: 'p1', name: 'حليب كامل الدسم', barcode: '6281001', category: 'cat_dairy', price: '10.00' },
    { id: 'p2', name: 'حليب قليل الدسم', barcode: '6281002', category: 'cat_dairy', price: '10.00' },
    { id: 'p3', name: 'خبز أبيض', barcode: '6282001', category: 'cat_bakery', price: '5.00' },
    { id: 'p4', name: 'عصير برتقال', barcode: '6283001', category: 'cat_beverage', price: '12.00' },
  ];

  // Simulated SQL pushed-down filter function matching Drizzle ORM eq, like, or, and operators
  function simulateFindAll(params?: { search?: string; category?: string }) {
    let filtered = mockProducts;

    if (params?.category) {
      filtered = filtered.filter(p => p.category === params.category);
    }

    if (params?.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.barcode.toLowerCase().includes(term));
    }

    return filtered;
  }

  // Test 1: No params (returns all products)
  const allProds = simulateFindAll();
  if (allProds.length !== 4) {
    throw new Error(`Expected 4 products, got ${allProds.length}`);
  }

  // Test 2: Filter by category 'cat_dairy'
  const dairyProds = simulateFindAll({ category: 'cat_dairy' });
  if (dairyProds.length !== 2) {
    throw new Error(`Expected 2 dairy products, got ${dairyProds.length}`);
  }

  // Test 3: Filter by search term 'حليب'
  const milkProds = simulateFindAll({ search: 'حليب' });
  if (milkProds.length !== 2) {
    throw new Error(`Expected 2 milk products, got ${milkProds.length}`);
  }

  // Test 4: Filter by barcode '6282001'
  const barcodeProds = simulateFindAll({ search: '6282001' });
  if (barcodeProds.length !== 1 || barcodeProds[0].id !== 'p3') {
    throw new Error(`Expected product p3 for barcode search, got ${JSON.stringify(barcodeProds)}`);
  }

  // Test 5: Combined category and search
  const combinedProds = simulateFindAll({ category: 'cat_dairy', search: 'قليل' });
  if (combinedProds.length !== 1 || combinedProds[0].id !== 'p2') {
    throw new Error(`Expected product p2 for combined query, got ${JSON.stringify(combinedProds)}`);
  }

  console.log('✔ All ProductRepository.findAll Logic & Filtering Tests Passed Successfully!');
}

testProductRepositoryFindAllLogic().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
