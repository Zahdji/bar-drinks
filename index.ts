import { registerRootComponent } from 'expo';
import App from './App';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    body, input, button, select, textarea {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: optimizeLegibility !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif;
    }
  `;
  document.head.appendChild(style);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
