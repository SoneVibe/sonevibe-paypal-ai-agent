export const PAYPAL_SDK_URL = "https://www.sandbox.paypal.com/web-sdk/v6/core";

export type PayPalApproveData = { orderId: string };
export type PayPalError = { code?: string; message?: string };

export type PaymentSession = {
  start(options: { presentationMode: "auto" }, orderPromise: Promise<{ orderId: string }>): Promise<void>;
  hasReturned?: () => boolean;
  resume?: () => Promise<void>;
};

export type PayPalSdkInstance = {
  findEligibleMethods(options?: { currencyCode?: string }): Promise<{
    isEligible: (method: string) => boolean;
  }>;
  createPayPalOneTimePaymentSession(options: {
    onApprove: (data: PayPalApproveData) => Promise<void> | void;
    onCancel?: (data: { orderId?: string }) => void;
    onError?: (error: PayPalError) => void;
  }): PaymentSession;
};

export type PayPalNamespace = {
  createInstance(options: {
    clientId: string;
    components?: string[];
    pageType?: string;
  }): Promise<PayPalSdkInstance>;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

export function shouldUseMockCheckout(options: {
  healthMock: boolean;
  envMock: boolean;
  clientId: string;
}): boolean {
  return options.healthMock || options.envMock || options.clientId === "MOCK";
}

export function isSafeInvoiceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }
    return url.hostname === "www.sandbox.paypal.com" || url.hostname === "example.invalid";
  } catch {
    return false;
  }
}

let loading: Promise<PayPalNamespace> | null = null;

export function loadPayPalSdk(): Promise<PayPalNamespace> {
  if (window.paypal?.createInstance) {
    return Promise.resolve(window.paypal);
  }
  if (loading) {
    return loading;
  }
  loading = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.paypal?.createInstance) {
        resolve(window.paypal);
      } else {
        loading = null;
        reject(new Error("PayPal SDK missing"));
      }
    };
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PAYPAL_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => {
          loading = null;
          reject(new Error("PayPal SDK failed"));
        },
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = PAYPAL_SDK_URL;
    script.async = true;
    script.onload = finish;
    script.onerror = () => {
      loading = null;
      reject(new Error("PayPal SDK failed"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
