import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    UNIVEST_API_TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMTgiLCJpYXQiOjE1MTYyMzkwMjJ9.oab07p4mUDggobg3w7rm3Doc1ZS9VV0eVl5rrRf4lC8",
    UNIVEST_API_URL: "https://uat-api.univest.in/api/utility/generate-image",
    UNIVEST_BULK_API_URL: "https://api.univest.in/api/utility/generate-images",
    GOOGLE_SERVICE_ACCOUNT_JSON: "",
    GOOGLE_DRIVE_FOLDER_ID: "",
    BASE_URL: "https://internal.univest.in/seo-image-generator/api/",
  },
};

export default nextConfig;
