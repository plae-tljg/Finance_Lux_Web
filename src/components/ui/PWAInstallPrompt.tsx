import { usePWAInstall } from '../../hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { installApp, isInstallable, isInstalled } = usePWAInstall();

  if (isInstalled || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <button
        onClick={installApp}
        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full shadow-2xl hover:shadow-violet-500/50 hover:scale-105 transition-all flex items-center gap-2"
      >
        <span className="text-xl">📲</span>
        <span className="font-semibold">Install App</span>
      </button>
    </div>
  );
}