"""
Examples of using HogTyped with an existing PostHog instance
"""

import posthog
from posthog_generated import hogtyped, PostHog

# ============================================
# OPTION 1: Pass instance to constructor
# ============================================

# Your existing PostHog client (already configured)
my_posthog = posthog.Client(
    api_key='phc_your_api_key',
    host='https://app.posthog.com',
    debug=True,
    on_error=lambda e: print(f"PostHog error: {e}")
)

# Create a new HogTyped wrapper using YOUR instance
my_analytics = PostHog(posthog_instance=my_posthog)

# Now use type-safe events with your existing PostHog setup
my_analytics.capture(
    distinct_id='user-123',
    event='simple_event',
    properties={
        'name': 'Product View',
        'count': 1
    }
)

# ============================================
# OPTION 2: Use set_instance() method
# ============================================

# Start with the default singleton
# Later, update it to use your configured instance
hogtyped.set_instance(my_posthog)

# Now it uses your instance
hogtyped.capture(
    distinct_id='user-123',
    event='complex_event',
    properties={
        'id': '123',
        'status': 'completed'
    }
)

# ============================================
# OPTION 3: Multiple PostHog projects
# ============================================

# You might have multiple PostHog projects
project_a = posthog.Client(
    api_key='phc_project_a_key',
    host='https://app.posthog.com'
)

project_b = posthog.Client(
    api_key='phc_project_b_key',
    host='https://eu.posthog.com'
)

# Create separate wrappers for each
analytics_a = PostHog(posthog_instance=project_a)
analytics_b = PostHog(posthog_instance=project_b)

# Track to different projects with type safety
analytics_a.capture(
    distinct_id='user-123',
    event='simple_event',
    properties={
        'name': 'Event for Project A',
        'count': 1
    }
)

analytics_b.capture(
    distinct_id='user-456',
    event='simple_event',
    properties={
        'name': 'Event for Project B',
        'count': 2
    }
)

# ============================================
# OPTION 4: Django integration
# ============================================

# In your Django settings
from django.conf import settings

# Your existing PostHog setup in Django
django_posthog = posthog.Client(
    api_key=settings.POSTHOG_API_KEY,
    host=settings.POSTHOG_HOST
)

# Create wrapper with Django's instance
django_analytics = PostHog(posthog_instance=django_posthog)

# In your views
def track_user_action(user, action):
    django_analytics.capture(
        distinct_id=str(user.id),
        event='user_action',
        properties={
            'action': action,
            'email': user.email
        }
    )

# ============================================
# OPTION 5: Flask integration
# ============================================

from flask import Flask, g

app = Flask(__name__)

# Initialize PostHog once for your Flask app
flask_posthog = posthog.Client(
    api_key='phc_flask_key',
    host='https://app.posthog.com'
)

# Create wrapper
flask_analytics = PostHog(posthog_instance=flask_posthog)

@app.before_request
def before_request():
    g.analytics = flask_analytics

@app.route('/api/action')
def track_action():
    g.analytics.capture(
        distinct_id='user-123',
        event='api_call',
        properties={'endpoint': '/api/action'}
    )
    return {'status': 'ok'}

# ============================================
# OPTION 6: Testing with mock instance
# ============================================

# For unit tests
class MockPostHog:
    def capture(self, **kwargs):
        print(f"Mock capture: {kwargs}")

    def identify(self, **kwargs):
        print(f"Mock identify: {kwargs}")

    def feature_enabled(self, key, distinct_id):
        return True

# Use mock in tests
test_analytics = PostHog(posthog_instance=MockPostHog())
test_analytics.capture(
    distinct_id='test-user',
    event='simple_event',
    properties={'name': 'Test', 'count': 1}
)

# ============================================
# OPTION 7: Async/Celery workers
# ============================================

from celery import Celery

# Configure PostHog for background workers
worker_posthog = posthog.Client(
    api_key='phc_worker_key',
    host='https://app.posthog.com',
    sync_mode=False  # Use async mode for better performance
)

worker_analytics = PostHog(posthog_instance=worker_posthog)

@app.task
def process_user_action(user_id, action):
    worker_analytics.capture(
        distinct_id=user_id,
        event='background_action',
        properties={'action': action}
    )

# ============================================
# OPTION 8: Access underlying instance
# ============================================

# Create wrapper
analytics = PostHog(posthog_instance=my_posthog)

# Use type-safe wrapper
analytics.capture(
    distinct_id='user-123',
    event='button_clicked',
    properties={'button_id': 'submit'}
)

# Access underlying PostHog for advanced features
analytics.posthog.flush()  # Force flush events
analytics.posthog.debug = True  # Enable debug mode
analytics.posthog.disabled = False  # Enable/disable tracking

# Use any other posthog-python feature directly
analytics.posthog.capture(
    distinct_id='user-123',
    event='$pageview',
    properties={'$current_url': 'https://example.com'}
)

# ============================================
# WHY THIS IS USEFUL
# ============================================

"""
1. **Existing Setup**: Don't need to change your PostHog initialization
2. **Multiple Projects**: Can use different wrappers for different projects
3. **Framework Integration**: Works with Django, Flask, FastAPI setups
4. **Testing**: Can inject mock instances for testing
5. **Background Workers**: Can use with Celery, RQ, etc.
6. **Custom Config**: Keep all your custom PostHog configuration
7. **Advanced Features**: Access underlying instance for features not in wrapper
"""