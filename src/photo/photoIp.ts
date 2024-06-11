import { db, sql } from '@vercel/postgres';


export interface PhotoIpDbInsert {
    id: number;
    ip: string;
    network: string; // CIDR notation
    version: string; // IP version, e.g., 'IPv4', 'IPv6'
    city?: string;
    region?: string;
    regionCode?: string;
    country?: string; // ISO 3166-1 alpha-2
    countryName?: string;
    countryCode: string; // ISO 3166-1 alpha-2
    countryCodeIso3?: string; // ISO 3166-1 alpha-3
    countryCapital?: string;
    countryTld?: string;
    continentCode?: string; // Continent code
    inEu?: boolean;
    postal?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    utcOffset?: string;
    countryCallingCode?: string;
    currency?: string;
    currencyName?: string;
    languages?: string;
    countryArea?: number;
    countryPopulation?: number;
    asn?: string;
    org?: string;
}