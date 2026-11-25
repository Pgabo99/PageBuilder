<?php

namespace App\Support;

/**
 * A formázott szöveg (`text` komponens, `format: markdown`) kis Markdown-részhalmaza: bekezdés (üres sor),
 * sortörés, **félkövér**, *dőlt*, felsorolás (`- ` vagy `* `), számozott lista (`1. `) és [hivatkozás](cím).
 * A kimenet kizárólag engedélyezett elemekből épül (p, br, strong, em, ul, ol, li, a), a szöveg escape-elt,
 * nyers HTML nem marad; a hivatkozás csak a meglévő `PageContentRules::URL_PATTERN` szerinti címre mutathat.
 * A frontend `utils/markdown.ts` ugyanezt a nyelvtant valósítja meg; a két oldal tesztje azonos eseteket vár.
 *
 * @phpstan-type Inline string|array{type: 'strong'|'em', children: list<mixed>}|array{type: 'a', href: string, label: string}|array{type: 'br'}
 */
class Markdown
{
    /** A forrás HTML-je (a szöveg escape-elt, az elemek engedélyezettek). */
    public static function toHtml(string $source): string
    {
        $html = '';
        foreach (self::parse($source) as $block) {
            $html .= match ($block['type']) {
                'p' => '<p>'.self::inlineHtml($block['inline']).'</p>',
                default => '<'.$block['type'].'>'
                    .implode('', array_map(fn (array $item) => '<li>'.self::inlineHtml($item).'</li>', $block['items']))
                    .'</'.$block['type'].'>',
            };
        }

        return $html;
    }

    /**
     * Blokkokra bontás: bekezdés (`inline`), felsorolás vagy számozott lista (`items`).
     *
     * @return list<array<string, mixed>>
     */
    public static function parse(string $source): array
    {
        $blocks = [];
        $current = null;
        $flush = function () use (&$blocks, &$current): void {
            if ($current !== null) {
                $blocks[] = $current;
                $current = null;
            }
        };

        foreach (explode("\n", str_replace("\r\n", "\n", $source)) as $line) {
            if (trim($line) === '') {
                $flush();

                continue;
            }

            if (preg_match('/^[-*] (.*)$/', $line, $m) === 1) {
                $type = 'ul';
                $text = $m[1];
            } elseif (preg_match('/^\d+\. (.*)$/', $line, $m) === 1) {
                $type = 'ol';
                $text = $m[1];
            } else {
                $type = 'p';
                $text = $line;
            }

            if ($current === null || $current['type'] !== $type) {
                $flush();
                $current = $type === 'p' ? ['type' => 'p', 'lines' => []] : ['type' => $type, 'items' => []];
            }

            if ($type === 'p') {
                $current['lines'][] = $text;
            } else {
                $current['items'][] = self::parseInline($text);
            }
        }
        $flush();

        return array_map(function (array $block): array {
            if ($block['type'] !== 'p') {
                return $block;
            }
            $inline = [];
            foreach ($block['lines'] as $index => $line) {
                if ($index > 0) {
                    $inline[] = ['type' => 'br'];
                }
                array_push($inline, ...self::parseInline($line));
            }

            return ['type' => 'p', 'inline' => $inline];
        }, $blocks);
    }

    /**
     * Soron belüli elemek: félkövér, dőlt, hivatkozás; a lezáratlan jel szövegként marad.
     *
     * @return list<mixed>
     */
    public static function parseInline(string $s): array
    {
        // Az elválasztók ASCII jelek, ezért a bájtalapú keresés UTF-8 szövegen is biztonságos.
        $out = [];
        $buffer = '';
        $n = strlen($s);
        $flush = function () use (&$out, &$buffer): void {
            if ($buffer !== '') {
                $out[] = $buffer;
                $buffer = '';
            }
        };

        for ($i = 0; $i < $n;) {
            $char = $s[$i];

            if ($char === '*' && ($s[$i + 1] ?? '') === '*') {
                $end = strpos($s, '**', $i + 2);
                if ($end !== false && $end > $i + 2) {
                    $flush();
                    $out[] = ['type' => 'strong', 'children' => self::parseInline(substr($s, $i + 2, $end - $i - 2))];
                    $i = $end + 2;

                    continue;
                }
            } elseif ($char === '*') {
                $end = strpos($s, '*', $i + 1);
                if ($end !== false && $end > $i + 1) {
                    $content = substr($s, $i + 1, $end - $i - 1);
                    if (! in_array($content[0], [' ', "\t"], true) && ! in_array($content[strlen($content) - 1], [' ', "\t"], true)) {
                        $flush();
                        $out[] = ['type' => 'em', 'children' => self::parseInline($content)];
                        $i = $end + 1;

                        continue;
                    }
                }
            } elseif ($char === '[') {
                $labelEnd = strpos($s, ']', $i + 1);
                if ($labelEnd !== false && $labelEnd > $i + 1 && ($s[$labelEnd + 1] ?? '') === '(') {
                    $close = strpos($s, ')', $labelEnd + 2);
                    if ($close !== false) {
                        $url = substr($s, $labelEnd + 2, $close - $labelEnd - 2);
                        if (preg_match(PageContentRules::URL_PATTERN, $url) === 1) {
                            $flush();
                            $out[] = ['type' => 'a', 'href' => $url, 'label' => substr($s, $i + 1, $labelEnd - $i - 1)];
                            $i = $close + 1;

                            continue;
                        }
                    }
                }
            }

            $buffer .= $char;
            $i++;
        }
        $flush();

        return $out;
    }

    /** @param  list<mixed>  $nodes */
    private static function inlineHtml(array $nodes): string
    {
        $html = '';
        foreach ($nodes as $node) {
            if (is_string($node)) {
                $html .= self::escape($node);

                continue;
            }
            $html .= match ($node['type']) {
                'br' => '<br>',
                'strong', 'em' => '<'.$node['type'].'>'.self::inlineHtml($node['children']).'</'.$node['type'].'>',
                'a' => '<a href="'.self::escape($node['href']).'" rel="noopener noreferrer">'.self::escape($node['label']).'</a>',
            };
        }

        return $html;
    }

    private static function escape(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
