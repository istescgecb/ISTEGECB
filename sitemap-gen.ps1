$baseUrl = "https://istegecb.in"

# Add the specific pages here that you want without the .html extension
$stripHTMLExtensionList = @(
  "developers.html"
  # "about.html", 
  # "contact.html"
)

$exclude = @(
  # System & Backup folders
  "backup",
  "eventGenSrc",
  "pages",

  # Testing & Utility pages
  "node_modules",
  "test",
  "test.html",
  "testpage.html",
  "sample.html",
  "example.html",
  "help.html",
  "components.html",
  "backupform.html",
  "event-page.html",
  "pastEvents.html",
  "linktree-old.html",
  "linktree.html",

  # Old Membership Archives
  "membership2022.html",
  "membership2023.html",
  "membership2024.html",
  "membership2025.html",

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

$urlCount = 1

foreach ($file in $files) {
  $relative = $file.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
  
  # Skip index.html to prevent duplicating the root URL
  if ($relative.ToLower() -eq "/index.html") { continue }
  
  # Check if the current file is in our list to convert
  if ($stripHTMLExtensionList -contains $file.Name) {
    $relative = $relative -replace '\.html$', ''
  }
  
  $url = "$baseUrl$relative"

  $sitemap += "  <url>"
  $sitemap += "    <loc>$url</loc>"
  $sitemap += "  </url>"
  
  $urlCount++
}

$sitemap += '</urlset>'

$sitemap | Set-Content sitemap.xml -Encoding UTF8

Write-Host "sitemap.xml generated with $urlCount URLs"