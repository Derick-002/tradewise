export const mockAnalyticsData = {
  stockAnalysis: {
    totalSales: 125000,
    totalPurchases: 85000,
    profit: 40000,
    products: {
      bought: [
        { id: 1, name: 'Product A', quantity: 50, price: 100 },
        { id: 2, name: 'Product B', quantity: 30, price: 200 },
        { id: 3, name: 'Product C', quantity: 75, price: 150 },
        { id: 4, name: 'Product D', quantity: 40, price: 300 },
        { id: 5, name: 'Product E', quantity: 60, price: 250 },
      ],
      sold: [
        { id: 1, name: 'Product A', quantity: 45, price: 150 },
        { id: 2, name: 'Product B', quantity: 25, price: 280 },
        { id: 3, name: 'Product C', quantity: 70, price: 200 },
      ],
    },
  },
};
