/**
 * TypeScript declarations for Amadeus SDK
 * Official package does not include TypeScript definitions
 */

declare module 'amadeus' {
  export interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'production' | 'test';
  }

  export default class Amadeus {
    constructor(config: AmadeusConfig);

    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<{ data: any[] }>;
      };
      flightOffers: {
        pricing: {
          post(params: any): Promise<{ data: any }>;
        };
      };
    };

    booking: {
      flightOrders: {
        post(params: any): Promise<{ data: any }>;
      };
      flightOrder(orderId: string): {
        get(): Promise<{ data: any }>;
        delete(): Promise<void>;
      };
    };
  }
}
