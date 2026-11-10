import { describe, expect, it } from "vitest";
import { accountLoginLink } from "@/lib/synapsek-account";

describe("Synapsek account authorization links", () => {
  it("allows only the configured native consent destinations", () => {
    expect(accountLoginLink("https://synapseklabs.org/desktop/authorize#binding=example")).toContain("#binding=example");
    expect(accountLoginLink("https://dyoumwofjcaclunxbeiw.supabase.co/auth/v1/oauth/authorize?state=example")).toContain("state=example");
    for (const url of ["javascript:alert(1)", "https://synapseklabs.org.evil.invalid/desktop/authorize",
      "https://user:password@synapseklabs.org/desktop/authorize", "http://synapseklabs.org/desktop/authorize",
      "https://synapseklabs.org/billing", "https://evil.invalid/"]) expect(accountLoginLink(url)).toBeUndefined();
  });
});
