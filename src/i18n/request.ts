import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/vi.json";

// Cuộn ships one locale (D15): Vietnamese, no locale segment in the URL.
// This config is the same for every request, so there is nothing to read
// from cookies or headers here.
export default getRequestConfig(async () => ({
  locale: "vi",
  messages,
}));
