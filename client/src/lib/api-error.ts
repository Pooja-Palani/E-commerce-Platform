export async function getErrorMessage(
  res: Response,
  defaultMessage = "Something went wrong",
): Promise<string> {
  try {
    const contentType = res.headers.get("Content-Type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object" && "message" in data) {
        const message = (data as any).message;
        if (typeof message === "string" && message.trim().length > 0) {
          return message;
        }
      }
    } else {
      const text = await res.text();
      if (text.trim().length > 0) {
        return text;
      }
    }
  } catch {
    // Ignore parse errors and fall back to default message below.
  }

  if (res.status >= 400) {
    return `${defaultMessage} (HTTP ${res.status})`;
  }

  return defaultMessage;
}

