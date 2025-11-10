export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', reg);
      } catch (err) {
        console.error('❌ Error registrando SW:', err);
      }
    });
  }
}
