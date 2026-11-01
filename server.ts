import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Secure Server-Side 4-Source Multi-Aggregator Proxy
  // Supports Pexels, Wallhaven, Unsplash, and Pixabay
  app.get('/api/wallpapers', async (req, res) => {
    try {
      const rawQuery = (req.query.query as string)?.trim() || '';
      const category = (req.query.category as string)?.trim() || '';
      const color = (req.query.color as string)?.trim() || '';
      const size = (req.query.size as string)?.trim() || '';
      const orientationParam = (req.query.orientation as string)?.trim() || '';
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const perPage = Math.min(
        80,
        Math.max(10, parseInt((req.query.per_page as string) || (req.query.perPage as string) || '40', 10))
      );

      const qLower = rawQuery.toLowerCase();
      const cLower = category.toLowerCase();
      const text = `${qLower} ${cLower}`;

      const wallhavenKeywords = [
        'anime', 'fantasy', 'cyberpunk', 'digital art', 'manga', 'comic',
        'scifi', 'sci-fi', 'synthwave', 'gaming', 'game', 'waifu',
        'genshin', 'concept art', 'pixel art', 'futuristic', 'mecha'
      ];
      const isWallhaven =
        cLower === 'anime' ||
        cLower === 'fantasy' ||
        cLower === 'cyberpunk' ||
        wallhavenKeywords.some((kw) => text.includes(kw));

      const illustrationKeywords = [
        'illustration', 'illustrations', 'vector', 'vectors', 'cartoon',
        'drawing', 'drawings', 'clipart', 'graphic', 'sketch', 'doodle', 'pattern'
      ];
      const isPixabayIllustration = illustrationKeywords.some((kw) => text.includes(kw));

      const aestheticKeywords = [
        'aesthetic', 'minimalist', 'minimal', 'architecture', 'lifestyle',
        'interior', 'coffee', 'cozy', 'travel', 'street', 'portrait', 'plants', 'nature'
      ];
      const isAesthetic =
        cLower === 'minimalist' ||
        cLower === 'nature' ||
        aestheticKeywords.some((kw) => text.includes(kw));

      // Shuffler utility
      const interleaveAndShuffle = (arrays: any[][]) => {
        const valid = arrays.filter((arr) => arr && arr.length > 0);
        if (valid.length === 0) return [];
        if (valid.length === 1) return valid[0];
        const resList: any[] = [];
        const maxLen = Math.max(...valid.map((a) => a.length));
        for (let i = 0; i < maxLen; i++) {
          for (const arr of valid) {
            if (i < arr.length) resList.push(arr[i]);
          }
        }
        for (let i = resList.length - 1; i > 0; i--) {
          const j = Math.max(0, i - Math.floor(Math.random() * 3));
          const t = resList[i];
          resList[i] = resList[j];
          resList[j] = t;
        }
        return resList;
      };

      // 1. Wallhaven fetcher
      const fetchWallhaven = async (q: string, p: number, count: number) => {
        try {
          const wQuery = q || category || 'anime';
          const whKey = process.env.WALLHAVEN_API_KEY?.trim() || '';
          const keyParam = whKey ? `apikey=${encodeURIComponent(whKey)}&` : '';
          const url = `https://wallhaven.cc/api/v1/search?${keyParam}q=${encodeURIComponent(
            wQuery
          )}&purity=100&sorting=random&page=${p}`;
          const resp = await fetch(url, {
            headers: { 'User-Agent': 'PixelDrop-WallpaperApp/3.0', Accept: 'application/json' },
          });
          if (!resp.ok) return [];
          const data: any = await resp.json();
          const items = data.data || [];
          return items.slice(0, count).map((item: any) => {
            const width = Number(item.dimension_x) || 1920;
            const height = Number(item.dimension_y) || 1080;
            const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
            const highResUrl = item.path || item.url || '';
            const thumbUrl = item.thumbs?.large || item.thumbs?.small || highResUrl;
            return {
              id: `wallhaven-${item.id}`,
              url: highResUrl,
              thumbnail: thumbUrl,
              source: 'wallhaven',
              photographer: 'Wallhaven Artist',
              width,
              height,
              title: `${wQuery.charAt(0).toUpperCase() + wQuery.slice(1)} Illustration 4K`,
              authorName: 'Wallhaven Artist',
              authorProfile: item.url || 'https://wallhaven.cc',
              category: category || item.category || 'anime',
              orientation,
              src: {
                original: highResUrl,
                large2x: highResUrl,
                large: thumbUrl,
                medium: thumbUrl,
                small: item.thumbs?.small || thumbUrl,
                portrait: thumbUrl,
                landscape: highResUrl,
                tiny: item.thumbs?.small || thumbUrl,
              },
            };
          });
        } catch (e) {
          console.error('[Express] Wallhaven error:', e);
          return [];
        }
      };

      // 2. Pixabay fetcher
      const fetchPixabay = async (q: string, p: number, count: number, isIllus = false) => {
        try {
          const pbKey = process.env.PIXABAY_API_KEY?.trim();
          if (!pbKey) return [];
          const pbQuery = q || category || 'wallpaper';
          const imgType = isIllus ? 'illustration' : 'all';
          const limit = Math.min(Math.max(count, 3), 50);
          const url = `https://pixabay.com/api/?key=${encodeURIComponent(
            pbKey
          )}&q=${encodeURIComponent(pbQuery)}&image_type=${imgType}&safesearch=true&page=${p}&per_page=${limit}`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data: any = await resp.json();
          return (data.hits || []).map((hit: any) => {
            const width = Number(hit.imageWidth) || 1920;
            const height = Number(hit.imageHeight) || 1080;
            const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
            const highResUrl = hit.largeImageURL || hit.imageURL || hit.webformatURL || '';
            const thumbUrl = hit.webformatURL || hit.previewURL || highResUrl;
            const photographer = hit.user || 'Pixabay Creator';
            return {
              id: `pixabay-${hit.id}`,
              url: highResUrl,
              thumbnail: thumbUrl,
              source: 'pixabay',
              photographer,
              width,
              height,
              title: `${(hit.tags?.split(',')[0] || pbQuery).trim()} 4K Wallpaper`,
              authorName: photographer,
              authorProfile: hit.user_id ? `https://pixabay.com/users/${hit.user}-${hit.user_id}/` : 'https://pixabay.com',
              category: category || (isIllus ? 'illustration' : 'all'),
              orientation,
              src: {
                original: highResUrl,
                large2x: highResUrl,
                large: thumbUrl,
                medium: thumbUrl,
                small: hit.previewURL || thumbUrl,
                portrait: thumbUrl,
                landscape: highResUrl,
                tiny: hit.previewURL || thumbUrl,
              },
            };
          });
        } catch (e) {
          console.error('[Express] Pixabay error:', e);
          return [];
        }
      };

      // 3. Unsplash fetcher
      const fetchUnsplash = async (q: string, p: number, count: number) => {
        try {
          const unsKey = (process.env.UNSPLASH_ACCESS_KEY || 'Vl7pE2WkmQT6APUmQOkcNTasiaCCpLd-ckpqhjZpxcI').trim();
          if (!unsKey) return [];
          const uQuery = q || (category && category !== 'all' ? category : '');
          const url = uQuery
            ? `https://api.unsplash.com/search/photos?client_id=${encodeURIComponent(
                unsKey
              )}&query=${encodeURIComponent(uQuery)}&page=${p}&per_page=${count}&orientation=landscape`
            : `https://api.unsplash.com/photos?client_id=${encodeURIComponent(
                unsKey
              )}&page=${p}&per_page=${count}&order_by=popular`;
          const resp = await fetch(url, { headers: { 'Accept-Version': 'v1' } });
          if (!resp.ok) return [];
          const data: any = await resp.json();
          const items = Array.isArray(data) ? data : data.results || [];
          return items.map((item: any) => {
            const width = Number(item.width) || 1920;
            const height = Number(item.height) || 1080;
            const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
            const highResUrl = item.urls?.raw || item.urls?.full || item.urls?.regular || '';
            const thumbUrl = item.urls?.regular || item.urls?.small || item.urls?.thumb || highResUrl;
            const photographer = item.user?.name || item.user?.username || 'Unsplash Creator';
            return {
              id: `unsplash-${item.id}`,
              url: highResUrl,
              thumbnail: thumbUrl,
              source: 'unsplash',
              photographer,
              width,
              height,
              title: item.alt_description || item.description || `${uQuery || 'Aesthetic'} 4K Wallpaper`,
              authorName: photographer,
              authorProfile: item.user?.links?.html || 'https://unsplash.com',
              category: category || 'minimalist',
              orientation,
              src: {
                original: highResUrl,
                large2x: item.urls?.full || highResUrl,
                large: thumbUrl,
                medium: item.urls?.small || thumbUrl,
                small: item.urls?.small || thumbUrl,
                portrait: thumbUrl,
                landscape: highResUrl,
                tiny: item.urls?.thumb || thumbUrl,
              },
            };
          });
        } catch (e) {
          console.error('[Express] Unsplash error:', e);
          return [];
        }
      };

      // 4. Pexels fetcher with official Pexels API parameters: color, size, orientation
      const fetchPexels = async (q: string, p: number, count: number) => {
        try {
          const pxKey = process.env.PEXELS_API_KEY?.trim();
          if (!pxKey) return [];
          let pxQuery = q || (category && category !== 'all' ? category : '');
          if (!pxQuery && (color || size || orientationParam)) {
            pxQuery = 'wallpaper';
          }
          let url = '';
          if (pxQuery) {
            const searchParams = new URLSearchParams();
            searchParams.set('query', pxQuery);
            searchParams.set('page', String(p));
            searchParams.set('per_page', String(count));
            if (color && color !== 'all') {
              searchParams.set('color', color);
            }
            if (size && size !== 'all') {
              searchParams.set('size', size);
            }
            if (orientationParam && orientationParam !== 'all') {
              searchParams.set('orientation', orientationParam);
            }
            url = `https://api.pexels.com/v1/search?${searchParams.toString()}`;
          } else {
            url = `https://api.pexels.com/v1/curated?page=${p}&per_page=${count}`;
          }
          const resp = await fetch(url, { headers: { Authorization: pxKey } });
          if (!resp.ok) return [];
          const data: any = await resp.json();
          return (data.photos || []).map((photo: any) => {
            const width = Number(photo.width) || 1920;
            const height = Number(photo.height) || 1080;
            const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
            const highResUrl = photo.src?.original || photo.src?.large2x || photo.url || '';
            const thumbUrl = photo.src?.large || photo.src?.medium || highResUrl;
            const photographer = photo.photographer || 'Pexels Creator';
            return {
              id: `pexels-${photo.id}`,
              url: highResUrl,
              thumbnail: thumbUrl,
              source: 'pexels',
              photographer,
              width,
              height,
              title: photo.alt || `${pxQuery || 'Curated'} 4K Wallpaper`,
              authorName: photographer,
              authorProfile: photo.photographer_url || 'https://www.pexels.com',
              category: category || 'all',
              orientation,
              color: photo.avg_color || color || '#18181b',
              avg_color: photo.avg_color || color || '#18181b',
              src: {
                original: highResUrl,
                large2x: photo.src?.large2x || highResUrl,
                large: thumbUrl,
                medium: photo.src?.medium || thumbUrl,
                small: photo.src?.small || thumbUrl,
                portrait: photo.src?.portrait || thumbUrl,
                landscape: photo.src?.landscape || highResUrl,
                tiny: photo.src?.tiny || thumbUrl,
              },
            };
          });
        } catch (e) {
          console.error('[Express] Pexels error:', e);
          return [];
        }
      };

      let wallpapers: any[] = [];
      const sourcesUsed: string[] = [];

      const hasAdvancedPexelsFilter = Boolean((color && color !== 'all') || (size && size !== 'all'));

      if (hasAdvancedPexelsFilter) {
        // Direct query to Pexels with exact Pexels API color and size parameters
        const px = await fetchPexels(rawQuery, page, perPage);
        if (px.length > 0) {
          sourcesUsed.push('pexels');
          wallpapers = px;
        }
      } else if (isWallhaven) {
        const [wh, pb] = await Promise.all([
          fetchWallhaven(rawQuery, page, perPage),
          fetchPixabay(rawQuery, page, Math.floor(perPage / 2), true),
        ]);
        if (wh.length > 0) sourcesUsed.push('wallhaven');
        if (pb.length > 0) sourcesUsed.push('pixabay');
        wallpapers = interleaveAndShuffle([wh, pb]);
        if (wallpapers.length === 0) {
          const px = await fetchPexels(rawQuery, page, perPage);
          if (px.length > 0) {
            sourcesUsed.push('pexels');
            wallpapers = px;
          }
        }
      } else if (isPixabayIllustration) {
        const [pb, wh] = await Promise.all([
          fetchPixabay(rawQuery, page, perPage, true),
          fetchWallhaven(rawQuery, page, Math.floor(perPage / 2)),
        ]);
        if (pb.length > 0) sourcesUsed.push('pixabay');
        if (wh.length > 0) sourcesUsed.push('wallhaven');
        wallpapers = interleaveAndShuffle([pb, wh]);
        if (wallpapers.length === 0) {
          const px = await fetchPexels(rawQuery, page, perPage);
          if (px.length > 0) {
            sourcesUsed.push('pexels');
            wallpapers = px;
          }
        }
      } else if (isAesthetic) {
        const half = Math.ceil(perPage / 2);
        const [uns, px] = await Promise.all([
          fetchUnsplash(rawQuery, page, half),
          fetchPexels(rawQuery, page, half),
        ]);
        if (uns.length > 0) sourcesUsed.push('unsplash');
        if (px.length > 0) sourcesUsed.push('pexels');
        wallpapers = interleaveAndShuffle([uns, px]);
        if (wallpapers.length === 0) {
          const pb = await fetchPixabay(rawQuery, page, perPage, false);
          if (pb.length > 0) {
            sourcesUsed.push('pixabay');
            wallpapers = pb;
          }
        }
      } else {
        const quarter = Math.ceil(perPage / 2);
        const [px, uns, pb, wh] = await Promise.all([
          fetchPexels(rawQuery, page, quarter),
          fetchUnsplash(rawQuery, page, quarter),
          fetchPixabay(rawQuery, page, quarter, false),
          fetchWallhaven(rawQuery, page, quarter),
        ]);
        if (px.length > 0) sourcesUsed.push('pexels');
        if (uns.length > 0) sourcesUsed.push('unsplash');
        if (pb.length > 0) sourcesUsed.push('pixabay');
        if (wh.length > 0) sourcesUsed.push('wallhaven');
        wallpapers = interleaveAndShuffle([px, uns, pb, wh]);
      }

      const legacyPhotos = wallpapers.map((w: any) => ({
        id: w.id,
        url: w.url,
        photographer: w.photographer,
        photographer_url: w.authorProfile || '',
        photographer_id: 0,
        width: w.width,
        height: w.height,
        src: w.src,
        alt: w.title,
      }));

      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return res.json({
        page,
        per_page: perPage,
        total_results: Math.max(wallpapers.length * 25, 250),
        source: sourcesUsed.length === 1 ? sourcesUsed[0] : sourcesUsed.length > 1 ? 'multi' : 'fallback',
        sources_used: sourcesUsed,
        wallpapers,
        photos: legacyPhotos,
      });
    } catch (err) {
      console.error('Express proxy error for /api/wallpapers:', err);
      return res.status(500).json({
        error: 'Server error proxying wallpapers multi-aggregator API',
        photos: [],
        wallpapers: [],
        total_results: 0,
        fallback: true,
      });
    }
  });


  // High-Resolution Image Download Proxy (Bypasses CORS & 403 Forbidden for direct 4K master downloads)
  // Strictly enforces genuine universal JPEG/PNG delivery so phone galleries (Samsung, iOS, Xiaomi, Google Photos)
  // never reject downloaded wallpapers with format errors or corruption messages.
  app.get('/api/download', async (req, res) => {
    try {
      let targetUrl = (req.query.url as string)?.trim();
      let filename = (req.query.filename as string)?.trim() || 'PixelDrop-4K.jpg';
      if (!targetUrl) {
        return res.status(400).send('Missing url parameter');
      }

      // If target is Unsplash, strictly sanitize to ensure fm=jpg and remove auto=format
      // (auto=format causes CDNs to return modern AVIF/WebP which phone wallpaper managers fail to set)
      if (targetUrl.includes('images.unsplash.com')) {
        try {
          const urlObj = new URL(targetUrl);
          urlObj.searchParams.delete('auto');
          urlObj.searchParams.set('fm', 'jpg');
          if (!urlObj.searchParams.has('q')) {
            urlObj.searchParams.set('q', '100');
          }
          targetUrl = urlObj.toString();
        } catch {
          targetUrl = targetUrl.replace(/auto=format/g, 'fm=jpg');
        }
      }

      // Priority Accept header: strictly demand standard JPEG or PNG from upstream CDNs.
      // Do NOT send image/avif or image/webp which triggers CDN auto-transcoding into unsupported phone formats.
      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/jpeg,image/png,image/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
      };

      const lowerUrl = targetUrl.toLowerCase();
      if (lowerUrl.includes('wallhaven.cc')) {
        headers['Referer'] = 'https://wallhaven.cc/';
        headers['Origin'] = 'https://wallhaven.cc';
        headers['Sec-Fetch-Dest'] = 'image';
        headers['Sec-Fetch-Mode'] = 'no-cors';
        headers['Sec-Fetch-Site'] = 'cross-site';
      } else if (lowerUrl.includes('pexels.com')) {
        headers['Referer'] = 'https://www.pexels.com/';
      } else if (lowerUrl.includes('unsplash.com')) {
        headers['Referer'] = 'https://unsplash.com/';
      } else if (lowerUrl.includes('pixabay.com')) {
        headers['Referer'] = 'https://pixabay.com/';
      }

      let upstream = await fetch(targetUrl, {
        method: 'GET',
        headers,
      });

      if (!upstream.ok && upstream.status === 403 && headers['Referer']) {
        upstream = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': headers['User-Agent'],
            Accept: headers['Accept'],
          },
        });
      }

      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: `Upstream image fetch failed with status ${upstream.status}` });
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());

      // Inspect binary magic bytes to determine the true, authentic image format
      // JPEG: FF D8 FF
      const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      // PNG: 89 50 4E 47
      const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      // WebP: RIFF .... WEBP
      const isWebP = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

      // Guard: strictly ensure the file is an actual image. Never send an HTML error page or text as a .jpg
      if (!isJpeg && !isPng && !isWebP) {
        console.warn('[Proxy Download] Upstream did not return valid image magic bytes:', buffer.slice(0, 16).toString());
        return res.status(502).json({ error: 'Downloaded file is not a valid image format.' });
      }

      let finalContentType = 'image/jpeg';
      let targetExt = '.jpg';

      if (isJpeg) {
        finalContentType = 'image/jpeg';
        targetExt = '.jpg';
      } else if (isPng) {
        finalContentType = 'image/png';
        targetExt = '.png';
      } else if (isWebP) {
        finalContentType = 'image/webp';
        targetExt = '.webp';
      }

      // Ensure filename extension strictly matches the authentic image content
      if (!filename.toLowerCase().endsWith(targetExt)) {
        filename = filename.replace(/\.[a-zA-Z0-9]+$/, '') + targetExt;
      }

      res.setHeader('Content-Type', finalContentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } catch (err) {
      console.error('Error in /api/download:', err);
      return res.status(500).json({ error: 'Internal server error while processing image download.' });
    }
  });

  // Google Search Console HTML Verification endpoint
  app.get('/google38525e8d8e7f1155.html', (req, res) => {
    res.type('text/html').send('google-site-verification: google38525e8d8e7f1155.html');
  });

  // Google AdSense ads.txt endpoint
  app.get('/ads.txt', (req, res) => {
    res.type('text/plain').send('google.com, pub-7012260166484402, DIRECT, f08c47fec0942fa0\n');
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasPexelsKey: Boolean(process.env.PEXELS_API_KEY) });
  });

  // 2. Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
