/**
 * Examples of using HogTyped with an existing PostHog instance
 */

import posthog from 'posthog-js';
import hogtyped, { Analytics } from '../dist/posthog.generated';

// ============================================
// OPTION 1: Pass instance to constructor
// ============================================

// Your existing PostHog setup (already configured)
const myPostHog = posthog.init('phc_your_api_key', {
  api_host: 'https://app.posthog.com',
  persistence: 'localStorage',
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  // ... your custom config
});

// Create a new HogTyped wrapper using YOUR instance
const myAnalytics = new Analytics(myPostHog);

// Now use type-safe events with your existing PostHog setup
myAnalytics.capture('simple_event', {
  name: 'Product View',
  count: 1
});

// ============================================
// OPTION 2: Use setInstance() method
// ============================================

// Start with the default singleton
// Later, update it to use your configured instance
hogtyped.setInstance(myPostHog);

// Now it uses your instance
hogtyped.capture('complex_event', {
  id: '123',
  status: 'completed'
});

// ============================================
// OPTION 3: Multiple PostHog projects
// ============================================

// You might have multiple PostHog projects
const projectA = posthog.init('phc_project_a_key', {
  api_host: 'https://app.posthog.com',
  persistence_name: 'project_a'
});

const projectB = posthog.init('phc_project_b_key', {
  api_host: 'https://eu.posthog.com',
  persistence_name: 'project_b'
});

// Create separate wrappers for each
const analyticsA = new Analytics(projectA);
const analyticsB = new Analytics(projectB);

// Track to different projects with type safety
analyticsA.capture('simple_event', {
  name: 'Event for Project A',
  count: 1
});

analyticsB.capture('simple_event', {
  name: 'Event for Project B',
  count: 2
});

// ============================================
// OPTION 4: Next.js / SSR with client instance
// ============================================

// In your app initialization (e.g., _app.tsx)
import { useEffect, useState } from 'react';

function MyApp() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      const ph = posthog.init('phc_your_key', {
        loaded: (posthog) => {
          // Create wrapper with the loaded instance
          const wrapper = new Analytics(posthog);
          setAnalytics(wrapper);
        }
      });
    }
  }, []);

  // Use analytics safely
  if (analytics) {
    analytics.capture('page_view', { path: window.location.pathname });
  }
}

// ============================================
// OPTION 5: Testing with mock instance
// ============================================

describe('Analytics Tests', () => {
  let mockPostHog: any;
  let testAnalytics: Analytics;

  beforeEach(() => {
    // Create a mock PostHog instance
    mockPostHog = {
      capture: jest.fn(),
      identify: jest.fn(),
      getFeatureFlag: jest.fn().mockReturnValue('variant-a')
    };

    // Use mock in wrapper
    testAnalytics = new Analytics(mockPostHog);
  });

  test('should track events with correct properties', () => {
    testAnalytics.capture('simple_event', {
      name: 'Test Event',
      count: 5
    });

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      'simple_event',
      { name: 'Test Event', count: 5 }
    );
  });
});

// ============================================
// OPTION 6: Access underlying instance
// ============================================

// Access the underlying posthog-js for advanced features
const analytics = new Analytics(myPostHog);

// Use type-safe wrapper
analytics.capture('button_clicked', {
  button_id: 'submit'
});

// Access underlying instance for session replay
analytics.posthog.startSessionRecording();

// Check feature flags directly
const flags = analytics.posthog.getAllFlags();

// Use any other posthog-js feature
analytics.posthog.debug();

// ============================================
// WHY THIS IS USEFUL
// ============================================

/*
1. **Existing Setup**: Don't need to change your PostHog initialization
2. **Multiple Projects**: Can use different wrappers for different projects
3. **Custom Config**: Keep all your custom PostHog configuration
4. **Testing**: Can inject mock instances for testing
5. **SSR**: Can handle client-only initialization properly
6. **Advanced Features**: Access underlying instance for features not in wrapper
*/