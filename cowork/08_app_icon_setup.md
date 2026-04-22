# Cowork prompt — Wire app icon into Flutter

Copy everything below the line into Cowork.

---

You are helping me set up the Opstap app icon in Flutter.

## Step 1 — Download the icon
Open the Canva design: https://www.canva.com/d/ILzpAPKN8yGRwL1
Export as PNG, size 512×512, no background transparency needed.

Save the file as exactly: `app_icon.png`

## Step 2 — Place the file
Copy `app_icon.png` to:
```
C:\Users\donn9\Opstap.App\opstap\assets\icons\app_icon.png
```

## Step 3 — Generate all icon sizes
Open a terminal in `C:\Users\donn9\Opstap.App\opstap` and run:
```
flutter pub get
dart run flutter_launcher_icons
```

This generates icons for Android (all densities), iOS, and web automatically.

## Step 4 — Confirm
The command should print "✓ Successfully generated launcher icons" with no errors.

Done — tell me when complete so I can rebuild and commit.
