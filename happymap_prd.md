# HappyMap - Product Requirements Document

## Project Description
One-Button Places is a minimalistic mobile application designed to let users quickly discover and save nearby locations using a single tap. The purpose of the app is to simplify the process of finding places such as cafés, restaurants, bars, or parks around the user, without the complexity and noise of traditional mapping apps. The goal is to provide the fastest possible way to discover, save, and organize nearby places with minimal interaction and a clean user interface.

The core functionality revolves around the main concept: when the user presses one primary button on the home screen, the app retrieves their current GPS position and gathers all places within a 50-meter radius using a Places API. The results appear immediately in a clean, scrollable list. Any place from this list can be saved in just one or two taps. Once saved, a place automatically goes into a default list grouped by the city in which it was saved, allowing the user to effortlessly build collections of locations as they explore different places. Users may also create custom lists and manually move saved locations between them if they want more granular organization—for example, “Coffee Spots,” “Date Ideas,” or “Trip to Rome.”

Above the main button, the app features a simple filter bar that allows users to refine the scan results by category. Typical filters include cafés, restaurants, bars, or parks. The interface should remain extremely minimalistic; filters must feel like optional helpers, not extra complexity. The emphasis is always on speed and simplicity.

Users can view and manage their saved places through the “Saved Places” section, which displays lists sorted by city by default. Custom lists can be created at any time, and saved places can be dragged from one list to another. Tags or metadata are kept minimal in the MVP to avoid overcomplication. The app also provides a map view that displays the user’s saved places. If a specific list is selected, only places from that list are shown on the map; if no list is selected, the map shows places from the default list corresponding to the user’s current location. Tapping a place on the map opens a simple details sheet where the user can choose to open navigation to that location via Google Maps or Apple Maps using deep links.

The design philosophy of the app prioritizes minimalism and immediacy. The main button should dominate the screen, and interactions must feel intuitive without requiring onboarding or tutorials. The UI should avoid clutter, excessive menus, or complex settings. Every user journey should be achievable in as few steps as possible: scan → view → save → navigate.

## Product Requirements Document
PRODUCT REQUIREMENTS DOCUMENT (PRD) - HAPPYMAP (ONE-BUTTON PLACES)


**Version:** 1.0

**Date:** October 26, 2023

**Author:** [Your Name/Team]



---


# 1. Introduction


## 1.1 Purpose


This Product Requirements Document (PRD) details the requirements, features, and specifications for "HappyMap" (codenamed: One-Button Places), a minimalistic mobile application designed for the instantaneous discovery, saving, and organization of nearby physical locations. The primary goal is to drastically reduce the interaction cost associated with finding places compared to conventional mapping applications.


## 1.2 Goals


*   **Immediacy:** Achieve a latency of under 2 seconds from button press to displaying nearby scan results (post-GPS acquisition).
*   **Simplicity:** Provide an intuitive experience requiring zero onboarding or tutorials. The interface must be uncluttered and dominated by the primary action button.
*   **Utility:** Enable users to effortlessly build personal, context-aware collections of saved places while traveling or exploring.


## 1.3 Target Audience


The primary persona is the mobile-heavy urban explorer, including digital nomads, travelers, and active locals who prioritize spontaneous discovery over deep research. They require quick, contextual data access on the go.


---


# 2. Scope and Features (MVP)


## 2.1 Core Workflow


The essential user journey must be: **Scan $\ightarrow$ View $\ightarrow$ Save $\ightarrow$ Navigate/Organize**.


### 2.1.1 Discovery (The Scan)


*   **Action:** The user presses the single, dominant button on the home screen.
*   **Process:** The application immediately requests or utilizes the device's current GPS location.
*   **API Call:** A Places API call (Google Places assumed) is executed to retrieve all relevant locations within a **50-meter radius** of the user's current location.
*   **Filtering:** The scan results are subject to the currently selected filter category (Section 2.2.2).
*   **Latency Target:** Results list populated within 2 seconds of button press (excluding initial GPS acquisition time).


### 2.1.2 Results Display


*   Results are displayed in a clean, vertically scrollable list format.
*   Each list item displays essential information (Name, primary Category, Rating, Distance if relevant for context, but not mandatory for MVP list view).
*   Visual feedback on saving state must be clear (Section 2.3.3).


### 2.1.3 Saving Places


*   **One-Tap Save:** Tapping the dedicated "Save" icon (e.g., a plus symbol) on the right side of a list item saves the place instantly to the **Default List** (grouped by the city of capture).
*   **Default Destination:** All newly saved places are automatically added to the default list corresponding to the city where they were saved.


### 2.1.4 Navigation and Detail View


*   Tapping anywhere else on a result list item (not the Save icon) opens a simple Detail Sheet.
*   The Detail Sheet must contain: Place Name, Address, Rating summary, and primary actions:
    *   **Action 1: Open Navigation:** Initiates navigation using platform defaults (Section 2.5).
    *   **Action 2: Manage Lists:** Allows moving the saved place to a different collection (Section 2.4).


## 2.2 Interface and Usability Requirements


### 2.2.1 Minimalism and Styling (See Section 4.1 for detailed constraints)


*   The primary CTA button must visually dominate the home screen.
*   UI elements must utilize flat design, ample white space, and a limited, carefully selected accent color palette.
*   Interactions must be responsive, utilizing subtle micro-animations only for state feedback (e.g., Save confirmation, smooth transitions).


### 2.2.2 Filtering System


*   **Location:** Filters are presented as a compact bar **above** the main scan button.
*   **Fixed MVP Categories:** "All" (Default), "Cafés", "Restaurants", "Bars", "Parks".
*   **Persistence:** The last selected filter must persist across application sessions.
*   **Visual State:** Active filter is indicated by accent color filling/underlining; inactive filters remain neutral. Toggling a filter does **not** trigger a new scan; it only refines the *last* successful scan results.


## 2.3 Saved Places Management


### 2.3.1 Primary View Structure


*   The "Saved Places" section defaults to displaying lists grouped by City (the default list structure).
*   Users can create unlimited custom lists.


### 2.3.2 List Creation


*   Custom lists are created via a dedicated action within the Saved Places management area.


### 2.3.3 Saving Interaction Details


*   **Visual Feedback:** Successful save on the scan results list must show a quick icon transition (Plus $\ightarrow$ Checkmark) and a brief, auto-dismissing inline toast confirming the list (e.g., "Saved to Seattle $\\cdot$ Default list").
*   **Movement:** Moving a place to another list (custom or default) is a secondary action performed only from the Detail Sheet ("Move to list..."). Drag-and-drop is **excluded** for MVP.


## 2.4 Map View


*   **Access:** Accessible via a dedicated tab or persistent navigation element.
*   **Default Filtering:**
    *   If the user is viewing a Custom List, the map displays markers only for that list's contents.
    *   If no specific list is selected (i.e., the default view), the map displays only the places saved in the **City corresponding to the user's current GPS location**, centered around that location.
*   **Fallback Location:** If GPS is unavailable, the map defaults to the saved places of the last successfully viewed city/list context.
*   **Map Interaction:** Tapping a marker opens a simple detail sheet overlay (similar to the main Detail Sheet), offering the navigation action.


---


# 3. Technical Requirements


## 3.1 Technology Stack


*   **Framework:** React Native (Cross-Platform iOS/Android).
*   **Workflow:** Expo Managed Workflow (for simplified setup and API access).
*   **Language:** TypeScript.
*   **State Management:** Minimalist approach—React Hooks or React Context; heavy frameworks (e.g., Redux) disallowed for MVP.


## 3.2 API and Data Requirements


*   **Primary API:** Google Places API (for discovery and data retrieval).
*   **Required Data Fields per Place (Discovery):** Place ID, Name, Latitude/Longitude, Formatted Address, Primary Type/Category, Rating, User Ratings Total, Price Level, Opening Hours (if available), Photo Reference.
*   **Performance Optimization:**
    *   Scans are only triggered by explicit user action (No auto-refresh).
    *   Implement debounce mechanism for rapid button presses.
    *   Implement local caching of recently fetched place data based on proximity/session to minimize unnecessary API calls.


## 3.3 Performance and Latency


*   **Scan Target:** $\\le 2$ seconds (Post-GPS acquisition).
*   **GPS Acquisition Timeout:** If location is not acquired within 5 seconds, display a graceful error message (e.g., "Could not find location. Please check permissions or try again.") instead of indefinite spinning.
*   **Loading Indicator:** A clear, non-intrusive loading state (e.g., a small indicator above the list) must be visible during GPS acquisition and API fetching.


## 3.4 Navigation Deep Linking


*   **Platform Priority:**
    *   Android: Deep link to Google Maps.
    *   iOS: Deep link to Apple Maps by default.
*   **iOS Secondary Option (Optional for MVP):** If Google Maps is detected on iOS, a secondary option in the detail sheet to open in Google Maps can be offered.
*   **Fallback:** If the preferred native app fails to launch or is uninstalled, navigation must default to opening the coordinates in the appropriate platform's **web browser Maps URL** (e.g., Google Maps web).


---


# 4. Non-Functional Requirements


## 4.1 Minimalist Styling Boundaries


*   **Aesthetics:** Clean, calm visual presentation. Avoid skeuomorphism or heavy shadows.
*   **Typography:** Use system fonts or a single, clean sans-serif family.
*   **Color:** Strict limitation to 1–2 primary accent colors used strategically for CTAs and active states, plus neutral backgrounds.
*   **Animations:** Animations must be purely functional (communicating state change, e.g., save confirmation) and must never impede interaction flow or exceed 500ms duration.


## 4.2 Error Handling


*   **Location Services Disabled:** Clear, non-dismissible prompt urging users to enable location services, linking to OS settings if possible.
*   **API Failure:** On scan failure, display an understandable message (e.g., "Scan failed. Please check your connection or try again.") with a simple retry button.


## 4.3 Data Persistence


*   All saved places, list structures (default and custom), and user preferences (like the last active filter) must be persisted locally on the device. No backend synchronization is required for the MVP.


---


# 5. Definitions and Acronyms


| Term | Definition |
| :--- | :--- |
| **MVP** | Minimum Viable Product |
| **CTA** | Call to Action (The main one-button press) |
| **API** | Application Programming Interface (Specifically Places API) |
| **Default List** | The automatically generated list associated with the city where a place was first saved. |
| **Detail Sheet** | The modal view showing full details of a saved or discovered place. |
