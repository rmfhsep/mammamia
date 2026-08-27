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

      interface MapOptions {
        center: LatLng;
        level?: number;
      }

      class Map {
        constructor(container: HTMLElement, options: MapOptions);
        setCenter(latlng: LatLng): void;
        getCenter(): LatLng;
        setLevel(level: number): void;
        panTo(latlng: LatLng): void;
      }

      interface MarkerOptions {
        position: LatLng;
        map?: Map;
        title?: string;
      }

      class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(latlng: LatLng): void;
        getPosition(): LatLng;
      }

      namespace event {
        function addListener(
          target: Map | Marker,
          type: string,
          handler: (...args: unknown[]) => void,
        ): void;
      }
    }
  }

  interface Window {
    kakao: typeof kakao;
  }
}
