"""
URL configuration for StarTip backend & unified frontend serving.
"""
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from alerts.views import overlay_page_view
from .views import (
    embed_widget_view,
    demo_page_view,
    spa_index_view,
    get_frontend_dist_dir,
)

dist_dir = get_frontend_dist_dir()
assets_dir = str(dist_dir / 'assets') if dist_dir and (dist_dir / 'assets').exists() else None

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 Documentation (Swagger & ReDoc)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Domain API routes
    path('api/', include('core.urls')),
    path('api/', include('creators.urls')),
    path('api/', include('payments.urls')),
    path('', include('alerts.urls')),
    path('api/', include('ai_services.urls')),

    # Embed & Standalone Views
    path('embed/<str:username>/', embed_widget_view, name='embed-widget'),
    path('demo-bench/', demo_page_view, name='demo-page'),
]

# Serve compiled frontend static assets (/assets/...)
if assets_dir:
    urlpatterns.append(
        re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': assets_dir})
    )

# Root SPA & Catch-all client routes for SPA (e.g. /dashboard, /demo)
urlpatterns.extend([
    path('', spa_index_view, name='frontend-root'),
    re_path(r'^(?!api/|admin/|overlay/|embed/|static/|assets/|demo-bench/).*$', spa_index_view, name='spa-client-route'),
])
