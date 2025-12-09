import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface CustomMarkerProps {
    types?: string[];
    selected?: boolean;
}

const getCategoryStyle = (types: string[] = []) => {
    if (types.some(t => ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'].includes(t))) {
        return { color: '#FF7043', icon: 'restaurant' as const };
    }
    if (types.some(t => ['cafe', 'bakery', 'coffee_shop'].includes(t))) {
        return { color: '#FFA726', icon: 'cafe' as const };
    }
    if (types.some(t => ['bar', 'night_club', 'liquor_store'].includes(t))) {
        return { color: '#AB47BC', icon: 'wine' as const };
    }
    if (types.some(t => ['park', 'natural_feature', 'campground'].includes(t))) {
        return { color: '#66BB6A', icon: 'leaf' as const };
    }
    if (types.some(t => ['toilet', 'restroom'].includes(t))) {
        return { color: '#42A5F5', icon: 'water' as const }; // Using water as a generic clean/services icon or we can use 'male-female'
    }
    if (types.some(t => ['store', 'shopping_mall', 'clothing_store'].includes(t))) {
        return { color: '#26C6DA', icon: 'cart' as const };
    }
    // Default
    return { color: '#FF4B4B', icon: 'location' as const };
};

const CustomMarker = ({ types, selected }: CustomMarkerProps) => {
    const { color, icon } = getCategoryStyle(types);

    // AVOID changing size/scale dynamically as it confuses the map renderer
    // and causes the "left corner" bug.
    // We use opacity or a slight color shift instead.

    return (
        <View style={[styles.container, selected && styles.selectedContainer]}>
            <View style={[styles.bubble, { backgroundColor: color }, selected && { borderColor: '#000', borderWidth: 2 }]}>
                <Ionicons name={icon} size={20} color="#FFF" />
            </View>
            <View style={[styles.arrowBorder, { borderTopColor: 'rgba(0,0,0,0.2)' }]} />
            <View style={[styles.arrow, { borderTopColor: color }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,  // increase touch area
        height: 60,
    },
    bubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 2,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    arrowBorder: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 8,
        alignSelf: 'center',
        marginTop: -0.5,
    },
    arrow: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 8,
        alignSelf: 'center',
        marginTop: -16, // overlap to cover border
        zIndex: 1,
    },
    selectedContainer: {
        zIndex: 10, // Ensure selected pin is on top
    },
});

export default memo(CustomMarker);
