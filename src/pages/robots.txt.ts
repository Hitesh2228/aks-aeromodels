import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const robots = `# ==============================================================================
# SKYNODES UAV - Official Robots.txt
# High-Performance Aeromodelling & Scale UAV Enterprise Portal
# Domain: https://skynodesuav.in
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Default Rules for All General Web Crawlers
# ------------------------------------------------------------------------------
User-agent: *
Allow: /
Allow: /shop
Allow: /blog
Allow: /product/
Allow: /blog/
Allow: /about
Allow: /contact
Allow: /flight-simulator
Allow: /aircrafts
Allow: /pro-experience
Allow: /sitemap
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /sitemap.xml

# Restricted Backend, Checkout & Internal API Endpoints
Disallow: /api/
Disallow: /checkout
Disallow: /cart
Disallow: /admin
Disallow: /_astro/
Disallow: /*?*preview=*
Disallow: /*?*cart=*

# ------------------------------------------------------------------------------
# 2. Major Global Search Engines (Full Indexing Granted)
# ------------------------------------------------------------------------------
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /checkout

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /checkout

User-agent: BingPreview
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Yandex
Allow: /

User-agent: YandexBot
Allow: /

User-agent: NaverBot
Allow: /

User-agent: Yeti
Allow: /

User-agent: SeznamBot
Allow: /

User-agent: Qwantify
Allow: /

# ------------------------------------------------------------------------------
# 3. Modern AI Search Engines & LLM Crawlers (100% Permitted for Generative Answers)
# ------------------------------------------------------------------------------
# OpenAI (ChatGPT, SearchGPT, GPTBot)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

# Google Gemini & Extended AI Training/Search
User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: GoogleOther-Image
Allow: /

User-agent: GoogleOther-Video
Allow: /

# Anthropic (Claude & Claude Web Research)
User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Perplexity AI Search
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Apple Intelligence & Siri
User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

# Meta AI & Llama Research
User-agent: Meta-ExternalAgent
Allow: /

User-agent: FacebookBot
Allow: /

# Cohere AI
User-agent: cohere-ai
Allow: /

# Mistral AI
User-agent: MistralBot
Allow: /

# ByteDance / TikTok AI
User-agent: Bytespider
Allow: /

# Amazon AI & Alexa Search
User-agent: Amazonbot
Allow: /

# You.com Search
User-agent: YouBot
Allow: /

# Common Crawl & Open Web Foundation Datasets
User-agent: CCBot
Allow: /

User-agent: Diffbot
Allow: /

# ------------------------------------------------------------------------------
# 4. Canonical Sitemaps & Host Specification
# ------------------------------------------------------------------------------
Sitemap: https://www.skynodesuav.in/sitemap.xml
Sitemap: https://skynodesuav.in/sitemap.xml
Host: https://www.skynodesuav.in
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'X-Robots-Tag': 'all',
    },
  });
};

export const HEAD: APIRoute = GET;
