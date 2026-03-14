# VocabMaster

스마트 영단어 학습 PWA — CSV 업로드, 플래시카드, 타이핑 테스트, SRS 복습, 게이미피케이션

**Live:** https://cranverry.github.io/vocab-master/

## 기능

- 📚 챕터별 단어 관리 (CSV 업로드)
- 🃏 플래시카드 (SM-2 평가)
- ⌨️ 타이핑 테스트
- 🔄 전체 SRS 복습
- 📊 암기 수준 추적 (신규/학습중/복습중/완료)
- 🎮 XP, 레벨, 연속 스트릭, 뱃지
- 📱 PWA — 홈 화면 추가 가능

## CSV 형식

```
번호,영단어,뜻,동의어
1,afford,주다,"provide, give, grant"
2,announce,공표하다,"proclaim, publish, declare"
```

## 로컬 개발

```bash
npm install
npm run dev
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 GitHub Pages에 배포합니다.
