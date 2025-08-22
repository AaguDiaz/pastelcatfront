export async function debugFetch(url: string, options: RequestInit = {}) {
  const safeOptions: RequestInit & { headers?: Record<string, string> } = {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
    },
  };

  if (safeOptions.headers && 'Authorization' in safeOptions.headers) {
    safeOptions.headers.Authorization = '***';
  }

  console.log('fetch request', { url, ...safeOptions });

  try {
    const response = await fetch(url, options);
    const clone = response.clone();
    let body: string | undefined;
    try {
      body = await clone.text();
    } catch {
      body = undefined;
    }
    console.log('fetch response', { url, status: response.status, body });
    return response;
  } catch (error) {
    console.error('fetch error', { url, error });
    throw error;
  }
}