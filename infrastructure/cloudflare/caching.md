# Edge Caching Strategy

- `.m3u8` playlists: `Cache-Control: max-age=60` (short cache for dynamic updates).
- `.ts` chunks: `Cache-Control: public, max-age=31536000, immutable`.
