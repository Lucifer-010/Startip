import json
import time
import queue
from django.http import StreamingHttpResponse, HttpResponseNotFound
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .manager import AlertManager
from creators.models import WidgetConfig

class LiveAlertStreamView(APIView):
    """
    Server-Sent Events (SSE) live stream endpoint for streaming software browser sources (OBS, Streamlabs).
    Streams real-time tip events as they confirm on-chain.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Live Stream Alerts'],
        summary='SSE live alert stream for livestream overlays',
        description='Server-Sent Events stream delivering real-time tip alerts to browser sources in OBS and Streamlabs.',
        responses={200: OpenApiResponse(description='SSE event stream')}
    )
    def get(self, request, overlay_token):
        token_str = str(overlay_token)
        if not WidgetConfig.objects.filter(overlay_token=token_str).exists():
            return Response({'error': 'Invalid overlay token.'}, status=status.HTTP_404_NOT_FOUND)

        def event_generator():
            q = AlertManager.subscribe(token_str)
            # Initial connection handshake
            yield f": connected to StarTip overlay {token_str[:8]}\n\n"
            try:
                while True:
                    try:
                        # Wait up to 15 seconds for an alert
                        alert_data = q.get(timeout=15.0)
                        json_str = json.dumps(alert_data)
                        yield f"event: {alert_data.get('event', 'tip')}\ndata: {json_str}\n\n"
                    except queue.Empty:
                        # Keep-alive heartbeat ping
                        yield ": ping\n\n"
            except GeneratorExit:
                AlertManager.unsubscribe(token_str, q)
            finally:
                AlertManager.unsubscribe(token_str, q)

        response = StreamingHttpResponse(
            event_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class TriggerTestAlertView(APIView):
    """
    Triggers a simulated test alert on the creator's live stream overlay.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Live Stream Alerts'],
        summary='Trigger test alert',
        description='Simulates a live tip alert to verify OBS/Streamlabs overlay visual and audio styling.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'overlay_token': {'type': 'string', 'format': 'uuid'},
                    'amount': {'type': 'string', 'example': '5'},
                    'asset_code': {'type': 'string', 'example': 'USDC'},
                    'supporter_name': {'type': 'string', 'example': 'Stellar Fan'},
                    'message': {'type': 'string', 'example': 'Keep building amazing things on Stellar!'},
                },
                'required': ['overlay_token']
            }
        },
        responses={200: OpenApiResponse(description='Test alert dispatched')}
    )
    def post(self, request):
        overlay_token = request.data.get('overlay_token')
        if not overlay_token:
            # If authenticated creator, use their overlay token
            wallet = getattr(request, 'wallet_address', None)
            if wallet:
                config = WidgetConfig.objects.filter(creator__wallet_address=wallet).first()
                if config:
                    overlay_token = str(config.overlay_token)

        if not overlay_token:
            return Response({'error': 'overlay_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = str(request.data.get('amount', '5'))
        asset_code = str(request.data.get('asset_code', 'USDC')).upper()
        supporter_name = str(request.data.get('supporter_name', 'Stellar Supporter'))
        message = str(request.data.get('message', 'Keep building amazing things on Stellar!'))

        AlertManager.publish_test(
            overlay_token=overlay_token,
            amount=amount,
            asset_code=asset_code,
            supporter_name=supporter_name,
            message=message
        )

        return Response({
            'success': True,
            'message': f"Dispatched test alert for overlay {str(overlay_token)[:8]}..."
        }, status=status.HTTP_200_OK)


def overlay_page_view(request, overlay_token):
    """
    Renders standalone transparent overlay webpage for OBS Browser Source.
    """
    try:
        config = WidgetConfig.objects.select_related('creator').get(overlay_token=str(overlay_token))
    except WidgetConfig.DoesNotExist:
        return HttpResponseNotFound("Invalid overlay token.")

    return render(request, 'overlay.html', {
        'config': config,
        'overlay_token': str(overlay_token),
    })
