// Custom Map Styles for HappyMap
// Dark theme that matches app design, removes POI clutter

export const darkMapStyle = [
    // Overall dark background
    {
        elementType: 'geometry',
        stylers: [{ color: '#1F1F1F' }]
    },
    // Hide all labels by default
    {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
    },
    // Text styling - subtle
    {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }]
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#1F1F1F' }]
    },
    // Administrative areas
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ color: '#2D2D2D' }]
    },
    {
        featureType: 'administrative.country',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }]
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#bdbdbd' }]
    },
    // Hide all POIs (Points of Interest) - removes clutter!
    {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
    },
    // But keep parks visible with theme color
    {
        featureType: 'poi.park',
        stylers: [{ visibility: 'on' }]
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263238' }]
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }]
    },
    // Roads - clean styling
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#2D2D2D' }]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1F1F1F' }]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#3C3C3C' }]
    },
    {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry',
        stylers: [{ color: '#4e4e4e' }]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#8a8a8a' }]
    },
    // Transit - subtle
    {
        featureType: 'transit',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }]
    },
    {
        featureType: 'transit.station',
        stylers: [{ visibility: 'off' }]
    },
    // Water - nice blue accent
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#1a3a4a' }]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#3d5c6e' }]
    }
];

// Light theme - clean and minimal
export const lightMapStyle = [
    // Hide all POI icons - removes clutter!
    {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
    },
    // Hide all POIs
    {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
    },
    // Keep parks
    {
        featureType: 'poi.park',
        stylers: [{ visibility: 'on' }]
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#c8e6c9' }]
    },
    // Hide transit stations
    {
        featureType: 'transit.station',
        stylers: [{ visibility: 'off' }]
    },
    // Clean road colors
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e0e0e0' }]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
    },
    // Water - nice blue
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#b3e5fc' }]
    }
];
