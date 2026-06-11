export const Colors = {
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#0F766E',

  accent: '#F97316',

  white: '#FFFFFF',
  background: '#ECFDF5',
  cardBg: '#FFFFFF',
  surface: '#F8FFFB',
  border: '#D1FAE5',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  success: '#10B981',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',

  mapOverlay: 'rgba(16, 185, 129, 0.12)',
  shadow: 'rgba(16, 185, 129, 0.18)',

  tabBarBg: '#FFFFFF',
  tabBarActive: '#10B981',
  tabBarInactive: '#94A3B8',
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  label: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Redemption City, Nigeria coordinates
export const REDEMPTION_CITY = {
  latitude: 6.4531,
  longitude: 3.3958,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const CATEGORY_ICONS: Record<string, string> = {
  Auditoriums: 'business',
  Halls: 'grid',
  Banks: 'card',
  Restaurants: 'restaurant',
  'Bus Stops': 'bus',
  Markets: 'storefront',
  Hotels: 'bed',
  Clinics: 'medical',
};

export const SAVED_PLACES = [
  { id: '1', name: 'Auditorium', icon: 'business', lat: 6.4631, lng: 3.7225 },
  { id: '2', name: 'Youth Centre', icon: 'people', lat: 6.8134, lng: 3.4579 },
  { id: '3', name: 'Market', icon: 'storefront', lat: 6.8495, lng: 3.7235 },
];