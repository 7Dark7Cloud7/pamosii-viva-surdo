#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Mete o app web dentro do APK com caminhos POSIX.

O `aapt2 -A` desta versão do build-tools escreve os nomes com `\\` no Windows, e
o AssetManager do Android só abre `assets/app/index.html` com `/`. Este passo
acrescenta os ficheiros já com `/` e normaliza quaisquer nomes herdados.

Uso:  python android/embutir-assets.py <apk> <pasta-web> <prefixo>
"""
import os
import sys
import zipfile

apk, origem_web, prefixo = sys.argv[1], sys.argv[2], sys.argv[3]
temporario = apk + '.tmp'

with zipfile.ZipFile(apk) as origem, zipfile.ZipFile(temporario, 'w') as destino:
    for item in origem.infolist():
        nome = item.filename.replace('\\', '/')
        if nome.startswith(prefixo + '/'):
            continue
        dados = origem.read(item)
        novo = zipfile.ZipInfo(nome, item.date_time)
        novo.compress_type = item.compress_type
        novo.external_attr = item.external_attr
        destino.writestr(novo, dados)

    for raiz, _, ficheiros in os.walk(origem_web):
        for ficheiro in sorted(ficheiros):
            caminho = os.path.join(raiz, ficheiro)
            nome = prefixo + '/' + os.path.relpath(caminho, origem_web).replace(os.sep, '/')
            destino.write(caminho, nome, zipfile.ZIP_DEFLATED)

os.replace(temporario, apk)
