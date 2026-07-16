export type CatalogSize = {
  size: string
  initialStock: number
}

export type CatalogVariant = {
  label: string
  price?: number
  compareAtPrice?: number
  sizes: CatalogSize[]
}

export type CatalogProduct = {
  name: string
  edition: string
  price: number
  compareAtPrice?: number
  image: string
  description?: string
  promo?: string
  variants: CatalogVariant[]
}

export const shopProducts: CatalogProduct[] = [
  {
    name: 'Maglietta 100% Cotone Bio',
    edition: 'ed. 2025 - Unisex',
    price: 25,
    image: '/shop/maglietta-bio-2025.jpg',
    variants: [
      {
        label: 'Sapphire',
        sizes: [
          { size: 'M', initialStock: 3 },
          { size: 'L', initialStock: 3 },
        ],
      },
      {
        label: 'Dusty Indigo',
        sizes: [
          { size: 'S', initialStock: 1 },
          { size: 'M', initialStock: 3 },
          { size: 'L', initialStock: 2 },
          { size: 'XL', initialStock: 2 },
          { size: 'XXL', initialStock: 1 },
        ],
      },
      {
        label: 'Royal',
        sizes: [
          { size: 'S', initialStock: 2 },
          { size: 'M', initialStock: 5 },
          { size: 'L', initialStock: 6 },
          { size: 'XL', initialStock: 1 },
        ],
      },
    ],
  },
  {
    name: 'Maglietta Tecnica',
    edition: 'ed. 2024 - Unisex',
    price: 15,
    compareAtPrice: 30,
    image: '/shop/maglietta-tecnica-2024.png',
    variants: [
      {
        label: 'Blu (inserti bianchi)',
        sizes: [
          { size: 'S', initialStock: 1 },
          { size: 'L', initialStock: 3 },
          { size: 'XXL', initialStock: 0 },
        ],
      },
      {
        label: 'Bianca (inserti blu)',
        sizes: [
          { size: 'S', initialStock: 2 },
          { size: 'M', initialStock: 0 },
          { size: 'L', initialStock: 7 },
          { size: 'XXL', initialStock: 0 },
        ],
      },
    ],
  },
  {
    name: 'T-Shirt Uomo',
    edition: 'ed. 2023',
    price: 25,
    image: '/shop/tshirt-uomo-2023.png',
    variants: [
      {
        label: 'Grigia (cotone)',
        price: 10,
        compareAtPrice: 25,
        sizes: [
          { size: 'S', initialStock: 1 },
          { size: 'M', initialStock: 2 },
          { size: 'XL', initialStock: 6 },
          { size: 'XXL', initialStock: 1 },
        ],
      },
      {
        label: 'Gialla (tecnica)',
        price: 15,
        compareAtPrice: 30,
        sizes: [
          { size: 'S', initialStock: 1 },
          { size: 'M', initialStock: 0 },
          { size: 'XL', initialStock: 0 },
          { size: 'XXL', initialStock: 0 },
        ],
      },
    ],
  },
  {
    name: 'T-Shirt Donna',
    edition: 'ed. 2023',
    price: 25,
    image: '/shop/tshirt-donna-2023.png',
    variants: [
      {
        label: 'Grigia (cotone)',
        price: 10,
        compareAtPrice: 25,
        sizes: [
          { size: 'M', initialStock: 4 },
          { size: 'L', initialStock: 3 },
        ],
      },
      {
        label: 'Gialla (tecnica)',
        price: 15,
        compareAtPrice: 30,
        sizes: [
          { size: 'M', initialStock: 1 },
          { size: 'L', initialStock: 0 },
        ],
      },
    ],
  },
  {
    name: 'Giacca Fleece Uomo',
    edition: 'ed. 2023',
    price: 55,
    image: '/shop/fleece-uomo-2023.jpg',
    variants: [
      {
        label: 'Grigia',
        sizes: [
          { size: 'S', initialStock: 1 },
          { size: 'M', initialStock: 0 },
          { size: 'L', initialStock: 2 },
          { size: 'XL', initialStock: 2 },
          { size: 'XXL', initialStock: 0 },
        ],
      },
    ],
  },
  {
    name: 'Giacca Fleece Donna',
    edition: 'ed. 2023',
    price: 55,
    image: '/shop/fleece-donna-2023.jpg',
    variants: [
      {
        label: 'Grigia',
        sizes: [
          { size: 'S', initialStock: 2 },
          { size: 'M', initialStock: 0 },
          { size: 'L', initialStock: 4 },
          { size: 'XXL', initialStock: 2 },
        ],
      },
    ],
  },
  {
    name: 'Cappellino CVLT',
    edition: 'ed. 2021',
    price: 15,
    compareAtPrice: 25,
    image: '/shop/cap-2021.jpeg',
    variants: [
      {
        label: 'Blu scuro',
        sizes: [
          { size: 'S/M', initialStock: 28 },
          { size: 'L/XL', initialStock: 8 },
        ],
      },
    ],
  },
]

export function catalogKey(productName: string, variant: string, size: string) {
  return `${productName}__${variant}__${size}`
}

export type CatalogEntry = {
  key: string
  productName: string
  edition: string
  variant: string
  size: string
  unitPrice: number
  compareAtPrice?: number
  initialStock: number
}

export function buildCatalogLookup(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>()
  for (const product of shopProducts) {
    for (const variant of product.variants) {
      const unitPrice = variant.price ?? product.price
      const compareAtPrice = variant.compareAtPrice ?? product.compareAtPrice
      for (const sizeEntry of variant.sizes) {
        const key = catalogKey(product.name, variant.label, sizeEntry.size)
        map.set(key, {
          key,
          productName: product.name,
          edition: product.edition,
          variant: variant.label,
          size: sizeEntry.size,
          unitPrice,
          compareAtPrice,
          initialStock: sizeEntry.initialStock,
        })
      }
    }
  }
  return map
}
