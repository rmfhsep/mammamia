export const queryKeys = {
  nearbyCafes: (lat: number, lng: number, radiusKm: number) =>
    ['cafes', 'nearby', lat, lng, radiusKm] as const,
};
