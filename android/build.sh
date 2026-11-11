#!/usr/bin/env bash
# Compila o APK de ensaio do Agatha Signer SEM Gradle: aapt2 + javac + d8 + zipalign
# + apksigner, tudo com o SDK que já está instalado nesta máquina e o JBR do Android
# Studio (não há `java` no PATH).
#
#   bash android/build.sh
#
# Sai o APK assinado (debug) em android/.build/agatha-signer-debug.apk.
# Assinamos com uma keystore de ensaio gerada aqui mesmo: nunca serve para publicar
# na Play Store, e não há nenhuma credencial de release neste repositório.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK="${ANDROID_HOME:-$HOME/AppData/Local/Android/Sdk}"
BT="$SDK/build-tools/36.0.0"
PLAT="$SDK/platforms/android-36"
JBR="/c/Program Files/Android/Android Studio/jbr"

w() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }

# os .bat do build-tools (d8, apksigner) procuram Java assim: JAVA_HOME em caminho
# Windows, mais o bin no PATH
export JAVA_HOME="$(w "$JBR")"
export PATH="$JBR/bin:$PATH"

for d in "$BT" "$PLAT" "$JBR/bin"; do
  [ -d "$d" ] || { echo "FALTA: $d  (ajusta SDK/BT/PLAT/JBR no topo do script)"; exit 1; }
done
[ -f "$PLAT/android.jar" ] || { echo "FALTA: $PLAT/android.jar"; exit 1; }

OUT="$here/.build"
rm -rf "$OUT/obj" "$OUT/gen" "$OUT/dex" "$OUT/res.zip" "$OUT/app.apk" "$OUT/aligned.apk"
mkdir -p "$OUT/obj" "$OUT/gen" "$OUT/dex"

echo "1. recursos (aapt2 compile)"
"$BT/aapt2.exe" compile --dir "$(w "$here/res")" -o "$(w "$OUT/res.zip")"

echo "2. ligar recursos + manifest (aapt2 link)"
"$BT/aapt2.exe" link \
  -o "$(w "$OUT/app.apk")" \
  -I "$(w "$PLAT/android.jar")" \
  --manifest "$(w "$here/AndroidManifest.xml")" \
  --auto-add-overlay \
  --java "$(w "$OUT/gen")" \
  "$(w "$OUT/res.zip")"

echo "3. Java (src + R.java gerado no passo 2)"
( cd "$here" && find src .build/gen -name '*.java' ) > "$OUT/fontes.txt"
( cd "$here" && "$JBR/bin/javac.exe" -nowarn -source 8 -target 8 \
    -bootclasspath "$(w "$PLAT/android.jar")" -d ".build/obj" \
    "@$(w "$OUT/fontes.txt")" )

echo "4. dex (d8)"
classes="$( cd "$OUT/obj" && find . -name '*.class' | sed 's|^\./||' | tr '\n' ' ' )"
[ -n "$classes" ] || { echo "javac não produziu .class"; exit 1; }
( cd "$OUT/obj" && "$BT/d8.bat" --release --min-api 26 \
    --lib "$(w "$PLAT/android.jar")" --output "$(w "$OUT/dex")" $classes )
[ -f "$OUT/dex/classes.dex" ] || { echo "d8 não produziu classes.dex"; exit 1; }

echo "5. meter classes.dex dentro do APK (sem comprimir)"
( cd "$OUT/dex" && "$JBR/bin/jar.exe" uf0 "$(w "$OUT/app.apk")" classes.dex )

echo "6. zipalign + assinatura de ensaio"
"$BT/zipalign.exe" -f 4 "$(w "$OUT/app.apk")" "$(w "$OUT/aligned.apk")"

KS="$OUT/debug.keystore"
if [ ! -f "$KS" ]; then
  echo "   (a gerar a keystore de ensaio — só debug, nada disto é credencial de release)"
  "$JBR/bin/keytool.exe" -genkeypair -keystore "$(w "$KS")" \
    -storetype PKCS12 -storepass android -keypass android \
    -alias agatha-debug -keyalg RSA -keysize 2048 -validity 1095 \
    -dname "CN=Agatha Signer (ensaio), OU=Viva Surdo, O=Horizonte Futuro, L=Luanda, C=AO" >/dev/null
fi

APK="$OUT/agatha-signer-debug.apk"
"$BT/apksigner.bat" sign \
  --ks "$(w "$KS")" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias agatha-debug --out "$(w "$APK")" "$(w "$OUT/aligned.apk")"

"$BT/apksigner.bat" verify --print-certs "$(w "$APK")" | head -4

echo
echo "APK: $APK ($(stat -c %s "$APK") bytes)"
echo "Instalar num aparelho:  adb install -r \"$APK\""
echo "Isto NÃO prova que a janela funciona: prova que compila e está assinada."
