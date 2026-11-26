{{-- Egy komponens megjelenítése; az oszlopkonténer elemeire rekurzívan hívja magát (egy szint). --}}
@switch($component['type'] ?? null)
    @case('heading')
        @php($level = $site->headingLevel($component))
        @php($class = $site->headingClass($component))
        <h{{ $level }}@if ($class !== '') class="{{ $class }}"@endif>{!! $site->icon($component['icon'] ?? null) !!}{{ $component['text'] ?? '' }}</h{{ $level }}>
        @break
    @case('text')
        @if ($site->isRichText($component))
            <div class="rich">{!! $site->richText($component['text'] ?? '') !!}</div>
        @else
            <p>{{ $component['text'] ?? '' }}</p>
        @endif
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
    @case('columns')
    @php($columns = $site->columnList($component))
    <div class="columns columns--{{ count($columns) }}">
    @foreach ($columns as $column)
        <div class="column">
        @foreach ($column as $child)
            @include('site._component', ['component' => $child])
        @endforeach
        </div>
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
