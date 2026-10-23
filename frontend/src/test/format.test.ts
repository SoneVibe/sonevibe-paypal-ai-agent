import { describe, expect, it } from "vitest";
import { assertNoMoneyFields } from "../api/guard";
import { formatMoney } from "../format/money";
import { isSafeInvoiceUrl, shouldUseMockCheckout } from "../paypal/sdk";

describe("money display", () => {
  it("formats decimal strings and never invents a price", () => {
    expect(formatMoney(null)).toBe("TBD");
    expect(formatMoney("100.00")).toMatch(/\$100\.00/);
    expect(formatMoney("200.50")).toMatch(/\$200\.50/);
    expect(formatMoney("100")).toBe("TBD");
    expect(formatMoney("free")).toBe("TBD");
  });
});

describe("request guard", () => {
  it("rejects amount fields and allows service ids with quantities", () => {
    expect(() => assertNoMoneyFields({ items: [{ serviceId: "svc_security_mock", quantity: 2 }] })).not.toThrow();
    expect(() => assertNoMoneyFields({ items: [{ serviceId: "svc", quantity: 1, unitPrice: "10.00" }] })).toThrow(
      /Refusing to send/,
    );
    expect(() => assertNoMoneyFields({ total: "10.00" })).toThrow(/Refusing to send/);
  });
});

describe("sandbox checkout guards", () => {
  it("uses mock checkout when health, the env flag, or the client id says so", () => {
    expect(shouldUseMockCheckout({ healthMock: true, envMock: false, clientId: "abc" })).toBe(true);
    expect(shouldUseMockCheckout({ healthMock: false, envMock: true, clientId: "abc" })).toBe(true);
    expect(shouldUseMockCheckout({ healthMock: false, envMock: false, clientId: "MOCK" })).toBe(true);
    expect(shouldUseMockCheckout({ healthMock: false, envMock: false, clientId: "sb-client" })).toBe(false);
  });

  it("only links sandbox invoice urls", () => {
    expect(isSafeInvoiceUrl("https://www.sandbox.paypal.com/invoice/p/#ABC")).toBe(true);
    expect(isSafeInvoiceUrl("https://example.invalid/mock-invoice/INV2-MOCK-0001")).toBe(true);
    expect(isSafeInvoiceUrl("https://www.paypal.com/invoice/p/#ABC")).toBe(false);
    expect(isSafeInvoiceUrl("http://www.sandbox.paypal.com/invoice")).toBe(false);
    expect(isSafeInvoiceUrl("javascript:alert(1)")).toBe(false);
  });
});
