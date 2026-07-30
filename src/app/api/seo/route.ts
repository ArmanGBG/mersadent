import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SITE_NAME = 'مرسا دنت';
const SITE_URL = 'https://mersadent.ir'; // replace with actual domain
const SITE_DESCRIPTION = 'مرسا دنت – فروشگاه آنلاین مواد و تجهیزات دندانپزشکی با ضمانت اصالت کالا و ارسال سریع';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'home';
  const id = searchParams.get('id');

  try {
    if (type === 'product' && id) {
      return handleProductSeo(parseInt(id));
    }
    if (type === 'category' && id) {
      return handleCategorySeo(parseInt(id));
    }
    if (type === 'brand' && id) {
      return handleBrandSeo(id);
    }
    return handleHomeSeo();
  } catch (error) {
    console.error('SEO API error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

async function handleHomeSeo() {
  const ldJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'fa-IR',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: 'Persian',
        },
      },
      {
        '@type': 'Store',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IR',
        },
      },
    ],
  };

  return NextResponse.json({
    title: `${SITE_NAME} – فروشگاه آنلاین مواد و تجهیزات دندانپزشکی`,
    description: SITE_DESCRIPTION,
    ogType: 'website',
    ldJson,
  });
}

async function handleProductSeo(productId: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      category: {
        include: { parent: { include: { parent: true } } },
      },
      images: { orderBy: { order: 'asc' }, take: 1 },
    },
  });

  if (!product) {
    return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
  }

  const title = product.metaTitle || `خرید ${product.name} با قیمت مناسب | ${SITE_NAME}`;
  const description = product.metaDescription || `${product.name} - ${product.brand.name} - ${product.country || ''} | ${SITE_NAME} - ضمانت اصالت کالا`;

  const categoryChain = [];
  if (product.category.parent?.parent) categoryChain.push(product.category.parent.parent.name);
  if (product.category.parent) categoryChain.push(product.category.parent.name);
  categoryChain.push(product.category.name);

  const priceValue = product.price ? product.price * 10 : 0; // Convert toman to rial

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: description,
    image: product.images[0]?.url || '',
    sku: product.sku || '',
    model: product.model || '',
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    category: categoryChain.join(' > '),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'IRR',
      price: priceValue.toString(),
      availability: product.availability === 'in_stock'
        ? 'https://schema.org/InStock'
        : product.availability === 'call'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnInStore',
        refundType: 'https://schema.org/FullRefund',
      },
    },
  };

  // Add dynamic specs from product.specs JSON
  if (product.specs) {
    try {
      const specs: Record<string, string> = JSON.parse(product.specs);
      const additionalProps = Object.entries(specs).map(([name, value]) => ({
        '@type': 'PropertyValue',
        name,
        value,
      }));
      if (additionalProps.length > 0) {
        ldJson.additionalProperty = additionalProps;
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    title,
    description,
    ogType: 'product',
    ogImage: product.images[0]?.url || '',
    keywords: product.keywords || product.name,
    ldJson,
  });
}

async function handleCategorySeo(categoryId: number) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      parent: { include: { parent: true } },
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
  }

  const parentName = category.parent?.parent
    ? `${category.parent.parent.name} - ${category.parent.name}`
    : category.parent?.name || '';

  const title = `خرید انواع ${category.name}${parentName ? ` در ${parentName}` : ''} با ضمانت اصالت | ${SITE_NAME}`;
  const description = `خرید و مقایسه انواع ${category.name}${parentName ? ` (${parentName})` : ''} با بهترین قیمت و ضمانت اصالت کالا. ارسال سریع به سراسر ایران | ${SITE_NAME}`;

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description,
    url: `${SITE_URL}/category/${category.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    numberOfItems: category._count.products,
  };

  return NextResponse.json({
    title,
    description,
    ogType: 'article',
    keywords: `${category.name}, خرید ${category.name}, قیمت ${category.name}, ${SITE_NAME}`,
    ldJson,
  });
}

async function handleBrandSeo(brandId: string) {
  if (brandId === '0') {
    // All brands page
    const brands = await db.brand.findMany({
      where: { visible: true },
      orderBy: { name: 'asc' },
    });

    const ldJson = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `برندهای دندانپزشکی | ${SITE_NAME}`,
      description: `مشاهده و خرید محصولات تمامی برندهای معتبر دندانپزشکی`,
      numberOfItems: brands.length,
    };

    return NextResponse.json({
      title: `برندهای دندانپزشکی | ${SITE_NAME}`,
      description: `مشاهده و خرید محصولات تمامی برندهای معتبر مواد و تجهیزات دندانپزشکی | ${SITE_NAME}`,
      ogType: 'article',
      ldJson,
    });
  }

  const brand = await db.brand.findUnique({
    where: { id: parseInt(brandId) },
    include: { _count: { select: { products: true } } },
  });

  if (!brand) {
    return NextResponse.json({ error: 'برند یافت نشد' }, { status: 404 });
  }

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `${SITE_URL}/brand/${brand.slug}`,
    logo: brand.logo || '',
    description: `محصولات برند ${brand.name} - ${brand._count.products} محصول`,
  };

  return NextResponse.json({
    title: `خرید محصولات ${brand.name} با قیمت مناسب | ${SITE_NAME}`,
    description: `مشاهده و خرید ${brand._count.products} محصول از برند ${brand.name} با ضمانت اصالت و ارسال سریع | ${SITE_NAME}`,
    ogType: 'article',
    keywords: `${brand.name}, خرید ${brand.name}, محصولات ${brand.name}, ${SITE_NAME}`,
    ldJson,
  });
}