from rest_framework import serializers
from .models import CreatorProfile, WidgetConfig
from core.utils import is_valid_stellar_address

class WidgetConfigSerializer(serializers.ModelSerializer):
    overlay_token = serializers.UUIDField(read_only=True)

    class Meta:
        model = WidgetConfig
        fields = [
            'widget_title',
            'welcome_message',
            'theme',
            'primary_color',
            'preset_amounts_xlm',
            'preset_amounts_usdc',
            'allow_custom_amount',
            'allow_supporter_message',
            'overlay_token',
            'alert_sound_enabled',
            'alert_duration_seconds',
            'is_active',
        ]


class CreatorProfileSerializer(serializers.ModelSerializer):
    widget_config = WidgetConfigSerializer(read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            'id',
            'wallet_address',
            'username',
            'display_name',
            'bio',
            'avatar_url',
            'website_url',
            'social_links',
            'receiving_wallet_address',
            'supported_assets',
            'widget_config',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'wallet_address', 'created_at', 'updated_at']

    def validate_receiving_wallet_address(self, value):
        if not is_valid_stellar_address(value):
            raise serializers.ValidationError("Invalid Stellar receiving wallet address.")
        return value


class CreatorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorProfile
        fields = [
            'username',
            'display_name',
            'bio',
            'avatar_url',
            'website_url',
            'social_links',
            'receiving_wallet_address',
            'supported_assets',
        ]

    def validate_receiving_wallet_address(self, value):
        if value and not is_valid_stellar_address(value):
            raise serializers.ValidationError("Invalid Stellar receiving wallet address.")
        return value


class CreatorPublicSerializer(serializers.ModelSerializer):
    """
    Publicly safe serialized profile used by the embeddable tipping widget.
    """
    widget_config = WidgetConfigSerializer(read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            'username',
            'display_name',
            'bio',
            'avatar_url',
            'website_url',
            'social_links',
            'receiving_wallet_address',
            'supported_assets',
            'widget_config',
        ]


class TopSupporterSerializer(serializers.Serializer):
    supporter_name = serializers.CharField()
    supporter_wallet = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=20, decimal_places=7)
    asset_code = serializers.CharField()
    tips_count = serializers.IntegerField()


class CreatorDashboardResponseSerializer(serializers.Serializer):
    total_xlm_tips = serializers.DecimalField(max_digits=20, decimal_places=7)
    total_usdc_tips = serializers.DecimalField(max_digits=20, decimal_places=7)
    total_tips_count = serializers.IntegerField()
    tips_today_count = serializers.IntegerField()
    tips_today_xlm = serializers.DecimalField(max_digits=20, decimal_places=7)
    tips_today_usdc = serializers.DecimalField(max_digits=20, decimal_places=7)
    recent_tips = serializers.ListField(child=serializers.DictField())
    top_supporters = TopSupporterSerializer(many=True)
    widget_status = serializers.DictField()


class WidgetEmbedCodeSerializer(serializers.Serializer):
    creator_username = serializers.CharField()
    direct_link = serializers.URLField()
    iframe_code = serializers.CharField()
    javascript_code = serializers.CharField()
    overlay_url = serializers.URLField()
