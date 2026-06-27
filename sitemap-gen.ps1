$baseUrl = "https://istegecb.in"

$exclude = @(
  # System & Backup folders
  "backup",
  "eventGenSrc",
  "pages",

  # Testing & Utility pages
  "test.html",
  "testpage.html",
  "sample.html",
  "example.html",
  "help.html",
  "components.html",
  "backupform.html",
  "event-page.html",
  "pastEvents.html",

  # Old Membership Archives
  "membership2022.html",
  "membership2023.html",
  "membership2024.html",

  # Old PDC Archives
  "pdc2022.html",
  "pdc2023.html",
  "pdc2024.html",
  "pdc2025.html",
  "pdc-2026.html",
  "pdc-gopika.html",
  "pdc-backup.html"
)

$files = Get-ChildItem -Recurse -Filter *.html -File |
  Where-Object {
    $path = $_.FullName.ToLower()
    -not ($exclude | Where-Object { $path -like "*$_*" })
  }

$sitemap = @()
$sitemap += '<?xml version="1.0" encoding="UTF-8"?>'
$sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
$sitemap += '<url><loc>https://istegecb.in</loc></url>'

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
