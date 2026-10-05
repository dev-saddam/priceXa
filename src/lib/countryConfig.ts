export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  defaultCurrency: string;
  currencySymbol: string;
  amazonDomain: string;
  ebayDomain: string;
  googleGl: string;
  googleHl: string;
  ddgKl: string;
  description: string;
}

export const SUPPORTED_COUNTRIES: Record<string, CountryOption> = {
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    defaultCurrency: 'GBP',
    currencySymbol: '£',
    amazonDomain: 'amazon.co.uk',
    ebayDomain: 'ebay.co.uk',
    googleGl: 'uk',
    googleHl: 'en-GB',
    ddgKl: 'uk-en',
    description: 'Searches Amazon UK (amazon.co.uk), eBay UK, and UK brand stores in GBP (£)',
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    currencySymbol: '$',
    amazonDomain: 'amazon.com',
    ebayDomain: 'ebay.com',
    googleGl: 'us',
    googleHl: 'en',
    ddgKl: 'us-en',
    description: 'Searches Amazon US (amazon.com), Walmart, and US brand stores in USD ($)',
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    amazonDomain: 'amazon.in',
    ebayDomain: 'ebay.com',
    googleGl: 'in',
    googleHl: 'en',
    ddgKl: 'in-en',
    description: 'Searches Amazon India (amazon.in), Flipkart, and Indian brand stores in INR (₹)',
  },
  DE: {
    code: 'DE',
    name: 'Germany / European Union',
    flag: '🇩🇪',
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.de',
    ebayDomain: 'ebay.de',
    googleGl: 'de',
    googleHl: 'de',
    ddgKl: 'de-de',
    description: 'Searches Amazon Germany (amazon.de), Otto, and European brand stores in EUR (€)',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    defaultCurrency: 'CAD',
    currencySymbol: 'C$',
    amazonDomain: 'amazon.ca',
    ebayDomain: 'ebay.ca',
    googleGl: 'ca',
    googleHl: 'en',
    ddgKl: 'ca-en',
    description: 'Searches Amazon Canada (amazon.ca), Walmart CA, and Canadian stores in CAD (C$)',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultCurrency: 'AUD',
    currencySymbol: 'A$',
    amazonDomain: 'amazon.com.au',
    ebayDomain: 'ebay.com.au',
    googleGl: 'au',
    googleHl: 'en',
    ddgKl: 'au-en',
    description: 'Searches Amazon Australia (amazon.com.au), eBay AU, and Australian stores in AUD (A$)',
  },
};

export const COUNTRY_LIST: CountryOption[] = Object.values(SUPPORTED_COUNTRIES);

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

export function getCountryConfig(countryCode?: string): CountryOption {
  if (!countryCode) return SUPPORTED_COUNTRIES.US;
  const upper = countryCode.toUpperCase().trim();
  if (upper === 'GB' || upper === 'UK') return SUPPORTED_COUNTRIES.UK;
  if (SUPPORTED_COUNTRIES[upper]) return SUPPORTED_COUNTRIES[upper];

  // Dynamic fallback for any user-selected country code (e.g. FR, JP, SG, etc.)
  const lower = upper.toLowerCase();
  return {
    code: upper,
    name: upper,
    flag: '🌐',
    defaultCurrency: 'USD',
    currencySymbol: '$',
    amazonDomain: `amazon.${lower === 'uk' ? 'co.uk' : lower}`,
    ebayDomain: `ebay.${lower === 'uk' ? 'co.uk' : lower}`,
    googleGl: lower,
    googleHl: 'en',
    ddgKl: `${lower}-en`,
    description: `Regional targeting for ${upper}`,
  };
}

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return '$';
  switch (currency.toUpperCase()) {
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'INR':
      return '₹';
    case 'CAD':
      return 'C$';
    case 'AUD':
      return 'A$';
    case 'JPY':
      return '¥';
    case 'USD':
    default:
      return '$';
  }
}

/**
 * Dynamically converts store domains to the tenant's chosen target country.
 * e.g. If tenant selects UK, converts amazon.com -> amazon.co.uk, ebay.com -> ebay.co.uk
 */
export function adaptDomainForCountry(domain: string, countryCode?: string): string {
  if (!domain) return '';
  const d = domain.toLowerCase();
  const config = getCountryConfig(countryCode);

  // Amazon Marketplace Regionalization
  if (d.includes('amazon.')) {
    return config.amazonDomain;
  }

  // eBay Regionalization
  if (d.includes('ebay.')) {
    return config.ebayDomain;
  }

  // Brand official webstore regional variations
  if (d.includes('skechers.')) {
    if (config.code === 'UK') return 'skechers.co.uk';
    if (config.code === 'IN') return 'skechers.in';
    if (config.code === 'DE') return 'skechers.de';
    if (config.code === 'CA') return 'skechers.ca';
    if (config.code === 'US') return 'skechers.com';
  }

  if (d.includes('gymshark.com')) {
    if (config.code === 'UK') return 'uk.gymshark.com';
    if (config.code === 'DE') return 'de.gymshark.com';
    if (config.code === 'US') return 'gymshark.com';
  }

  return domain;
}
