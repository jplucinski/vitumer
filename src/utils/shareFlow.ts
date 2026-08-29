function utf8ToBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function base64ToUtf8(base64: string): string {
  return decodeURIComponent(escape(atob(base64)));
}

function padBase64(base64: string): string {
  const remainder = base64.length % 4;
  if (remainder === 0) return base64;
  return base64 + '='.repeat(4 - remainder);
}

export function encodeFlowParam(dsl: string): string {
  return encodeURIComponent(utf8ToBase64(dsl));
}

export function decodeFlowParam(param: string): string {
  const base64 = padBase64(param.replace(/ /g, '+'));
  return base64ToUtf8(base64);
}

export function buildShareUrl(origin: string, dsl: string): string {
  return `${origin}/?flow=${encodeFlowParam(dsl)}`;
}
