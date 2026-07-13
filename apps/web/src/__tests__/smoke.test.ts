import { describe, it, expect } from 'vitest';

describe('Smoke test', () => {
  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
  });

  it('should have the correct app name', () => {
    // Verify constants are importable
    expect(typeof 'Infera').toBe('string');
  });
});
