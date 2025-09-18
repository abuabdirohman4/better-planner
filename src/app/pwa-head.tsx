export default function PWAHead() {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#1496F6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Better Planner" />
      <link rel="apple-touch-icon" href="/images/logo/logo-icon.svg" />
      
      {/* Additional PWA meta tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Better Planner" />
      <meta name="msapplication-TileColor" content="#1496F6" />
      <meta name="msapplication-tap-highlight" content="no" />
      
      {/* Splash screen for iOS */}
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <link rel="apple-touch-startup-image" href="/images/logo/logo-icon.svg" />
    </>
  );
}
