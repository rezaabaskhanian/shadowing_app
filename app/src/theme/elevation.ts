import { Platform } from 'react-native';

export const SHADOWS = {
  level1: Platform.select({
    ios: {
      shadowColor: '#151c27',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
    },
    android: { elevation: 3 },
    default: {},
  }),
  level2: Platform.select({
    ios: {
      shadowColor: '#151c27',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
    },
    android: { elevation: 8 },
    default: {},
  }),
};
