<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8"/>
  <xsl:template match="/">
    <html>
      <head>
        <title>Sitemap</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
          h1 { font-size: 20px; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 2px 12px rgba(2,6,23,0.06); border-radius: 8px; overflow: hidden; }
          th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background: #eef2ff; color: #312e81; }
          tr:hover td { background: #f9fafb; }
          .muted { color: #64748b; }
          a { color: #4f46e5; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <xsl:choose>
          <xsl:when test="sitemapindex">
            <h1>Sitemap Index</h1>
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemapindex/sitemap">
                  <tr>
                    <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>
          <xsl:otherwise>
            <h1>Sitemap</h1>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th>Change Freq</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="urlset/url">
                  <tr>
                    <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                    <td class="muted"><xsl:value-of select="sm:lastmod"/></td>
                    <td class="muted"><xsl:value-of select="sm:changefreq"/></td>
                    <td class="muted"><xsl:value-of select="sm:priority"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

