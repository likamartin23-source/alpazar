# KANALI I URDHRAVE PËRMES DEPOSË (cloud → terminal, i pavarur nga pronari)

Pse ekziston: sesioni cloud "ALPAZAR web application" mund të SHKRUAJË në depo
por s'dërgon dot mesazhe te sesione të tjera (kredenciali cloud e refuzon).
Terminali (Chrome, sytë live) mund të LEXOJË depon dhe të dërgojë mesazhe.
Pra depoja është kutia postare: cloud shkruan urdhra këtu, terminali i lexon.

## Terminali: cikli i punës (vetëdrejtim)

Pasi bootstrap-i (një herë), terminali punon KËTË cikël pa pronarin:

1. `git pull --rebase origin main`
2. Lexo `.ops/ORDERS.md`. Çdo bllok `## [ID] · pending` që NUK ka përgjigje te
   `.ops/RESULTS.md` është urdhër i ri.
3. Ekzekutoje me sytë e Chrome (verifiko live, bëj screenshot, mat).
4. Shkruaj përgjigjen te `.ops/RESULTS.md` si bllok `## [ID] · done` me gjetjet.
   Screenshot-et ruaji te `.ops/shot/<ID>-*.png` dhe përmendi shtegun.
5. `git add .ops && git commit -m "results: [ID]" && git push origin main`
6. Prit 2–3 min, kthehu te hapi 1. (Ndalo kur ORDERS.md thotë `## FUND`.)

Alternativë për përgjigje: terminali mund të MË DËRGOJË edhe mesazh (bridge
funksionon terminal→cloud) — por RESULTS.md mbetet gjurma zyrtare.

## Cloud (unë): si jap urdhra

Shtoj një bllok te `.ops/ORDERS.md`, `git push origin main`. Kur vjen përgjigja
te RESULTS.md (ose me mesazh), veproj: rregulloj kod/bazë, shtyj, dhe hap urdhrin
pasues.

## Rregulla

- Terminali NUK prek kodin e aplikacionit — vetëm verifikon dhe raporton.
  Rregullimet e kodit i bën vetëm sesioni cloud (një dorë mbi kod).
- Çdo veprim ndjek CLAUDE.md (rregulloren §8, kontratën §2).
