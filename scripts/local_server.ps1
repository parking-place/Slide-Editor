$port = 8000
$root = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, ".."))

# 포트 중복 검사 및 할당 (8000번 사용 중이면 다음 포트 탐색)
while ($true) {
    try {
        $tcp = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
        $tcp.Start()
        $tcp.Stop()
        break
    } catch {
        $port++
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "       Slide Editor 로컬 웹 서버" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  -> 서버가 정상적으로 실행되었습니다." -ForegroundColor Green
Write-Host "  -> 주소: http://localhost:$port/" -ForegroundColor Yellow
Write-Host "  -> 자동으로 브라우저를 엽니다..." -ForegroundColor White
Write-Host ""
Write-Host "  ※ 주의: 이 검은색 창을 닫으면 접속이 끊깁니다." -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Cyan

# 기본 브라우저 실행
Start-Process "http://localhost:$port/SlideEditor.html"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        $request = $context.Request

        # URL 파싱 (.. 등 상위 폴더 접근 방어)
        $url = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        $url = $url.Replace('..', '')

        # === POST /api/saveHtml 요청 처리 시작 ===
        if ($request.HttpMethod -eq "POST" -and $url -eq "/api/saveHtml") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                
                $savePath = [System.IO.Path]::Combine($root, "exports", "SlideEditor_Web_Guide.html")
                [System.IO.File]::WriteAllText($savePath, $body, [System.Text.Encoding]::UTF8)
                
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $responseBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"status`":`"success`"}")
                $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
            } catch {
                $response.StatusCode = 500
                Write-Host "HTML 웹 가이드 덮어쓰기 실패: $_" -ForegroundColor Red
            } finally {
                $response.Close()
            }
            continue
        }
        # === POST /api/saveHtml 요청 처리 끝 ===

        # === GET /api/themes 목록 요청 처리 시작 ===
        if ($request.HttpMethod -eq "GET" -and $url -eq "/api/themes") {
            try {
                $themesDir = [System.IO.Path]::Combine($root, "data", "themes")
                if (-not (Test-Path $themesDir)) { New-Item -ItemType Directory -Force -Path $themesDir | Out-Null }
                $files = Get-ChildItem -Path $themesDir -Filter "*.slidetheme" | Select-Object -ExpandProperty Name
                $json = '[' + (($files | ForEach-Object { "`"$_`"" }) -join ',') + ']'
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
            } catch {
                $response.StatusCode = 500
                Write-Host "테마 목록 조회 실패: $_" -ForegroundColor Red
            } finally {
                $response.Close()
            }
            continue
        }
        # === GET /api/themes 목록 요청 처리 끝 ===

        # === GET /api/themes/{name} 파일 반환 처리 시작 ===
        if ($request.HttpMethod -eq "GET" -and $url -match "^/api/themes/(.+\.slidetheme)$") {
            try {
                $themeName = $Matches[1] -replace '\.\.', ''
                $themePath = [System.IO.Path]::Combine($root, "data", "themes", $themeName)
                if (Test-Path $themePath -PathType Leaf) {
                    $content = [System.IO.File]::ReadAllText($themePath, [System.Text.Encoding]::UTF8)
                    $response.StatusCode = 200
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.AddHeader("Access-Control-Allow-Origin", "*")
                    $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                    $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
                } else {
                    $response.StatusCode = 404
                }
            } catch {
                $response.StatusCode = 500
                Write-Host "테마 파일 읽기 실패: $_" -ForegroundColor Red
            } finally {
                $response.Close()
            }
            continue
        }
        # === GET /api/themes/{name} 파일 반환 처리 끝 ===

        # === POST /api/themes/{name} 파일 저장 처리 시작 ===
        if ($request.HttpMethod -eq "POST" -and $url -match "^/api/themes/(.+\.slidetheme)$") {
            try {
                $themeName = $Matches[1] -replace '\.\.', ''
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $themesDir = [System.IO.Path]::Combine($root, "data", "themes")
                if (-not (Test-Path $themesDir)) { New-Item -ItemType Directory -Force -Path $themesDir | Out-Null }
                $savePath = [System.IO.Path]::Combine($themesDir, $themeName)
                [System.IO.File]::WriteAllText($savePath, $body, [System.Text.Encoding]::UTF8)
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $responseBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"status`":`"success`"}")
                $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
            } catch {
                $response.StatusCode = 500
                Write-Host "테마 파일 저장 실패: $_" -ForegroundColor Red
            } finally {
                $response.Close()
            }
            continue
        }
        # === POST /api/themes/{name} 파일 저장 처리 끝 ===

        # === POST /api/save 요청 처리 시작 ===
        if ($request.HttpMethod -eq "POST" -and $url -eq "/api/save") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                
                $savePath = [System.IO.Path]::Combine($root, "data", "vme_data.json")
                [System.IO.File]::WriteAllText($savePath, $body, [System.Text.Encoding]::UTF8)
                
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $responseBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"status`":`"success`"}")
                $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
            } catch {
                $response.StatusCode = 500
                Write-Host "저장 실패: $_" -ForegroundColor Red
            } finally {
                $response.Close()
            }
            continue
        }
        # === POST /api/save 요청 처리 끝 ===

        if ($url -eq "/") { $url = "/SlideEditor.html" }
        
        $filePath = [System.IO.Path]::Combine($root, $url.TrimStart('/').Replace('/', '\'))
        
        if (Test-Path $filePath -PathType Leaf) {
            $response.StatusCode = 200
            
            # MIME 타입 설정
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html"        { $response.ContentType = "text/html; charset=utf-8" }
                ".json"        { $response.ContentType = "application/json; charset=utf-8" }
                ".slidetheme"  { $response.ContentType = "application/json; charset=utf-8" }
                ".js"          { $response.ContentType = "application/javascript" }
                ".css"         { $response.ContentType = "text/css" }
                ".png"         { $response.ContentType = "image/png" }
                ".jpg"         { $response.ContentType = "image/jpeg" }
                default        { $response.ContentType = "application/octet-stream" }
            }
            
            # CORS 헤더 추가 및 캐시 억제
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
catch {
    Write-Host "서버 구동 중 오류가 발생했습니다." -ForegroundColor Red
}
finally {
    $listener.Stop()
}
