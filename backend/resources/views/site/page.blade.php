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
        .cards { --gap: 1rem; --pad: 1rem; --radius: .75rem; --border-width: 1px; --shadow: none; --icon-size: 1.75rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: var(--gap); margin: 1rem 0; }
        .card { padding: var(--pad); border: var(--border-width) solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); }
        .card__icon .icon { width: var(--icon-size); height: var(--icon-size); margin: 0 0 .25rem; }
        .cards--columns-1 { --cols: 1; } .cards--columns-2 { --cols: 2; } .cards--columns-3 { --cols: 3; } .cards--columns-4 { --cols: 4; }
        .cards--columns-1, .cards--columns-2, .cards--columns-3, .cards--columns-4 { grid-template-columns: repeat(auto-fit, minmax(max(14rem, calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols))), 1fr)); }
        .cards--icon-position-top-center .card__icon { text-align: center; }
        .cards--icon-position-left .card, .cards--icon-position-right .card { display: grid; column-gap: .75rem; align-content: start; }
        .cards--icon-position-left .card { grid-template-columns: auto 1fr; }
        .cards--icon-position-right .card { grid-template-columns: 1fr auto; }
        .cards--icon-position-left .card > *, .cards--icon-position-right .card > * { grid-column: 1; }
        .cards--icon-position-left .card > * { grid-column: 2; }
        .cards--icon-position-left .card > .card__icon { grid-column: 1; grid-row: 1 / span 4; }
        .cards--icon-position-right .card > .card__icon { grid-column: 2; grid-row: 1 / span 4; }
        .cards--icon-size-small { --icon-size: 1.25rem; } .cards--icon-size-medium { --icon-size: 1.75rem; } .cards--icon-size-large { --icon-size: 2.5rem; }
        .cards--text-align-left .card { text-align: left; } .cards--text-align-center .card { text-align: center; } .cards--text-align-right .card { text-align: right; }
        .cards--button-position-left .card__action { text-align: left; } .cards--button-position-center .card__action { text-align: center; } .cards--button-position-right .card__action { text-align: right; }
        .cards--border-none { --border-width: 0px; } .cards--border-thin { --border-width: 1px; } .cards--border-thick { --border-width: 3px; }
        .cards--shadow-none { --shadow: none; } .cards--shadow-small { --shadow: 0 1px 3px rgba(0, 0, 0, .2); } .cards--shadow-medium { --shadow: 0 6px 16px rgba(0, 0, 0, .25); }
        .cards--radius-none { --radius: 0; } .cards--radius-small { --radius: .375rem; } .cards--radius-medium { --radius: .75rem; } .cards--radius-large { --radius: 1.25rem; }
        .cards--gap-small { --gap: .5rem; } .cards--gap-medium { --gap: 1rem; } .cards--gap-large { --gap: 2rem; }
        .cards--padding-small { --pad: .5rem; } .cards--padding-medium { --pad: 1rem; } .cards--padding-large { --pad: 2rem; }
        .card h3 { margin: .25rem 0 .5rem; font-size: 1.1rem; }
        .card p { margin: .5rem 0; }
        .accordion { margin: 1rem 0; border: 1px solid var(--border); border-radius: .75rem; overflow: hidden; }
        .accordion details + details { border-top: 1px solid var(--border); }
        .accordion summary { cursor: pointer; padding: .75rem 1rem; font-weight: 600; }
        .accordion summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .accordion details[open] summary { color: var(--accent); }
        .accordion details p { margin: 0; padding: 0 1rem 1rem; }
        .heading--small, .heading--medium, .heading--large, .heading--xlarge { line-height: 1.25; overflow-wrap: anywhere; }
        .heading--small { font-size: 1.25rem; }
        .heading--medium { font-size: 1.75rem; }
        .heading--large { font-size: clamp(1.75rem, 6vw, 2.5rem); }
        .heading--xlarge { font-size: clamp(2rem, 9vw, 3.5rem); }
        .heading--left { text-align: left; }
        .heading--center { text-align: center; }
        .heading--right { text-align: right; }
        .divider { margin: 1.5rem 0; border: 0; border-top: var(--divider-width, 1px) var(--divider-style, solid) var(--divider-color, var(--border)); }
        .divider--thickness-thin { --divider-width: 1px; } .divider--thickness-medium { --divider-width: 2px; } .divider--thickness-thick { --divider-width: 4px; }
        .divider--style-solid { --divider-style: solid; } .divider--style-dashed { --divider-style: dashed; } .divider--style-dotted { --divider-style: dotted; }
        .divider--color-border { --divider-color: var(--border); } .divider--color-text { --divider-color: var(--text); } .divider--color-accent { --divider-color: var(--accent); }
        .button { display: inline-block; max-width: 100%; padding: .5rem 1rem; color: var(--on-accent); background: var(--accent); border-radius: .5rem; text-decoration: none; font-weight: 600; box-sizing: border-box; overflow-wrap: anywhere; }
        .button--outline { color: var(--accent); background: transparent; box-shadow: inset 0 0 0 2px var(--accent); }
        .button--soft { color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }
        .button--link { padding-inline: 0; color: var(--accent); background: transparent; text-decoration: underline; }
        .button--small { padding: .25rem .75rem; font-size: .875rem; }
        .button--medium { padding: .5rem 1rem; }
        .button--large { padding: .75rem 1.5rem; font-size: 1.125rem; }
        .button--r-none { border-radius: 0; }
        .button--r-small { border-radius: .25rem; }
        .button--r-medium { border-radius: .5rem; }
        .button--r-full { border-radius: 999px; }
        .button-wrap--left { text-align: left; }
        .button-wrap--center { text-align: center; }
        .button-wrap--right { text-align: right; }
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
            @php($level = $site->headingLevel($component))
            @php($class = $site->headingClass($component))
            <h{{ $level }}@if ($class !== '') class="{{ $class }}"@endif>{!! $site->icon($component['icon'] ?? null) !!}{{ $component['text'] ?? '' }}</h{{ $level }}>
            @break
        @case('text')
            <p>{{ $component['text'] ?? '' }}</p>
            @break
        @case('cards')
            <div class="{{ $site->cardsClass($component) }}">
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
                        <p class="card__action"><a class="button" href="{{ $card['url'] }}">{{ $card['label'] }}</a></p>
                    @endif
                </article>
            @endforeach
            </div>
            @break
        @case('divider')
            <hr class="{{ $site->dividerClass($component) }}">
            @break
        @case('accordion')
            <div class="accordion">
            @foreach ($site->accordionItems($component) as $item)
                <details>
                    <summary>{{ $item['title'] ?? '' }}</summary>
                    <p>{{ $item['text'] ?? '' }}</p>
                </details>
            @endforeach
            </div>
            @break
        @case('button')
            @if ($site->isSafeUrl($component['url'] ?? ''))
                @php($wrap = $site->buttonWrapClass($component))
                <p{!! $wrap !== '' ? ' class="'.e($wrap).'"' : '' !!}><a class="{{ $site->buttonClass($component) }}" href="{{ $component['url'] }}">{{ $component['label'] ?? '' }}</a></p>
            @endif
            @break
    @endswitch
@endforeach
</main>
</body>
</html>
