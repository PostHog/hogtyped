/**
 * React Context Pattern for HogTyped
 * Shows how to integrate HogTyped with your existing PostHog setup in React
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import posthog, { PostHog as PostHogInstance } from 'posthog-js';
import { Analytics } from '../dist/posthog.generated';

// ============================================
// Create Analytics Context
// ============================================

interface AnalyticsContextValue {
  analytics: Analytics | null;
  posthog: PostHogInstance | null;
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  analytics: null,
  posthog: null,
  isReady: false
});

// ============================================
// Analytics Provider Component
// ============================================

interface AnalyticsProviderProps {
  children: ReactNode;
  apiKey: string;
  options?: Parameters<typeof posthog.init>[1];
}

export function AnalyticsProvider({
  children,
  apiKey,
  options = {}
}: AnalyticsProviderProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [posthogInstance, setPosthogInstance] = useState<PostHogInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    // Initialize PostHog with your configuration
    const ph = posthog.init(apiKey, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      ...options,
      loaded: (instance) => {
        // Create HogTyped wrapper with the loaded instance
        const wrapper = new Analytics(instance);

        setAnalytics(wrapper);
        setPosthogInstance(instance);
        setIsReady(true);

        // Call original loaded callback if provided
        if (options.loaded) {
          options.loaded(instance);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (ph) {
        ph.reset();
      }
    };
  }, [apiKey]);

  return (
    <AnalyticsContext.Provider value={{
      analytics,
      posthog: posthogInstance,
      isReady
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================
// Hook to use analytics
// ============================================

export function useAnalytics() {
  const { analytics, posthog, isReady } = useContext(AnalyticsContext);

  return {
    // Type-safe event tracking
    track: (event: Parameters<Analytics['capture']>[0], properties: Parameters<Analytics['capture']>[1]) => {
      if (analytics && isReady) {
        analytics.capture(event, properties);
      }
    },

    // Identify users
    identify: (distinctId: string, properties?: Record<string, any>) => {
      if (analytics && isReady) {
        analytics.identify(distinctId, properties);
      }
    },

    // Check feature flags
    isFeatureEnabled: (key: string): boolean => {
      if (analytics && isReady) {
        return analytics.isFeatureEnabled(key) || false;
      }
      return false;
    },

    // Access underlying PostHog for advanced features
    posthog,

    // Check if analytics is ready
    isReady
  };
}

// ============================================
// Usage in Components
// ============================================

// App.tsx
function App() {
  return (
    <AnalyticsProvider
      apiKey="phc_your_api_key"
      options={{
        persistence: 'localStorage',
        autocapture: true
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
        </Routes>
      </Router>
    </AnalyticsProvider>
  );
}

// HomePage.tsx
function HomePage() {
  const { track, posthog, isReady } = useAnalytics();

  useEffect(() => {
    if (isReady) {
      // Type-safe tracking
      track('page_viewed', {
        page: 'home',
        timestamp: new Date().toISOString()
      });
    }
  }, [isReady]);

  const handleButtonClick = () => {
    // Track with type safety
    track('button_clicked', {
      button_id: 'cta-home',
      page: '/home'
    });

    // Use advanced PostHog features
    if (posthog) {
      posthog.startSessionRecording();
    }
  };

  return (
    <div>
      <h1>Welcome Home</h1>
      <button onClick={handleButtonClick}>
        Get Started
      </button>
    </div>
  );
}

// ProductPage.tsx
function ProductPage() {
  const { track, identify, isFeatureEnabled } = useAnalytics();
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Load product data
    fetchProduct(id).then(data => {
      setProduct(data);

      // Track product view with type safety
      track('product_viewed', {
        product_id: id,
        product_name: data.name,
        price: data.price
      });
    });
  }, [id]);

  const handlePurchase = () => {
    // Check feature flag
    const useNewCheckout = isFeatureEnabled('new-checkout-flow');

    if (useNewCheckout) {
      // Track with new flow
      track('checkout_started_v2', {
        product_id: id,
        flow: 'new'
      });
    } else {
      // Track with old flow
      track('checkout_started', {
        product_id: id,
        flow: 'classic'
      });
    }
  };

  return (
    <div>
      {product && (
        <>
          <h1>{product.name}</h1>
          <button onClick={handlePurchase}>
            Buy Now - ${product.price}
          </button>
        </>
      )}
    </div>
  );
}

// ============================================
// Advanced: With User Authentication
// ============================================

function AuthenticatedApp() {
  const { identify, track } = useAnalytics();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Identify user with type-safe properties
      identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.subscription.plan
      });

      // Track login
      track('user_logged_in', {
        method: 'email',
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, user]);

  return <>{/* Your app content */}</>;
}

// ============================================
// Testing with React Testing Library
// ============================================

import { render, screen, fireEvent } from '@testing-library/react';
import { Analytics } from '../dist/posthog.generated';

// Create mock analytics for testing
const mockPostHog = {
  capture: jest.fn(),
  identify: jest.fn(),
  getFeatureFlag: jest.fn(),
  isFeatureEnabled: jest.fn(),
  reset: jest.fn()
};

const mockAnalytics = new Analytics(mockPostHog);

// Mock the context for tests
const MockAnalyticsProvider = ({ children }) => {
  return (
    <AnalyticsContext.Provider value={{
      analytics: mockAnalytics,
      posthog: mockPostHog,
      isReady: true
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

describe('HomePage', () => {
  it('tracks button click with correct properties', () => {
    render(
      <MockAnalyticsProvider>
        <HomePage />
      </MockAnalyticsProvider>
    );

    const button = screen.getByText('Get Started');
    fireEvent.click(button);

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      'button_clicked',
      {
        button_id: 'cta-home',
        page: '/home'
      }
    );
  });
});

// ============================================
// Benefits of This Pattern
// ============================================

/*
1. **Type Safety**: Full TypeScript support for all events
2. **Existing Setup**: Works with your current PostHog configuration
3. **SSR Safe**: Handles server-side rendering properly
4. **Testing**: Easy to mock for unit tests
5. **Advanced Features**: Access underlying PostHog when needed
6. **Performance**: Single initialization, shared across app
7. **Developer Experience**: Clean API with hooks
*/