// Stock Image Queries
export const getStockImagesQuery = `
  query {
    getStockImages {
      id
      name
      unit
      quantity
      low_stock_quantity
      createdAt
      updatedAt
    }
  }
`;

export const createStockImageMutation = `
  mutation Create($name: String!, $unit: EUnitType!, $low_stock_quantity: Float) {
    createStockImage(name: $name, unit: $unit, low_stock_quantity: $low_stock_quantity) {
      id
      name
      unit
      quantity
      low_stock_quantity
      createdAt
      updatedAt
    }
  }
`;

export const updateStockImageMutation = `
  mutation UpdateStockImage($stockImageId: String!, $name: String, $unit: EUnitType, $low_stock_quantity: Float) {
    updateStockImage (stockImageId: $stockImageId, name: $name, unit: $unit, low_stock_quantity: $low_stock_quantity) {
        id
        name
        unit
        quantity
        low_stock_quantity
        createdAt
        updatedAt
    }
  }
`;

export const deleteStockImageMutation = `
  mutation DeleteStockImage($stockImageId: String!) {
      stockImage: deleteStockImage (stockImageId: $stockImageId) {
          id
          name
          unit
          stock {
              id
              trader {
                  id
                  enterpriseName
              }
          }
      }
  }
`;

export const findAllStockImagesQuery = `
  query {
    getStockImages {
      id
      name
      unit
      stock {
      id
      trader {
        id
        email
        enterpriseName
      }
      }
    }
  }
`;

export const findStockImagesByQuery = `
  query GetStockImage($id: String!) {
    getStockImage(id: $id) {
      id
      name
      unit
      stock {
        id
        trader {
          id
          enterpriseName
        }
      }
    }
  }
`;

// Category Queries
export const createCategoryMutation = `
  mutation {
    category: createCategory(
      name: "Electronics",
      type: WEIGHTS,
      symbol: "kg"
    ) {
      id
      name
      type
      symbol
      createdAt
      updatedAt
    }
  }
`;

// transaction queries
export const createTransactionMutation = `
  mutation CreateTransaction(
    $type: ENTransactionType!
    $products: [GqlTransactionCreateProductInput!]!
    $description: String!
    $secondParty: String!
    $financialDetails: GqlFinancialCreateInput
  ) {
    createTransaction(
      type: $type
      products: $products
      description: $description
      secondParty: $secondParty
      financialDetails: $financialDetails
  ) {
      id
      type
      description
      secondParty
      createdAt
      updatedAt
      stock {
        id
      }
      products {
        id
        name
        quantity
        price
        brand
      }
    }
  }
`;

export const findallTransactionsQuery = `
  query GetAllTransactions($type: ENTransactionType) {
    transactions: getAllTransactions(type: $type) {
      id
      type
      description
      secondParty
      createdAt
      updatedAt
      stockId
      stock {
        id
        markAsBought
        trader {
          id
          email
          enterpriseName
        }
      }
      products {
        id
        name
        quantity
        price
      }
      financials {
        id
        amount
      }
    }
  }
`;

export const findATransactionQuery = `
  query GetATransaction($transactionId: String!) {
    transaction: getTransaction(transactionId: $transactionId) {
      id
      type
      description
      secondParty
      createdAt
      updatedAt
      stockId
      stock {
        id
        markAsBought
        trader {
          id
          email
          enterpriseName
        }
      }
      products {
        id
        name
        quantity
        price
      }
      financials {
        id
        amount
      }
    }
  }
`;