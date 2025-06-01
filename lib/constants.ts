export const plansMap = [
  {
    id: "basic",
    name: "Basic",
    description: "Get started with SpeakEasy!",
    price: "10",
    items: ["3 Blog Posts", "3 Transcription"],
    paymentLink: "https://buy.stripe.com/test_14A8wOdrMgbDgazfhkgrS00",
    priceId:
      process.env.NODE_ENV === "development"
        ? "price_1RUy8hB7gSHI7iNFeXZoPan3"
        : "",
  },
  {
    id: "pro",
    name: "Pro",
    description: "All Blog Posts, let’s go!",
    price: "19.99",
    items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
    paymentLink: "https://buy.stripe.com/test_7sYeVc5Zke3v3nN4CGgrS01",
    priceId:
      process.env.NODE_ENV === "development"
        ? "price_1RUy8hB7gSHI7iNFI2GlZ4jm"
        : "",
  },
];

export const ORIGIN_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://example.dev";
