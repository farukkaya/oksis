---
description: spec-audit issue geliştirmeyi PROGRESS.md'den devam ettir (spec-audit-developer subagent'ını çalıştırır)
argument-hint: "(opsiyonel) kaç issue / hangi klasör"
---

# Spec-Audit Geliştirmeye Devam

`spec-audit-developer` subagent'ını başlat ve şunu yaptır:

> `.claude/generated-issues/PROGRESS.md`'yi oku, "Sıradaki" issue'dan başlayarak OKSİS
> spec-uyum denetim issue'larını sırayla (users → students → teachers) geliştirmeye devam et.
> Kendi tanımındaki protokole birebir uy: bağlayıcı spec'i ve issue'yu oku, TDD, build/test
> yeşilini kanıtla, issue başına repo başına bir OKSİS-formatlı commit, yalnız ilgili dosyaları
> stage et (önceki oturumdan kalan alakasız working-tree değişikliklerine dokunma), mimari
> çatallarda durma — kararı kendin verip PROGRESS/completion_status'a işle, her issue sonrası
> PROGRESS.md + completion_status + session özetini güncelle.

Kullanıcı argüman verdiyse ($ARGUMENTS) onu kapsam/sınır olarak ilet (ör. "yalnız 1 issue",
"sadece students klasörü"). Argüman yoksa varsayılan: sıradaki 1–2 issue'yu bitirip dur.

Subagent bittiğinde dönen özeti (biten issue'lar, commit hash'leri, build/test sonucu, sıradaki
issue) kullanıcıya aktar.
