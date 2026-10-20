import os
from pathlib import Path
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseNotFound
from creators.models import CreatorProfile

def get_frontend_dist_dir():
    """
    Locates the compiled Vite frontend dist directory across docker and local environments.
    """
    # 1. Container production path
    p1 = Path('/app/frontend_dist')
    if p1.exists() and (p1 / 'index.html').exists():
        return p1

    # 2. Local backend/frontend_dist
    p2 = Path(__file__).resolve().parent.parent / 'frontend_dist'
    if p2.exists() and (p2 / 'index.html').exists():
        return p2

    # 3. Monorepo sibling frontend/dist
    p3 = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'dist'
    if p3.exists() and (p3 / 'index.html').exists():
        return p3

    return None

def spa_index_view(request):
    """
    Serves the refined StarTip React SPA frontend.
    Falls back to /api/docs/ if the frontend build hasn't been compiled.
    """
    dist_dir = get_frontend_dist_dir()
    if dist_dir:
        index_html = dist_dir / 'index.html'
        if index_html.exists():
            with open(index_html, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html')

    return redirect('/api/docs/')

def embed_widget_view(request, username):
    """
    Renders standalone embeddable widget designed for iframe or embed integration.
    """
    try:
        creator = CreatorProfile.objects.select_related('widget_config').get(username__iexact=username)
    except CreatorProfile.DoesNotExist:
        return HttpResponseNotFound(f"Creator @{username} not found.")

    return render(request, 'widget.html', {
        'creator': creator,
        'config': creator.widget_config,
    })

def demo_page_view(request):
    """
    Live developer and creator testbench demonstrating:
    - Widget embedding
    - Live alert trigger
    - Stellar Testnet transactions
    """
    creators = CreatorProfile.objects.select_related('widget_config').all()[:10]
    first_creator = creators.first() if creators else None
    return render(request, 'demo.html', {
        'creators': creators,
        'first_creator': first_creator,
    })
