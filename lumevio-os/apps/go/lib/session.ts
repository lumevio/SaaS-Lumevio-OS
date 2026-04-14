export function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const key = "lumevio_go_session";
  let value = localStorage.getItem(key);

  if (!value) {
    value =
      "sess_" +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36);
    localStorage.setItem(key, value);
  }

  return value;
}