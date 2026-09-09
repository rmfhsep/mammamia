export {};

declare global {
  namespace kakao {
    namespace maps {
      function load(callback: () => void): void;

      class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
      }

      class RoadviewClient {
        getNearestPanoId(
          position: LatLng,
          radius: number,
          callback: (panoId: number | null) => void,
        ): void;
      }

      class Roadview {
        constructor(container: HTMLElement);
        setPanoId(panoId: number, position: LatLng): void;
        relayout(): void;
      }

      namespace event {
        function addListener(target: Roadview, type: string, handler: () => void): void;
      }

      namespace services {
        type Status = 'OK' | 'ZERO_RESULT' | 'ERROR';

        const Status: {
          OK: 'OK';
          ZERO_RESULT: 'ZERO_RESULT';
          ERROR: 'ERROR';
        };

        interface AddressSearchResult {
          address_name: string;
          y: string;
          x: string;
        }

        class Geocoder {
          addressSearch(
            address: string,
            callback: (result: AddressSearchResult[], status: Status) => void,
          ): void;
        }
      }
    }
  }

  interface Window {
    kakao: typeof kakao;
  }
}
