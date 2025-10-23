

export const stockImageQueries = {
  getStockImagesQuery: `
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
  `,

  createStockImageMutation: `
    mutation Create($name: String!, $unit: EUnitType!) {
      createStockImage(name: $name, unit: $unit) {
        id
        name
        createdAt
        updatedAt
        stockId
        stock {
          id
          markAsBought
        }
      }
    }
  `,

  updateStockImageMutatoin: `
    mutation UpdateStockImage($stockImageId: String!, $name: String, $unit: EUnitType) {
      updateStockImage (stockImageId: $stockImageId, name: $name, unit: $unit) {
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
  `,

  deleteStockImageMutation: `
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
  `,

  findAllStockImagesQuery: `
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
  `,

  findStockImagesByQuery: `
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
  `,
}

export const categoryQueries = {
  createCategory: `
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
  `,
}