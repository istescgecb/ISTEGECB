$baseUrl = "https://istegecb.in"

$exclude = @(
  "test.html",
  "sample.html",
  "backup",
  "eventGenSrc"
)

$files = Get-ChildItem -Recurse -Filter *.html -File |
  Where-Object {
    $path = $_.FullName.ToLower()
    -not ($exclude | Where-Object { $path -like "*$_*" })
  }

$sitemap = @()
$sitemap += '<?xml version="1.0" encoding="UTF-8"?>'
$sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

foreach ($file in $files) {
  $relative = $file.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
  $url = "$baseUrl$relative"

  $sitemap += "  <url>"
  $sitemap += "    <loc>$url</loc>"
  $sitemap += "  </url>"
}

$sitemap += '</urlset>'

$sitemap | Set-Content sitemap.xml -Encoding UTF8

Write-Host "sitemap.xml generated with $($files.Count) URLs"
