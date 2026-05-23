---
description: OKSİS commit kuralına uygun commit mesajı üret ve commit at
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Read
---

# Commit Oluştur

@.claude/docs/git-commit-rules.md

## Görev

Aşağıdaki adımları sırayla uygula:

1. **Durum tespiti**: `git status` ve `git diff --staged` çalıştır.
   - Staged değişiklik yoksa `git diff` ile unstaged değişiklikleri incele ve "stage edilmemiş değişiklik var, `git add` ile stage'ler misin yoksa benim mi stage'lememi istersin?" diye sor.

2. **Analiz et**:
   - **Type**: feat | fix | chore | docs | test | refactor | perf | style | ci | revert
   - **Scope**: hangi modül? (`students`, `auth`, `attendance`, `grades`, `homework`, `announcements`, `messaging`, `notifications`, `dashboard`, `identity`, `schools`, `classes`, `teachers`, `ci`, `deps`, `docs`, `infra`)
   - **Subject**: imperative mood, küçük harf, nokta yok, max 72 karakter, **İngilizce**
   - **Body** (opsiyonel ama anlamlıysa ekle): ne yapıldı + **neden**, nasıl değil. Her satır max 72 karakter.
   - **Footer**: BREAKING CHANGE varsa veya ticket varsa ekle (`Refs: OKS-XXX`).

3. **Birden fazla mantıksal değişiklik** varsa **commit'i parçalamayı öner**: "Bu değişiklik 2 ayrı şeyi içeriyor (X ve Y). İkisini ayrı commit'e bölmek ister misin?"

4. **Draft mesajı göster** ve onay iste. Format:
   ```
   Önerilen commit mesajı:
   ----------------------
   <type>(<scope>): <subject>

   <body>

   <footer>
   ----------------------
   Onaylıyor musun? (evet / düzelt / iptal)
   ```

5. **Onay alınca** `git commit -m "..."` çalıştır. Multi-line için `-m` flag'ini birden fazla kullan veya heredoc.

6. **Commit sonrası** `git log -1 --stat` ile özetle.

## Kurallar (Hatırlatma)

- ✅ `feat(students): add bulk import via excel`
- ✅ `fix(auth): refresh token not invalidated on logout`
- ✅ `chore(deps): bump react-query from 5.0 to 5.4`
- ❌ `update stuff` — yasak
- ❌ `WIP` — yasak
- ❌ `fixed bug` — scope yok, generic
- ❌ `feat: added new feature.` — past tense + nokta
- ❌ Türkçe mesaj — kod tabanı dili İngilizce
- ❌ Subject 72+ karakter

## Argüman

$ARGUMENTS

Kullanıcı argüman verdiyse (örn. `/commit veli mesajlaşması`), bunu ek bağlam olarak değerlendir — değişiklikleri analiz ederken ipucu olarak kullan, ama her zaman `git diff` çıktısına göre doğrula.
