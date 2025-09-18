/**
 * Node.js server using GENERATED PostHog wrapper
 *
 * First, generate your wrapper:
 * npx hogtyped generate -o ./lib/posthog.js
 *
 * This creates a file with schemas baked in - no runtime loading!
 */

// Import the generated wrapper - everything is embedded
const { posthog } = require('./lib/posthog.generated');

// No need to configure - it's all baked in!
// Schemas are embedded, validation is ready, types are set

// Example Express.js middleware
const express = require('express');
const app = express();

app.use(express.json());

// Track API requests
app.use((req, res, next) => {
  posthog.capture('api_request', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  next();
});

// User signup endpoint
app.post('/api/signup', (req, res) => {
  const { email, plan } = req.body;
  const userId = 'user-' + Date.now();

  try {
    // This will validate against schema
    posthog.capture('user_signed_up', {
      userId,
      email,
      plan,
      signupMethod: 'email'
    });

    posthog.identify(userId, {
      email,
      plan
    });

    res.json({ success: true, userId });
  } catch (error) {
    // Schema validation failed
    console.error('Invalid event data:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Feature usage tracking
app.post('/api/track', (req, res) => {
  const { event, properties } = req.body;

  // Validate event before sending
  const validation = posthog.validateEvent(event, properties);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid event properties',
      details: validation.errors
    });
  }

  posthog.capture(event, properties);
  res.json({ success: true });
});

// Health check with feature flag
app.get('/health', (req, res) => {
  const isNewDashboard = posthog.isFeatureEnabled('new-dashboard');

  res.json({
    status: 'healthy',
    features: {
      newDashboard: isNewDashboard
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Using GENERATED PostHog wrapper with embedded schemas');
  console.log('Benefits:');
  console.log('  - No schema files to load at runtime');
  console.log('  - Instant validation (pre-compiled)');
  console.log('  - Works in serverless/edge functions');
  console.log('  - Type-safe with TypeScript');
});