import type { AppConfig } from "./types";

export const APP_CONFIG: AppConfig = {
  name: "MuseKit",
  description: "The complete SaaS platform",
  url: "https://musekit.example.com",
  support: "support@musekit.example.com",
  billing: "stripe",
  features: {
    "teams": true,
    "api_access": false,
    "custom_domain": false,
  }
};
