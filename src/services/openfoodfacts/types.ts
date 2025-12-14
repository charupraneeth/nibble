export interface OFFProductResponse {
    code: string
    product: {
        product_name: string
        product_name_en?: string
        brands?: string
        serving_size?: string
        serving_quantity?: number
        nutriments: {
            "energy-kcal_100g"?: number
            "proteins_100g"?: number
            "carbohydrates_100g"?: number
            "fat_100g"?: number
            "energy-kcal_serving"?: number
            "proteins_serving"?: number
            "carbohydrates_serving"?: number
            "fat_serving"?: number
        }
    }
    status: number
    status_verbose: string
}
