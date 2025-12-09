export const CATEGORIES = [
    { id: 'all', label: 'All', types: [], icon: 'grid-outline' },
    { id: 'cafe', label: 'Cafés', types: ['cafe', 'bakery', 'coffee_shop', 'ice_cream_shop'], icon: 'cafe-outline' },
    { id: 'restaurant', label: 'Food', types: ['restaurant'], icon: 'restaurant-outline' },
    { id: 'bar', label: 'Bars', types: ['bar', 'night_club'], icon: 'wine-outline' },
    { id: 'park', label: 'Parks', types: ['park', 'tourist_attraction', 'stadium'], icon: 'leaf-outline' },
    { id: 'toilet', label: 'Toilets', types: ['toilet', 'restroom'], icon: 'water-outline', isOSM: true },
    { id: 'parking', label: 'Parking', types: ['parking'], icon: 'car-outline' },
    { id: 'gas_station', label: 'Petrol', types: ['gas_station'], icon: 'speedometer-outline' },
    { id: 'supermarket', label: 'Supermarkets', types: ['supermarket', 'convenience_store'], icon: 'cart-outline' },
    { id: 'hospital', label: 'Hospitals', types: ['hospital', 'doctor', 'pharmacy'], icon: 'medkit-outline' },
];

// Flat list of all supported Google Place types for the "All" query
export const ALL_GOOGLE_TYPES = [
    'restaurant',
    'cafe',
    'bar',
    'bakery',
    'park',
    'tourist_attraction',
    'museum',
    'art_gallery',
    'night_club',
    'stadium',
    'ice_cream_shop',
    'coffee_shop',
    'parking',
    'gas_station',
    'supermarket',
    'convenience_store',
    'hospital',
    'doctor',
    'pharmacy'
];
