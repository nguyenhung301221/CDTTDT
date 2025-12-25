
const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbx2iy3PE0b0Q4wJecz-YVwYxWIsJZwBxrP3iKldW6cFOAZbYdw213C-qpcMzgzDAS1W/exec";

export const getApiUrl = (): string => {
  return localStorage.getItem('pc06_api_url') || DEFAULT_URL;
};

export const setApiUrl = (url: string) => {
  if (url.startsWith('https://script.google.com')) {
    localStorage.setItem('pc06_api_url', url);
  }
};

export const API_BASE_URL = getApiUrl();
