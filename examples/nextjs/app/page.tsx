'use client';

import { useState } from 'react';
// Import the GENERATED wrapper - everything is baked in!
import { posthog } from '@/lib/posthog';

export default function HomePage() {
  const [email, setEmail] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    // TypeScript ensures all required properties are provided
    // IDE autocompletes event names and properties!
    posthog.capture('user_signed_up', {
      userId: `user-${Date.now()}`,
      email: email,
      plan: 'free',
      signupMethod: 'email',
      timestamp: new Date().toISOString()
    });

    // Track form submission
    posthog.capture('form_submitted', {
      formId: 'signup-form',
      formName: 'Newsletter Signup',
      success: true
    });

    alert('Thanks for signing up!');
    setEmail('');
  };

  const handleButtonClick = (buttonId: string) => {
    // Full type safety - TypeScript knows the schema!
    posthog.capture('button_clicked', {
      buttonId,
      buttonText: buttonId.replace('-', ' ').toUpperCase(),
      page: '/',
      component: 'HomePage'
    });
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Next.js + HogTyped Example
      </h1>

      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Benefits of Generated Wrapper:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>✅ Schemas embedded at build time</li>
          <li>✅ No runtime loading or network requests</li>
          <li>✅ Full TypeScript autocomplete</li>
          <li>✅ Works in Server Components</li>
          <li>✅ Works in API routes</li>
          <li>✅ Smaller bundle size</li>
        </ul>
      </div>

      <form onSubmit={handleSignup} className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold">Newsletter Signup</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
      </form>

      <div className="space-x-4">
        <button
          onClick={() => handleButtonClick('learn-more')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Learn More
        </button>

        <button
          onClick={() => handleButtonClick('get-started')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Get Started
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm">
          <strong>Developer Tip:</strong> Try typing{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">posthog.capture('</code>
          {' '}in your IDE to see all available events autocomplete!
        </p>
      </div>
    </main>
  );
}