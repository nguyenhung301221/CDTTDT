
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbx2iy3PE0b0Q4wJecz-YVwYxWIsJZwBxrP3iKldW6cFOAZbYdw213C-qpcMzgzDAS1W/exec";

export const getApiUrl = (): string => {
  try {
    const savedUrl = localStorage.getItem('pc06_api_url');
    if (!savedUrl) return DEFAULT_URL;
    
    const trimmed = savedUrl.trim();
    // Kiểm tra xem có phải là URL hợp lệ không
    new URL(trimmed); 
    return trimmed;
  } catch (e) {
    console.error("Invalid URL in storage, falling back to default");
    return DEFAULT_URL;
  }
};

export const setApiUrl = (url: string) => {
  if (url && url.trim().startsWith('https://')) {
    localStorage.setItem('pc06_api_url', url.trim());
  }
};

export const isValidAppsScriptUrl = (url: string): boolean => {
    try {
        const u = new URL(url.trim());
        return u.hostname === 'script.google.com' && u.pathname.endsWith('/exec');
    } catch {
        return false;
    }
};
