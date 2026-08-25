import router from '../core/server/routes/v1/search.routes.ts';

export async function testSearchErrorSanitization() {
  console.log('=== Starting Global Search Error Sanitization Test ===');

  let responseStatus = 0;
  let responseData: any = null;

  const mockReq: any = {
    query: { q: 'test' },
    user: { role: 'admin', permissions: [] }
  };

  const mockRes: any = {
    status: (code: number) => {
      responseStatus = code;
      return mockRes;
    },
    json: (data: any) => {
      responseData = data;
      return mockRes;
    }
  };

  // Find the route handler for GET '/'
  const route = router.stack.find((layer: any) => layer.route && layer.route.path === '/');
  if (!route) {
    throw new Error('Search GET / route handler not found in search.routes.ts router');
  }

  const handler = route.route.stack[0].handle;

  // Execute the handler (without DB, it will catch a DB query error)
  await handler(mockReq, mockRes, () => {});

  if (responseStatus !== 500) {
    throw new Error(`Expected HTTP status 500, got ${responseStatus}`);
  }

  if (responseData.success !== false) {
    throw new Error(`Expected success to be false, got ${responseData.success}`);
  }

  if ('details' in responseData) {
    throw new Error(`CRITICAL SECURITY LEAK: Response contains 'details' field: ${JSON.stringify(responseData)}`);
  }

  console.log('✔ Search route error sanitization test passed! No details or internal errors leaked in response.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testSearchErrorSanitization().catch(err => {
    console.error('❌ Search error sanitization test failed:', err);
    process.exit(1);
  });
}
