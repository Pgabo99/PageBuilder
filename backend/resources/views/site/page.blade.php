<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $page->title }} – {{ $website->name }}</title>
    <style>
        :root { --bg: {{ $site->palette()['bg'] }}; --text: {{ $site->palette()['text'] }}; --border: {{ $site->palette()['border'] }}; --accent: {{ $site->accent() }}; --on-accent: {{ $site->onAccent() }}; }
        body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); }
        nav { padding: .75rem 1rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; flex-wrap: wrap; }
        nav a { color: var(--accent); text-decoration: none; }
        nav a[aria-current="page"] { font-weight: 700; color: var(--text); }
        main { max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
        .icon { width: 1.1em; height: 1.1em; margin-right: .4em; vertical-align: -.15em; color: var(--accent); }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; margin: 1rem 0; }
        .card { padding: 1rem; border: 1px solid var(--border); border-radius: .75rem; }
        .card__icon .icon { width: 1.75rem; height: 1.75rem; margin: 0 0 .25rem; }
        .card h3 { margin: .25rem 0 .5rem; font-size: 1.1rem; }
        .card p { margin: .5rem 0; }
        .button { display: inline-block; padding: .5rem 1rem; color: var(--on-accent); background: var(--accent); border-radius: .5rem; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
@if ($pages->count() > 1)
    <nav aria-label="Oldalak">
        @foreach ($pages as $item)
            <a href="{{ $site->urlFor($item, $pages) }}" @if ($item->is($page)) aria-current="page" @endif>{{ $item->title }}</a>
        @endforeach
    </nav>
@endif
<main>
@foreach ($page->content as $component)
    @switch($component['type'] ?? null)
        @case('heading')
            @php($level = min(3, max(1, (int) ($component['level'] ?? 2))))
            <h{{ $level }}>{!! $site->icon($component['icon'] ?? null) !!}{{ $component['text'] ?? '' }}</h{{ $level }}>
            @break
        @case('text')
            <p>{{ $component['text'] ?? '' }}</p>
            @break
        @case('cards')
            <div class="cards">
            @foreach ($site->cards($component) as $card)
                <article class="card">
                    @if ($icon = $site->icon($card['icon'] ?? null))
                        <div class="card__icon">{!! $icon !!}</div>
                    @endif
                    <h3>{{ $card['title'] ?? '' }}</h3>
                    @if (filled($card['text'] ?? null))
                        <p>{{ $card['text'] }}</p>
                    @endif
                    @if (filled($card['label'] ?? null) && $site->isSafeUrl($card['url'] ?? ''))
                        <p><a class="button" href="{{ $card['url'] }}">{{ $card['label'] }}</a></p>
                    @endif
                </article>
            @endforeach
            </div>
            @break
        @case('button')
            @if ($site->isSafeUrl($component['url'] ?? ''))
                <p><a class="button" href="{{ $component['url'] }}">{{ $component['label'] ?? '' }}</a></p>
            @endif
            @break
    @endswitch
@endforeach
</main>
</body>
</html>
