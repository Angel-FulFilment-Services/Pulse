<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LinkPreviewController extends Controller
{
    /**
     * Fetch metadata for a URL
     */
    public function getMetadata(Request $request)
    {
        $request->validate([
            'url' => 'required|url'
        ]);

        $url = $request->input('url');
        
        // Cache for 1 hour to reduce repeated fetches
        $cacheKey = 'link_preview_' . md5($url);
        
        $metadata = Cache::remember($cacheKey, 3600, function () use ($url) {
            return $this->fetchMetadata($url);
        });

        return response()->json($metadata);
    }

    /**
     * Fetch and parse metadata from a URL
     */
    private function fetchMetadata(string $url): array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.5',
                ])
                ->get($url);

            if (!$response->successful()) {
                return $this->getBasicMetadata($url);
            }

            $html = $response->body();
            
            // Parse the HTML
            $metadata = $this->parseHtml($html, $url);
            
            return $metadata;
        } catch (\Exception $e) {
            return $this->getBasicMetadata($url);
        }
    }

    /**
     * Parse HTML to extract Open Graph and meta tags
     */
    private function parseHtml(string $html, string $url): array
    {
        $doc = new \DOMDocument();
        @$doc->loadHTML($html, LIBXML_NOERROR);
        
        $metadata = [
            'url' => $url,
            'title' => null,
            'description' => null,
            'image' => null,
            'site_name' => null,
            'favicon' => null,
            'domain' => parse_url($url, PHP_URL_HOST),
        ];

        // Get meta tags
        $metas = $doc->getElementsByTagName('meta');
        foreach ($metas as $meta) {
            $property = $meta->getAttribute('property');
            $name = $meta->getAttribute('name');
            $content = $meta->getAttribute('content');

            // Open Graph tags
            if ($property === 'og:title') {
                $metadata['title'] = $content;
            } elseif ($property === 'og:description') {
                $metadata['description'] = $content;
            } elseif ($property === 'og:image') {
                $metadata['image'] = $this->resolveUrl($content, $url);
            } elseif ($property === 'og:site_name') {
                $metadata['site_name'] = $content;
            }
            
            // Twitter Card tags (fallback)
            elseif ($name === 'twitter:title' && !$metadata['title']) {
                $metadata['title'] = $content;
            } elseif ($name === 'twitter:description' && !$metadata['description']) {
                $metadata['description'] = $content;
            } elseif ($name === 'twitter:image' && !$metadata['image']) {
                $metadata['image'] = $this->resolveUrl($content, $url);
            }
            
            // Standard meta description (fallback)
            elseif ($name === 'description' && !$metadata['description']) {
                $metadata['description'] = $content;
            }
        }

        // Get title from <title> tag if not found in meta
        if (!$metadata['title']) {
            $titles = $doc->getElementsByTagName('title');
            if ($titles->length > 0) {
                $metadata['title'] = trim($titles->item(0)->textContent);
            }
        }

        // Get favicon
        $links = $doc->getElementsByTagName('link');
        foreach ($links as $link) {
            $rel = strtolower($link->getAttribute('rel'));
            if (strpos($rel, 'icon') !== false) {
                $href = $link->getAttribute('href');
                if ($href) {
                    $metadata['favicon'] = $this->resolveUrl($href, $url);
                    break;
                }
            }
        }

        // Fallback favicon
        if (!$metadata['favicon']) {
            $metadata['favicon'] = parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST) . '/favicon.ico';
        }

        // Truncate description if too long
        if ($metadata['description'] && strlen($metadata['description']) > 200) {
            $metadata['description'] = substr($metadata['description'], 0, 200) . '...';
        }

        // Use domain as fallback title
        if (!$metadata['title']) {
            $metadata['title'] = $metadata['domain'];
        }

        return $metadata;
    }

    /**
     * Resolve relative URLs to absolute
     */
    private function resolveUrl(?string $relativeUrl, string $baseUrl): ?string
    {
        if (!$relativeUrl) {
            return null;
        }

        // Already absolute
        if (preg_match('/^https?:\/\//', $relativeUrl)) {
            return $relativeUrl;
        }

        // Protocol-relative
        if (strpos($relativeUrl, '//') === 0) {
            return parse_url($baseUrl, PHP_URL_SCHEME) . ':' . $relativeUrl;
        }

        // Relative to root
        if (strpos($relativeUrl, '/') === 0) {
            return parse_url($baseUrl, PHP_URL_SCHEME) . '://' . parse_url($baseUrl, PHP_URL_HOST) . $relativeUrl;
        }

        // Relative to current path
        $basePath = dirname(parse_url($baseUrl, PHP_URL_PATH) ?: '/');
        return parse_url($baseUrl, PHP_URL_SCHEME) . '://' . parse_url($baseUrl, PHP_URL_HOST) . $basePath . '/' . $relativeUrl;
    }

    /**
     * Get basic metadata when fetch fails
     */
    private function getBasicMetadata(string $url): array
    {
        $domain = parse_url($url, PHP_URL_HOST);
        
        return [
            'url' => $url,
            'title' => $domain,
            'description' => null,
            'image' => null,
            'site_name' => null,
            'favicon' => parse_url($url, PHP_URL_SCHEME) . '://' . $domain . '/favicon.ico',
            'domain' => $domain,
        ];
    }
}
