<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $page->title }} – {{ $website->name }}</title>
    <style>
        body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2328; }
        nav { padding: .75rem 1rem; border-bottom: 1px solid #d1d9e0; display: flex; gap: 1rem; flex-wrap: wrap; }
        nav a { color: #2f5bea; text-decoration: none; }
        nav a[aria-current="page"] { font-weight: 700; color: #1f2328; }
        main { max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
        .button { display: inline-block; padding: .5rem 1rem; color: #fff; background: #2f5bea; border-radius: .5rem; text-decoration: none; font-weight: 600; }
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
            <h{{ $level }}>{{ $component['text'] ?? '' }}</h{{ $level }}>
            @break
        @case('text')
            <p>{{ $component['text'] ?? '' }}</p>
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
