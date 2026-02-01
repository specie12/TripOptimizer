/**
 * Type declarations for amadeus npm package
 * Official package doesn't include TypeScript definitions
 */

declare module 'amadeus' {
  export interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: string;
  }

  export default class Amadeus {
    constructor(config: AmadeusConfig);

    referenceData: {
      locations: {
        get(params: { keyword: string; subType: string }): Promise<any>;
      };
    };

    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<any>;
      };
      flightOffers: {
        pricing: {
          post(params: any): Promise<any>;
        };
      };
      activities: {
        get(params: { latitude: number; longitude: number; radius?: number }): Promise<any>;
      };
      activity(activityId: string): {
        get(): Promise<any>;
      };
    };

    booking: {
      flightOrders: {
        post(params: any): Promise<any>;
      };
      flightOrder(orderId: string): {
        get(): Promise<any>;
        delete(): Promise<any>;
      };
    };
  }
}
