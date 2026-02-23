# RGAA Batch Testing

## Installation de Node.js sur Windows (via Chocolatey)

### 1. Installer Chocolatey

Dans un terminal PowerShell **en tant qu'administrateur** :

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Installer Node.js

```powershell
choco install nodejs -y
```

### 3. Vérifier l'installation

```powershell
node --version
npm --version
```

### 4. Installer les dépendances du projet

```powershell
npm install
npx playwright install
```

## Choix du navigateur à utiliser 
| Option | Navigateur utilisé |
|---|---|
| `--browser chromium` | Chromium bundlé avec Playwright (défaut) |
| `--browser chrome` | Chrome installé sur ta machine |
| `--browser firefox` | Firefox installé via Playwright |
| `--browser webkit` | WebKit (moteur Safari) installé via Playwright |

Par défaut : chrome + fenêtre visible

## Exemple

NB : Préférer le mode visible car sans le mode visible des erreurs peuvent apparaître

### Avec Google Chrome en mode visible
```bash
# Lancer tous les tests
node cli.js urls.txt --browser chrome
# Lancer le test 8.3
node cli.js urls.txt --browser chrome --tests rgaa-8-3
# Lancer le test 8.3 (version courte)
node cli.js urls.txt -b chrome -t rgaa-8-3 
# Lancer en mode sans fenêtre
node cli.js urls.txt --browser chrome --headless
```