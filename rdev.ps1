# rdev.ps1 — Restart Dev clean
# ─────────────────────────────────────────────────────────────
# Usage : depuis le repo RiffLab, tape :
#   .\rdev.ps1
#
# Fait dans l'ordre :
#  1. Tue TOUS les processus Node (purge des Vite zombies des
#     Claude Code qui restent en background sur 5174, 5175...)
#  2. git pull origin main (récupère les derniers merges)
#  3. npm install (au cas où des deps ont bougé)
#  4. npm run dev (lance TON Vite sur 5173)
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "🧹 Killing all Node processes (Vite zombies)..." -ForegroundColor Yellow
$nodes = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodes) {
    $count = ($nodes | Measure-Object).Count
    $nodes | Stop-Process -Force
    Write-Host "   → $count process(es) tué(s)" -ForegroundColor Green
} else {
    Write-Host "   → Aucun process à tuer (déjà clean)" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "📥 Pulling main..." -ForegroundColor Cyan
git pull origin main

Write-Host ""
Write-Host "📦 npm install (au cas où des deps ont bougé)..." -ForegroundColor Cyan
npm install --silent

Write-Host ""
Write-Host "🚀 Starting Vite on http://localhost:5173/..." -ForegroundColor Green
Write-Host "   (Ctrl+C pour arrêter, puis relance .\rdev.ps1)" -ForegroundColor DarkGray
Write-Host ""

npm run dev
