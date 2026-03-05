# ─────────────────────────────────────────────────────────────────────────────
# rename-icons.ps1
# Two modes:
#   1. RENAME  — rename icon.png files you dragged in from a website
#   2. DOWNLOAD — batch-download icons from maplestory.io (version 255)
#
# Edit the sections below, then run: .\rename-icons.ps1
# ─────────────────────────────────────────────────────────────────────────────

$GearDir = "$PSScriptRoot\MapleIcons\Gear Icons"

# ── MODE 1: RENAME ───────────────────────────────────────────────────────────
# After dragging images from a website, they land as "icon.png", "icon (1).png" etc.
# List them in order here → right side is the target name.
#
# Naming rules (must match what index.html expects):
#   Class-specific  (Hat / Top / Bottom / Weapon):
#     {Set}{ClassCategory}{Slot}.png
#     e.g.  EternalMageHat.png   AbsoArcherTop.png   ArcaneWarriorWeapon.png
#   Shared  (Shoes / Glove / Cape):
#     {Set}{Slot}.png
#     e.g.  EternalShoes.png   ArcaneGlove.png   AbsoCape.png
#
# Set prefixes  :  Pensalir | Abso | Arcane | Eternal
# Class values  :  Warrior  | Mage | Archer | Thief  | Pirate  | Xenon
# Slot suffixes :  Hat  | Top  | Bottom  | Shoes  | Glove  | Cape  | Weapon

$Renames = @(
    # @{ From = "icon.png";      To = "ArcaneWarriorWeapon.png"  },
    # @{ From = "icon (1).png";  To = "ArcaneMageWeapon.png"     },
    # @{ From = "icon (2).png";  To = "ArcaneArcherWeapon.png"   },
    # @{ From = "icon (3).png";  To = "ArcaneThiefWeapon.png"    },
    # @{ From = "icon (4).png";  To = "ArcanePirateWeapon.png"   },
)

foreach ($entry in $Renames) {
    $src  = Join-Path $GearDir $entry.From
    $dest = Join-Path $GearDir $entry.To
    if (-not (Test-Path $src))  { Write-Warning "Not found: $($entry.From)"; continue }
    if (Test-Path $dest)        { Write-Warning "Already exists, skipping: $($entry.To)"; continue }
    Rename-Item -Path $src -NewName $entry.To
    Write-Host "Renamed: $($entry.From)  →  $($entry.To)" -ForegroundColor Green
}


# ── MODE 2: DOWNLOAD from maplestory.io ──────────────────────────────────────
# Add confirmed item IDs here. Script downloads and saves with correct filename.
# maplestory.io confirmed working with GMS version 255.
#
# Format: @{ Id = 1234567; File = "EternalMageHat.png" }

$Downloads = @(
    # Confirmed IDs — add more as you identify them:
    @{ Id = 1082697; File = "ArcaneGlove.png" },   # Arcane Umbra Archer Gloves (confirmed)

    # ── WEAPONS (fill in once IDs are mapped) ──
    # @{ Id = 1152174; File = "???Weapon???.png"  },
    # @{ Id = 1004422; File = "???Weapon???.png"  },
    # @{ Id = 1004423; File = "???Weapon???.png"  },
    # @{ Id = 1004424; File = "???Weapon???.png"  },
    # @{ Id = 1004425; File = "???Weapon???.png"  },
    # @{ Id = 1004426; File = "???Weapon???.png"  },
)

$BaseUrl = "https://maplestory.io/api/GMS/255/item"

foreach ($entry in $Downloads) {
    $dest = Join-Path $GearDir $entry.File
    if (Test-Path $dest) { Write-Host "Already exists, skipping: $($entry.File)" -ForegroundColor Yellow; continue }

    $url = "$BaseUrl/$($entry.Id)/icon"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -ErrorAction Stop
        Write-Host "Downloaded: $($entry.File)  (id $($entry.Id))" -ForegroundColor Green
    } catch {
        Write-Warning "Failed: $($entry.File)  — $($_.Exception.Message)"
    }
}

Write-Host "`nDone." -ForegroundColor Cyan
