$root = (Get-Location).Path
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()
Write-Host "Sagility Editor running at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop."
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($path)) { $path = 'Admin.html' }
        $file = Join-Path $root $path
        if ((Test-Path $file -PathType Leaf) -and ((Resolve-Path $file).Path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase))) {
            $bytes = [IO.File]::ReadAllBytes($file)
            $context.Response.ContentType = switch ([IO.Path]::GetExtension($file).ToLowerInvariant()) {
                '.html' { 'text/html; charset=utf-8'; break }
                '.png' { 'image/png'; break }
                '.mjs' { 'text/javascript; charset=utf-8'; break }
                default { 'application/octet-stream' }
            }
            $context.Response.StatusCode = 200
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
            $context.Response.StatusCode = 404
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
