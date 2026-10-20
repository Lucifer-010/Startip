from django.urls import path
from .views import (
    AuthChallengeView,
    AuthVerifyView,
    AuthLogoutView,
    HealthCheckView,
)

urlpatterns = [
    path('auth/challenge/', AuthChallengeView.as_view(), name='auth-challenge'),
    path('auth/verify/', AuthVerifyView.as_view(), name='auth-verify'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
