export interface MerchShareDetails {
  title: string;
  sellerName: string;
  priceDisplay: string;
  url: string;
}

export function buildMerchShareText(details: MerchShareDetails) {
  return `${details.title} by ${details.sellerName} — ${details.priceDisplay}`;
}

export function buildMerchShareUrls(details: MerchShareDetails) {
  const text = buildMerchShareText(details);
  const textWithUrl = `${text}\n${details.url}`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(details.url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(details.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(details.url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(textWithUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(`Check out ${details.title}`)}&body=${encodeURIComponent(textWithUrl)}`,
    sms: `sms:?body=${encodeURIComponent(textWithUrl)}`,
  };
}

export function buildMerchFanUpdate(details: MerchShareDetails) {
  return {
    subject: `New merch: ${details.title}`,
    body: `I just added ${details.title} to my OlogyWood shop.\n\n${details.priceDisplay}\n\nShop now: ${details.url}`,
  };
}
