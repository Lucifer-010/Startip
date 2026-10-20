import uuid
from django.db import models
from django.core.validators import RegexValidator

def default_supported_assets():
    return ["XLM", "USDC"]

def default_preset_xlm():
    return [5, 10, 25, 50]

def default_preset_usdc():
    return [1, 2, 5, 10]

class CreatorProfile(models.Model):
    """
    Onboarded content creator profile mapped to an authenticated Stellar wallet.
    """
    wallet_address = models.CharField(
        max_length=56,
        unique=True,
        db_index=True,
        help_text="Stellar address controlling this profile"
    )
    username = models.SlugField(
        max_length=50,
        unique=True,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_-]+$',
                message='Username can only contain alphanumeric characters, underscores, and dashes.'
            )
        ],
        help_text="Unique public handle (e.g. startip.app/creatorname)"
    )
    display_name = models.CharField(max_length=100)
    bio = models.TextField(max_length=500, blank=True, default='')
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    website_url = models.URLField(max_length=500, blank=True, default='')
    social_links = models.JSONField(default=dict, blank=True)
    receiving_wallet_address = models.CharField(
        max_length=56,
        db_index=True,
        help_text="Stellar address where supporter tips are directly paid"
    )
    supported_assets = models.JSONField(
        default=default_supported_assets,
        help_text="List of accepted asset codes (e.g. ['XLM', 'USDC'])"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.display_name} (@{self.username})"

    def save(self, *args, **kwargs):
        # Default receiving wallet to controlling wallet if not specified
        if not self.receiving_wallet_address:
            self.receiving_wallet_address = self.wallet_address
        super().save(*args, **kwargs)


class WidgetConfig(models.Model):
    """
    Appearance and functional configuration for the embeddable tipping widget.
    """
    THEME_CHOICES = [
        ('dark', 'Dark Navy'),
        ('light', 'Clean Light'),
        ('midnight', 'Midnight Purple'),
        ('cyber', 'Cyberpunk Neon'),
    ]

    creator = models.OneToOneField(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name='widget_config'
    )
    widget_title = models.CharField(max_length=100, default='Tip this Creator')
    welcome_message = models.TextField(
        max_length=300,
        default='Support my journey and content creation with instant Stellar tips!'
    )
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='dark')
    primary_color = models.CharField(max_length=20, default='#6366F1')
    preset_amounts_xlm = models.JSONField(default=default_preset_xlm)
    preset_amounts_usdc = models.JSONField(default=default_preset_usdc)
    allow_custom_amount = models.BooleanField(default=True)
    allow_supporter_message = models.BooleanField(default=True)
    overlay_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    alert_sound_enabled = models.BooleanField(default=True)
    alert_duration_seconds = models.PositiveIntegerField(default=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"WidgetConfig for @{self.creator.username}"
