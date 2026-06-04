export const getFullUrl = (path?: string) => {
  if (!path) return undefined;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl) {
    const origin = baseUrl.replace(/\/api$/, '');
    return origin + path;
  }
  return path;
};
