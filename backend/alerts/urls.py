from django.urls import path
from .views import (
    LiveAlertStreamView,
    TriggerTestAlertView,
    overlay_page_view,
)

urlpatterns = [
    path('api/alerts/stream/<uuid:overlay_token>/', LiveAlertStreamView.as_view(), name='alert-stream'),
    path('api/alerts/test/', TriggerTestAlertView.as_view(), name='alert-test-trigger'),
    path('overlay/<uuid:overlay_token>/', overlay_page_view, name='overlay-page'),
]
