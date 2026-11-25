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
        @for ($rem = \App\Support\PageContentRules::SPACER_MIN_HEIGHT; $rem <= \App\Support\PageContentRules::SPACER_MAX_HEIGHT; $rem++)
        .spacer--{{ $rem }} { height: {{ $rem }}rem; }
        @endfor
        .site-footer { max-width: 42rem; margin: 2rem auto 0; padding: 1rem; font-size: .9rem; border-top: 1px solid var(--border); overflow-wrap: anywhere; }
        .site-footer a { color: var(--accent); }
        .site-footer__links { display: flex; flex-wrap: wrap; gap: .5rem 1rem; margin: 0 0 .75rem; padding: 0; list-style: none; }
        .site-footer address { margin: 0 0 .75rem; font-style: normal; }
        .site-footer address > * { display: block; }
        .site-footer p { margin: 0; }
        .social { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1rem 0; padding: 0; list-style: none; }
        .social__link { display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; color: var(--accent); border: 1px solid var(--border); border-radius: 50%; }
        .social__link:hover { background: color-mix(in srgb, var(--accent) 12%, var(--bg)); }
        .social__link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .social__link .icon { width: 1.25rem; height: 1.25rem; margin: 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1rem; margin: 1.5rem 0; text-align: center; }
        .stat__icon .icon { width: 1.75rem; height: 1.75rem; margin: 0 0 .25rem; }
        .stat__value { margin: 0; font-size: 2rem; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
        .stat__label { margin: .25rem 0 0; overflow-wrap: anywhere; }
        .quote { margin: 1.5rem 0; padding: .25rem 1rem; border-left: 4px solid var(--accent); }
        .quote blockquote { margin: 0; font-size: 1.125rem; font-style: italic; overflow-wrap: anywhere; }
        .quote blockquote p { margin: 0; }
        .quote figcaption { margin-top: .5rem; font-size: .9rem; overflow-wrap: anywhere; }
        .quote figcaption::before { content: "— "; }
        .quote cite { font-style: normal; }
        .quote cite a { color: var(--accent); }
        .visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        .alert { --alert-color: #2563eb; display: flex; gap: .75rem; align-items: flex-start; margin: 1rem 0; padding: .75rem 1rem; color: var(--text); background: color-mix(in srgb, var(--alert-color) 12%, var(--bg)); border: 1px solid color-mix(in srgb, var(--alert-color) 40%, var(--bg)); border-left: 4px solid var(--alert-color); border-radius: .5rem; }
        .alert--success { --alert-color: #16a34a; } .alert--warning { --alert-color: #d97706; } .alert--error { --alert-color: #dc2626; }
        .alert__icon { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; font-weight: 700; line-height: 1; }
        .alert__icon .icon { width: 1.25rem; height: 1.25rem; margin: 0; color: inherit; }
        .alert__body { min-width: 0; overflow-wrap: anywhere; }
        .alert__title { display: block; }
        .alert__body p { margin: 0; }
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
        @case('footer')
            {{-- A lábléc az oldal végén jelenik meg (a </main> után). --}}
            @break
        @case('social')
            <ul class="social">
            @foreach ($site->socialLinks($component) as $link)
                <li><a class="social__link" href="{{ $link['url'] }}" rel="noopener noreferrer">{!! $link['svg'] !!}<span class="visually-hidden">{{ $link['label'] }}</span></a></li>
            @endforeach
            </ul>
            @break
        @case('stats')
            <div class="stats">
            @foreach ($site->statItems($component) as $stat)
                <div class="stat">
                    @if ($icon = $site->icon($stat['icon'] ?? null))
                        <div class="stat__icon">{!! $icon !!}</div>
                    @endif
                    <p class="stat__value">{{ $stat['prefix'] ?? '' }}{{ $stat['value'] ?? '' }}{{ $stat['suffix'] ?? '' }}</p>
                    <p class="stat__label">{{ $stat['label'] ?? '' }}</p>
                </div>
            @endforeach
            </div>
            @break
        @case('quote')
            @php($author = filled($component['author'] ?? null) ? $component['author'] : null)
            @php($source = filled($component['source'] ?? null) ? $component['source'] : null)
            <figure class="quote">
                <blockquote><p>{{ $component['text'] ?? '' }}</p></blockquote>
                @if ($author || $source)
                    {{-- Egy sorban, hogy a szerző és a vessző közé ne kerüljön szóköz. --}}
                    <figcaption>{{ $author }}{{ $author && $source ? ', ' : '' }}@if ($source)<cite>@if ($site->isSafeUrl($component['source_url'] ?? ''))<a href="{{ $component['source_url'] }}">{{ $source }}</a>@else{{ $source }}@endif</cite>@endif</figcaption>
                @endif
            </figure>
            @break
        @case('alert')
            @php($variant = $site->alertVariant($component))
            <div class="alert alert--{{ $variant }}" role="note">
                <span class="alert__icon" aria-hidden="true">{!! $site->icon($component['icon'] ?? null) ?: e($site->alertMarker($variant)) !!}</span>
                <div class="alert__body">
                    <span class="visually-hidden">{{ $site->alertLabel($variant) }}: </span>
                    @if (filled($component['title'] ?? null))
                        <strong class="alert__title">{{ $component['title'] }}</strong>
                    @endif
                    <p>{{ $component['text'] ?? '' }}</p>
                </div>
            </div>
            @break
        @case('spacer')
            <div class="spacer--{{ $site->spacerHeight($component) }}" aria-hidden="true"></div>
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
@php($footer = $site->footer($page->content))
@if ($footer)
    @php($links = $site->footerLinks($footer))
    @php($email = $site->footerEmail($footer))
    @php($phone = $site->footerPhoneHref($footer))
    <footer class="site-footer">
    @if ($links)
        <nav aria-label="Lábléc"><ul class="site-footer__links">
        @foreach ($links as $link)
            <li><a href="{{ $link['url'] }}">{{ $link['label'] }}</a></li>
        @endforeach
        </ul></nav>
    @endif
    @if ($email || $phone || filled($footer['address'] ?? null))
        <address>
        @if ($email)
            <a href="mailto:{{ $email }}">{{ $email }}</a>
        @endif
        @if ($phone)
            <a href="{{ $phone }}">{{ $footer['phone'] }}</a>
        @endif
        @if (filled($footer['address'] ?? null))
            <span>{{ $footer['address'] }}</span>
        @endif
        </address>
    @endif
    @if (filled($footer['copyright'] ?? null))
        <p class="site-footer__copyright">{{ $footer['copyright'] }}</p>
    @endif
    </footer>
@endif
</body>
</html>
