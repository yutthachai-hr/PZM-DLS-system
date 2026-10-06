export const PAYMENT_METHODS = ["CASH", "QR", "EDC", "COUPON"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

export const PLATFORMS = ["GRAB", "LINEMAN", "SHOPEE", "FOODPANDA_OTHER"] as const;
export type PlatformKey = (typeof PLATFORMS)[number];

export const PAYMENT_LABEL: Record<PaymentMethodKey, { th: string; en: string }> = {
  CASH: { th: "เงินสด", en: "Cash" },
  QR: { th: "สแกน QR/โอน", en: "QR / Transfer" },
  EDC: { th: "บัตรเครดิต EDC", en: "Credit card" },
  COUPON: { th: "คูปอง/ส่วนลด", en: "Coupon / Discount" },
};

export const PLATFORM_LABEL: Record<PlatformKey, string> = {
  GRAB: "GrabFood",
  LINEMAN: "LINE MAN",
  SHOPEE: "ShopeeFood",
  FOODPANDA_OTHER: "Foodpanda / อื่นๆ",
};


/** Platform brand colours — banner chrome only, not used for chart series. */
export const PLATFORM_STYLE: Record<PlatformKey, { bg: string; tag: string }> = {
  GRAB: { bg: "linear-gradient(135deg,#00b14f 0%,#00813a 100%)", tag: "Grab" },
  LINEMAN: { bg: "linear-gradient(135deg,#111312 0%,#1f2a22 100%)", tag: "LINE MAN" },
  SHOPEE: { bg: "linear-gradient(135deg,#ee4d2d 0%,#c73a1d 100%)", tag: "Shopee" },
  FOODPANDA_OTHER: { bg: "linear-gradient(135deg,#d70f64 0%,#a10b4b 100%)", tag: "อื่นๆ" },
};

/** Platforms that get the large banner card on the daily form. */
export const FEATURED_PLATFORMS: PlatformKey[] = ["GRAB", "LINEMAN"];

export const ROLE_LABEL = {
  STAFF: "พนักงาน",
  MANAGER: "ผู้จัดการ",
  ADMIN: "แอดมิน",
} as const;

export const STATUS_LABEL = {
  DRAFT: "ร่าง",
  SUBMITTED: "ส่งแล้ว",
  APPROVED: "อนุมัติ",
} as const;

export const CHECKLIST = [
  { key: "chkZReport", label: "Z-Report" },
  { key: "chkEdcSlip", label: "สลิป EDC" },
  { key: "chkTransfer", label: "สลิปโอนเงิน" },
  { key: "chkPayIn", label: "Pay-in Slip" },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]["key"];

/** |cash diff| above this needs a note before submit. */
export const DIFF_ALERT = 100;

/** Chart series colours (CSS vars in globals.css; order validated for colour-blind safety). */
export const PLATFORM_SERIES = [
  { key: "GRAB", label: "GrabFood", color: "var(--s-grab)" },
  { key: "LINEMAN", label: "LINE MAN", color: "var(--s-lineman)" },
  { key: "SHOPEE", label: "ShopeeFood", color: "var(--s-shopee)" },
  { key: "FOODPANDA_OTHER", label: "อื่นๆ", color: "var(--s-other)" },
] as const;
