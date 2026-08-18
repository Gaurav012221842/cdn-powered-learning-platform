# Cloudflare CDN Architecture

- **Domain Binding**: `cdn.learningplatform.com` mapped to R2 bucket via Cloudflare Workers.
- **Global Edge Caching**: Caching HLS video segments (.ts) at 275+ edge locations.
