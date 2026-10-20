from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import CreatorProfile, WidgetConfig
from .serializers import (
    CreatorProfileSerializer,
    CreatorRegistrationSerializer,
    WidgetConfigSerializer,
    CreatorPublicSerializer,
    CreatorDashboardResponseSerializer,
    WidgetEmbedCodeSerializer,
)
from core.auth import IsWalletAuthenticated
from core.models import AuditLog

class CreatorRegisterView(APIView):
    """
    Onboarding: Register a new creator profile associated with the authenticated wallet.
    """
    permission_classes = [IsWalletAuthenticated]

    @extend_schema(
        tags=['Creator Profiles & Dashboard'],
        summary='Register creator profile',
        description='Creates a creator profile for the authenticated wallet address and generates default widget configuration.',
        request=CreatorRegistrationSerializer,
        responses={
            201: CreatorProfileSerializer,
            400: OpenApiResponse(description='Validation error or username already taken'),
            409: OpenApiResponse(description='Wallet already registered as creator'),
        }
    )
    def post(self, request):
        wallet_address = request.wallet_address

        if CreatorProfile.objects.filter(wallet_address=wallet_address).exists():
            return Response(
                {'error': 'A creator profile already exists for this Stellar wallet.'},
                status=status.HTTP_409_CONFLICT
            )

        serializer = CreatorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        creator = serializer.save(wallet_address=wallet_address)
        # Create default widget config
        WidgetConfig.objects.create(creator=creator)

        AuditLog.objects.create(
            wallet_address=wallet_address,
            action='CREATOR_REGISTERED',
            details={'username': creator.username},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(
            CreatorProfileSerializer(creator).data,
            status=status.HTTP_201_CREATED
        )


class CreatorMeView(APIView):
    """
    Manage the currently authenticated creator's profile and receiving wallet.
    """
    permission_classes = [IsWalletAuthenticated]

    @extend_schema(
        tags=['Creator Profiles & Dashboard'],
        summary='Get authenticated creator profile',
        responses={
            200: CreatorProfileSerializer,
            404: OpenApiResponse(description='Creator profile not found'),
        }
    )
    def get(self, request):
        wallet_address = request.wallet_address
        try:
            creator = CreatorProfile.objects.select_related('widget_config').get(wallet_address=wallet_address)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'No creator profile found for this wallet address.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(CreatorProfileSerializer(creator).data)

    @extend_schema(
        tags=['Creator Profiles & Dashboard'],
        summary='Update creator profile & receiving wallet',
        request=CreatorRegistrationSerializer,
        responses={200: CreatorProfileSerializer}
    )
    def patch(self, request):
        wallet_address = request.wallet_address
        try:
            creator = CreatorProfile.objects.get(wallet_address=wallet_address)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'Creator profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CreatorRegistrationSerializer(creator, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_creator = serializer.save()

        AuditLog.objects.create(
            wallet_address=wallet_address,
            action='CREATOR_PROFILE_UPDATED',
            details=request.data,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(CreatorProfileSerializer(updated_creator).data)


class WidgetConfigMeView(APIView):
    """
    Manage widget customization settings for the authenticated creator.
    """
    permission_classes = [IsWalletAuthenticated]

    @extend_schema(
        tags=['Widget Configuration'],
        summary='Update tipping widget configuration',
        description='Customizes widget branding, color palette, preset amounts, and alert duration.',
        request=WidgetConfigSerializer,
        responses={200: WidgetConfigSerializer}
    )
    def patch(self, request):
        wallet_address = request.wallet_address
        try:
            creator = CreatorProfile.objects.get(wallet_address=wallet_address)
            config = creator.widget_config
        except (CreatorProfile.DoesNotExist, WidgetConfig.DoesNotExist):
            return Response(
                {'error': 'Widget configuration not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = WidgetConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class CreatorPublicProfileView(APIView):
    """
    Public creator profile endpoint consumed by the embeddable widget and standalone tipping page.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Widget Configuration'],
        summary='Get public creator profile and widget configuration',
        description='Public endpoint for widgets to load creator brand, supported assets, and preset tip amounts.',
        responses={
            200: CreatorPublicSerializer,
            404: OpenApiResponse(description='Creator not found'),
        }
    )
    def get(self, request, username):
        try:
            creator = CreatorProfile.objects.select_related('widget_config').get(username__iexact=username)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': f'Creator @{username} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(CreatorPublicSerializer(creator).data)


class CreatorDashboardView(APIView):
    """
    Dashboard analytics aggregating confirmed on-chain tips, daily activity, and top supporters.
    """
    permission_classes = [IsWalletAuthenticated]

    @extend_schema(
        tags=['Creator Profiles & Dashboard'],
        summary='Creator dashboard metrics & analytics',
        description='Returns confirmed totals for XLM and USDC, today tips count, recent tips list, and top supporter leaderboards.',
        responses={200: CreatorDashboardResponseSerializer}
    )
    def get(self, request):
        wallet_address = request.wallet_address
        try:
            creator = CreatorProfile.objects.select_related('widget_config').get(wallet_address=wallet_address)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'Creator profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        from payments.models import Tip

        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        confirmed_tips = Tip.objects.filter(creator=creator, status='confirmed')

        # Totals
        total_xlm = confirmed_tips.filter(asset_code='XLM').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        total_usdc = confirmed_tips.filter(asset_code='USDC').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        total_count = confirmed_tips.count()

        # Today metrics
        today_tips = confirmed_tips.filter(created_at__gte=start_of_today)
        tips_today_count = today_tips.count()
        today_xlm = today_tips.filter(asset_code='XLM').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        today_usdc = today_tips.filter(asset_code='USDC').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')

        # Recent tips (last 10)
        recent_tips_qs = confirmed_tips.order_by('-created_at')[:10]
        recent_tips_data = [
            {
                'id': t.reference_id,
                'supporter_name': t.supporter_name or 'Anonymous',
                'supporter_wallet': t.supporter_wallet,
                'asset_code': t.asset_code,
                'amount': str(t.amount),
                'message': t.message,
                'stellar_tx_hash': t.stellar_tx_hash,
                'created_at': t.created_at.isoformat(),
            }
            for t in recent_tips_qs
        ]

        # Top supporters
        top_supporters_qs = (
            confirmed_tips.exclude(supporter_name__isnull=True)
            .exclude(supporter_name='')
            .values('supporter_name', 'supporter_wallet', 'asset_code')
            .annotate(total_amount=Sum('amount'), tips_count=Count('id'))
            .order_by('-total_amount')[:5]
        )

        dashboard_data = {
            'total_xlm_tips': total_xlm,
            'total_usdc_tips': total_usdc,
            'total_tips_count': total_count,
            'tips_today_count': tips_today_count,
            'tips_today_xlm': today_xlm,
            'tips_today_usdc': today_usdc,
            'recent_tips': recent_tips_data,
            'top_supporters': list(top_supporters_qs),
            'widget_status': {
                'is_active': creator.widget_config.is_active,
                'theme': creator.widget_config.theme,
                'primary_color': creator.widget_config.primary_color,
                'overlay_token': str(creator.widget_config.overlay_token),
            }
        }

        return Response(dashboard_data, status=status.HTTP_200_OK)


class CreatorEmbedCodeView(APIView):
    """
    Generates ready-to-copy HTML/JavaScript snippets for embedding the widget.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Widget Configuration'],
        summary='Get widget embed snippets and overlay links',
        description='Provides pre-formatted iframe code, JS script snippet, and livestream overlay link for the creator.',
        responses={200: WidgetEmbedCodeSerializer}
    )
    def get(self, request, username):
        try:
            creator = CreatorProfile.objects.select_related('widget_config').get(username__iexact=username)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': f'Creator @{username} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        host = request.get_host()
        scheme = request.scheme

        direct_link = f"{scheme}://{host}/tip/{creator.username}/"
        overlay_url = f"{scheme}://{host}/overlay/{creator.widget_config.overlay_token}/"
        iframe_code = (
            f'<iframe\n'
            f'  src="{scheme}://{host}/embed/{creator.username}/"\n'
            f'  width="380"\n'
            f'  height="540"\n'
            f'  frameborder="0"\n'
            f'  style="border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);"\n'
            f'  title="Tip {creator.display_name}">\n'
            f'</iframe>'
        )
        js_code = (
            f'<div id="startip-widget"></div>\n'
            f'<script\n'
            f'  src="{scheme}://{host}/static/widget.js"\n'
            f'  data-creator="{creator.username}"\n'
            f'  data-target="startip-widget">\n'
            f'</script>'
        )

        return Response({
            'creator_username': creator.username,
            'direct_link': direct_link,
            'iframe_code': iframe_code,
            'javascript_code': js_code,
            'overlay_url': overlay_url,
        })
