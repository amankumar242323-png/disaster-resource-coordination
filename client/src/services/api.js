/**
 * Resilient API Service for Disaster Resource Coordination (DRC)
 * Handles simulated network latency, flaky 3G throttling, offline queues,
 * and Idempotency-Key deduplication as described in docs/brief.md.
 */

const IDEMPOTENCY_CACHE = new Map();

export const generateIdempotencyKey = (prefix = 'req') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const simulateNetworkCall = async (networkState, actionName, callback) => {
  if (networkState === 'offline') {
    const error = new Error(`Network Offline: Unable to reach central DRC server for ${actionName}. Queuing in Outbox.`);
    error.isOffline = true;
    throw error;
  }

  if (networkState === 'slow-3g') {
    // Simulate high latency (1800ms) typical in disaster zones with damaged cell towers
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // 10% chance of random packet drop/timeout on bad networks
    if (Math.random() < 0.1) {
      const error = new Error(`Connection Timeout: Request for ${actionName} dropped over congested link. Retrying...`);
      error.isTimeout = true;
      throw error;
    }
  } else {
    // Normal connection: snappy 200ms latency
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return callback();
};

/**
 * Idempotent execution wrapper:
 * Prevents double-allocation of resources or duplicate field reports when retried over shaky links.
 */
export const executeIdempotentRequest = async (idempotencyKey, networkState, actionName, executeFn) => {
  if (idempotencyKey && IDEMPOTENCY_CACHE.has(idempotencyKey)) {
    console.warn(`[IDEMPOTENCY] Replaying cached response for key: ${idempotencyKey}`);
    return {
      data: IDEMPOTENCY_CACHE.get(idempotencyKey),
      cached: true,
      idempotencyKey
    };
  }

  const result = await simulateNetworkCall(networkState, actionName, executeFn);

  if (idempotencyKey) {
    IDEMPOTENCY_CACHE.set(idempotencyKey, result);
  }

  return {
    data: result,
    cached: false,
    idempotencyKey
  };
};
