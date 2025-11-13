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

// financial queries
export const createFinancial = `
  mutation CreateFinancial(
    $type: ENFinancialType!
    $amount: Float!
    $description: String!
    $collateral: String
    $deadline: DateTime
) {
    financial: createFinancial(
      type: $type
      amount: $amount
      description: $description
      collateral: $collateral
      deadline: $deadline
    ) 
    {
      id
      type
      amount
      collateral
      deadline
      description
      stock {
          id
          trader {
              id
              enterpriseName
          }
      }
      transaction {
          id
          type
          description
      }
    }
  }
`;

export const findAllFinancials = `
  query GetFinancials {
      financials: getFinancials {
          id
          type
          amount
          collateral
          isPaidBack
          deadline
          description
          stock {
              id
              trader {
                  id
                  enterpriseName
              }
          }
          transaction {
              id
              type
              description
          }
      }
  }
`;

export const findAFinancials = `
  query GetFinancials($id: String!) {
      financials: getFinancial(financialId: $id) {
          id
          type
          amount
          collateral
          deadline
          description
          isPaidBack
          stock {
              id
              trader {
                  id
                  enterpriseName
              }
          }
          transaction {
              id
              type
              description
          }
      }
  }
`;

export const updateFinancials = `
  mutation UpdateFinancial(
    $financialId: String!
    $input: GqlFinancialUpdateInput!
  ) {
    updateFinancial(financialId: $financialId, input: $input) {
      id
      type
      amount
      description
      collateral
      deadline
      isPaidBack
      createdAt
      updatedAt
    }
  }
`;

export const makeFinancialPaid = `
  mutation MarkAsPaidBack($financialId: String!) {
    markAsPaidBack(financialId: $financialId) {
      id
      isPaidBack
      description
      amount
      type
      createdAt
      updatedAt
    }
  }
`;


// notifications queries
export const getAllNotifications = `
  query GetNotifications($timeFilters: ENNotificationTimeFilters, $filters: ENNotificationFilterType) {
    getNotifications(timeFilters: $timeFilters, filters: $filters) {
      id
      title
      message
      impact
      filterType
      type
      read
      createdAt
      updatedAt
    }
  }
`;

export const getANotification = `
  query GetANotification($id: String!) {
    getANotification(id: $id) {
      id
      title
      message
      impact
      filterType
      type
      read
      createdAt
    }
  }
`;


export const markAsRead = `
  mutation MarkAsRead($id: String!) {
    markAsRead(id: $id) {
      id
      title
      read
      updatedAt
    }
  }
`;

// returns promise<boolean>
export const markAllAsRead = `
  mutation MarkAllAsRead {
    markAllAsRead
  }
`;

