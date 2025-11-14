# Database backup script for Amori app (PowerShell)
# Usage: .\backup.ps1 [output_directory]

param(
    [string]$OutputDir = ".\backups"
)

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Get timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $OutputDir "amori_backup_$Timestamp.sql"

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Check if required environment variables are set
$DbUrl = $env:DATABASE_URL
if (-not $DbUrl) {
    $DbUrl = $env:SUPABASE_DB_URL
}

if (-not $DbUrl) {
    Write-Host "Error: DATABASE_URL or SUPABASE_DB_URL must be set" -ForegroundColor Red
    Write-Host "You can set it in .env file or as environment variable"
    exit 1
}

Write-Host "Starting database backup..."
Write-Host "Output file: $BackupFile"

# Create backup using pg_dump
try {
    & pg_dump $DbUrl `
        --no-owner `
        --no-acl `
        --clean `
        --if-exists `
        --format=plain `
        --file=$BackupFile

    # Compress backup
    $CompressedFile = "$BackupFile.gz"
    $Content = [System.IO.File]::ReadAllBytes($BackupFile)
    $GzipStream = New-Object System.IO.FileStream($CompressedFile, [System.IO.FileMode]::Create)
    $Gzip = New-Object System.IO.Compression.GZipStream($GzipStream, [System.IO.Compression.CompressionMode]::Compress)
    $Gzip.Write($Content, 0, $Content.Length)
    $Gzip.Close()
    $GzipStream.Close()

    # Remove uncompressed file
    Remove-Item $BackupFile

    # Get file size
    $FileSize = (Get-Item $CompressedFile).Length / 1MB
    $FileSizeFormatted = "{0:N2} MB" -f $FileSize

    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "File: $CompressedFile"
    Write-Host "Size: $FileSizeFormatted"

    # Optional: Keep only last 7 backups
    $Backups = Get-ChildItem -Path $OutputDir -Filter "amori_backup_*.sql.gz" | Sort-Object LastWriteTime -Descending
    if ($Backups.Count -gt 7) {
        $Backups | Select-Object -Skip 7 | Remove-Item
        Write-Host "Cleaned up old backups (kept last 7)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating backup: $_" -ForegroundColor Red
    exit 1
}

