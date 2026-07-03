# Project Detective

> IT 외주 컨설턴트가 프로젝트 자료를 업로드하면, AI가 구조화된 Project Model로 변환하고 부족한 정보를 질문하여 견적/공고/리스크 산출물을 만드는 에이전트.

## 핵심 가치

사람이 문서를 읽고 질문을 만드는 대신, **AI가 문서를 읽고 사람은 AI의 이해를 "검토·승인"만 한다.**

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Vite + React 19 |
| 언어 | TypeScript 6 (strict) |
| 스타일링 | Vanilla CSS + CSS Custom Properties |
| 디자인 시스템 | Claude.com 에디토리얼 (STYLE.md 참조) |
| 폰트 | Cormorant Garamond, Inter, JetBrains Mono |

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:5173/`에서 실행됩니다.

## 프로젝트 구조

```
scope/
├── CLAUDE.md          # 개발 가이드라인 + 워크플로우 룰
├── STYLE.md           # 디자인 시스템 토큰 & 컴포넌트 스펙
├── PRD.md             # 제품 기획서
├── src/
│   ├── types.ts       # PRD 기반 타입 정의
│   ├── mock-data.ts   # Mock 프로젝트 데이터
│   ├── App.tsx        # 앱 셸 (네비게이션 + 라우팅)
│   ├── App.css        # 앱 레이아웃 스타일
│   ├── Workspace.tsx  # 핵심 워크스페이스 (인터뷰 + Project Model)
│   ├── Workspace.css  # 워크스페이스 스타일
│   ├── index.css      # 디자인 시스템 CSS 토큰
│   └── main.tsx       # 엔트리포인트
├── index.html
├── vite.config.ts
└── tsconfig*.json
```

## 문서

- [CLAUDE.md](./CLAUDE.md) — 개발 가이드라인, 코드 컨벤션, 워크플로우 룰
- [STYLE.md](./STYLE.md) — 디자인 시스템 (색상, 타이포, 스페이싱, 컴포넌트)
- [PRD.md](./PRD.md) — 제품 기획서 (Project Model 스키마, 알고리즘)
