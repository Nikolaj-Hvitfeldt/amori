import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress the deprecated pointerEvents warning from React Navigation
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('props.pointerEvents is deprecated')) {
    return;
  }
  originalWarn(...args);
};

export default function App() {
  return <AppNavigator />;
}
