/**
 * Type declarations for amadeus package
 */

declare module 'amadeus' {
  export default class Amadeus {
    constructor(config: { clientId: string; clientSecret: string; hostname?: string });

    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<any>;
      };
    };

    booking: {
      flightOrders: {
        post(body: any): Promise<any>;
      };
    };
  }
}
