import CircuitBreaker from 'opossum';
import { logger } from 'shared';

/**
 * Creates a configured Opossum circuit breaker for an async function.
 * 
 * @param {Function} asyncFunction - The async function to wrap.
 * @param {Object} options - Opossum options.
 * @param {Function} fallbackFunction - Optional fallback function when the circuit is open or times out.
 * @returns {CircuitBreaker} The configured circuit breaker instance.
 */
export function createCircuitBreaker(asyncFunction, options = {}, fallbackFunction = null) {
  const defaultOptions = {
    timeout: 15000, // 15 seconds
    errorThresholdPercentage: 50, // Trip if 50% of requests fail
    resetTimeout: 30000, // Wait 30 seconds before half-opening
    capacity: 10, // Max concurrent requests
    ...options
  };
  
  const breaker = new CircuitBreaker(asyncFunction, defaultOptions);
  
  // Setup event listeners for logging
  breaker.on('open', () => logger.warn(`🔥 Circuit breaker opened. Failing fast...`));
  breaker.on('halfOpen', () => logger.info(`⏱️ Circuit breaker half-open. Testing recovery...`));
  breaker.on('close', () => logger.info(`✅ Circuit breaker closed. Service recovered.`));
  breaker.on('fallback', (result, err) => {
    logger.warn(`⚠️ Circuit breaker fallback triggered: ${err ? err.message : 'Timeout/Capacity reached'}`);
  });

  if (fallbackFunction) {
    breaker.fallback(fallbackFunction);
  }
  
  return breaker;
}
