// Theme initialization script to prevent flash of unstyled content
(function() {
  try {
    // Check for cached theme settings
    const cachedTheme = localStorage.getItem('bago-cached-theme');
    const isSystemDefault = localStorage.getItem('bago-system-default') === 'true';
    
    let theme = 'light'; // default
    
    if (isSystemDefault) {
      // Use system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (cachedTheme) {
      // Use cached theme
      theme = cachedTheme;
    }
    
    // Apply theme immediately to prevent flash
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Set localStorage for compatibility
    localStorage.setItem('lightTheme', (theme === 'light').toString());
    
    console.log('[Theme Init] Applied initial theme:', theme);
  } catch (error) {
    console.warn('[Theme Init] Error applying initial theme:', error);
    // Fallback to light theme
    document.documentElement.classList.add('light');
  }
})();
