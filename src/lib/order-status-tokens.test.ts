import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ORDER_STATUS_CONFIG } from "@/lib/tokens";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [
  "new",
  "accepted",
  "in_preparation",
  "out_for_delivery",
  "delivered",
  "undelivered",
  "cancelled",
];

describe("ORDER_STATUS_CONFIG", () => {
  it("covers every OrderStatus with a complete visual config", () => {
    for (const status of ALL_STATUSES) {
      const config = ORDER_STATUS_CONFIG[status];
      assert.ok(config, `missing config for status: ${status}`);
      assert.ok(config.label.trim().length > 0, `empty label for ${status}`);
      assert.ok(config.badgeClass.trim().length > 0, `empty badgeClass for ${status}`);
      assert.ok(config.dotClass.trim().length > 0, `empty dotClass for ${status}`);
    }
  });

  it("has no config entries outside the OrderStatus union", () => {
    for (const key of Object.keys(ORDER_STATUS_CONFIG)) {
      assert.ok(
        (ALL_STATUSES as string[]).includes(key),
        `unexpected status key in config: ${key}`
      );
    }
  });
});

describe("ORDER_STATUS_LABELS", () => {
  it("provides a non-empty Arabic label for every OrderStatus", () => {
    for (const status of ALL_STATUSES) {
      const label = ORDER_STATUS_LABELS[status];
      assert.ok(label && label.trim().length > 0, `missing label for ${status}`);
    }
  });
});
