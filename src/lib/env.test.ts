import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_BOOKING_PATH, getBookingUrl } from "./env";

describe("getBookingUrl", () => {
  const prevPublic = process.env.NEXT_PUBLIC_BOOKING_URL;
  const prev = process.env.BOOKING_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BOOKING_URL = prevPublic;
    process.env.BOOKING_URL = prev;
  });

  it("defaults to on-site /p#book", () => {
    delete process.env.NEXT_PUBLIC_BOOKING_URL;
    delete process.env.BOOKING_URL;
    expect(getBookingUrl()).toBe(DEFAULT_BOOKING_PATH);
  });

  it("rejects karrotdigital.com contact URLs that redirect-loop", () => {
    process.env.BOOKING_URL = "https://karrotdigital.com/contact";
    expect(getBookingUrl()).toBe(DEFAULT_BOOKING_PATH);
  });

  it("allows relative booking paths", () => {
    process.env.BOOKING_URL = "/p#book";
    expect(getBookingUrl()).toBe("/p#book");
  });
});
