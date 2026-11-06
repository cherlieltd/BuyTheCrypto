export const fallbackFaqs = [
  {
    question: "Who processes my purchase?",
    answer:
      "BuyTheCrypto does not hold customer fiat, cryptocurrency, card details, or private keys. Checkout, identity verification, and crypto delivery are handled by Transak.",
  },
  {
    question: "Which countries and payment methods are available?",
    answer:
      "Availability depends on Transak coverage for your location, the selected asset, and the payment method. The buy flow lists options returned by Transak for the configured environment.",
  },
  {
    question: "When is an order marked completed?",
    answer:
      "An order is shown as completed only after BuyTheCrypto verifies a Transak webhook or refreshes the order from the Transak partner API. Closing the widget does not mark a purchase complete.",
  },
  {
    question: "Where is cryptocurrency sent?",
    answer:
      "You provide an external wallet address that you control. BuyTheCrypto does not create a custodial wallet and does not ask for a seed phrase.",
  },
];
