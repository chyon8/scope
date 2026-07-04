# STYLE.md — CaseLab 디자인 시스템

> Claude.com의 디자인 시스템을 기반으로 한 CaseLab UI 가이드.
> 개발 시 이 문서의 토큰과 컴포넌트 스펙을 반드시 참조한다.
> **하드코딩된 색상값, 폰트 사이즈, 스페이싱 사용 금지 — CSS Custom Properties로만 적용.**

---

## Overview

기본 분위기는 **따뜻한 크림 캔버스** (`--color-canvas: #faf9f5`) 위에 세리프 디스플레이 + 산세리프 바디의 에디토리얼 조합. 차가운 그레이-화이트가 아닌, 의도적으로 따뜻한 톤을 유지한다.

브랜드 전압은 **크림 + 코랄** 조합에서 나온다. 코랄(`--color-primary: #cc785c`)은 모든 Primary CTA, 브랜드 워드마크, 풀블리드 콜아웃 카드에 사용.

세 가지 서피스 모드가 페이지별로 교대:
1. **크림 캔버스** (`--color-canvas`) — 기본 바닥
2. **라이트 크림 카드** (`--color-surface-card`) — 피처 카드 배경
3. **다크 네이비 프로덕트 서피스** (`--color-surface-dark`) — 코드 에디터, 모델 쇼케이스, 프리푸터 CTA, 푸터

---

## Colors

### CSS Custom Properties 정의

```css
:root {
  /* Brand & Accent */
  --color-primary: #cc785c;
  --color-primary-active: #a9583e;
  --color-primary-disabled: #e6dfd8;
  --color-accent-teal: #5db8a6;
  --color-accent-amber: #e8a55a;

  /* Surface */
  --color-canvas: #faf9f5;
  --color-surface-soft: #f5f0e8;
  --color-surface-card: #efe9de;
  --color-surface-cream-strong: #e8e0d2;
  --color-surface-dark: #181715;
  --color-surface-dark-elevated: #252320;
  --color-surface-dark-soft: #1f1e1b;
  --color-hairline: #e6dfd8;
  --color-hairline-soft: #ebe6df;

  /* Text */
  --color-ink: #141413;
  --color-body-strong: #252523;
  --color-body: #3d3d3a;
  --color-muted: #6c6a64;
  --color-muted-soft: #8e8b82;
  --color-on-primary: #ffffff;
  --color-on-dark: #faf9f5;
  --color-on-dark-soft: #a09d96;

  /* Semantic */
  --color-success: #5db872;
  --color-warning: #d4a017;
  --color-error: #c64545;
}
```

### 사용 원칙

- 캔버스는 반드시 크림(`--color-canvas`). 순백색 금지.
- 코랄(`--color-primary`)은 Primary CTA와 풀블리드 콜아웃에만 사용. 남용 금지.
- 차가운 블루/시안 계열 액센트 금지. 코랄이 브랜드 전압.
- 연속된 두 밴드에 같은 서피스 모드 반복 금지. 크림→카드→다크→크림→코랄 콜아웃→다크 푸터 순으로 페이싱.

---

## Typography

### 폰트 패밀리

```css
:root {
  --font-display: 'Cormorant Garamond', 'EB Garamond', 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-code: 'JetBrains Mono', 'Fira Code', monospace;
}
```

> **참고:** Copernicus/Tiempos Headline(세리프)과 StyreneB(산세리프)는 Anthropic 라이선스 전용.
> 오픈소스 대체: 세리프 → Cormorant Garamond (weight 500, letter-spacing -0.02em), 산세리프 → Inter.

### 타이포그래피 토큰

```css
:root {
  /* Display — Serif (Cormorant Garamond) */
  --type-display-xl: 500 64px/1.05 var(--font-display);   /* letter-spacing: -1.5px */
  --type-display-lg: 500 48px/1.1 var(--font-display);    /* letter-spacing: -1px */
  --type-display-md: 500 36px/1.15 var(--font-display);   /* letter-spacing: -0.5px */
  --type-display-sm: 500 28px/1.2 var(--font-display);    /* letter-spacing: -0.3px */

  /* Title — Sans (Inter) */
  --type-title-lg: 500 22px/1.3 var(--font-body);
  --type-title-md: 500 18px/1.4 var(--font-body);
  --type-title-sm: 500 16px/1.4 var(--font-body);

  /* Body — Sans (Inter) */
  --type-body-md: 400 16px/1.55 var(--font-body);
  --type-body-sm: 400 14px/1.55 var(--font-body);

  /* Caption */
  --type-caption: 500 13px/1.4 var(--font-body);
  --type-caption-uppercase: 500 12px/1.4 var(--font-body);  /* letter-spacing: 1.5px; text-transform: uppercase */

  /* Code */
  --type-code: 400 14px/1.6 var(--font-code);

  /* UI */
  --type-button: 500 14px/1.0 var(--font-body);
  --type-nav-link: 500 14px/1.4 var(--font-body);
}
```

### 타이포그래피 규칙

| 규칙 | 설명 |
|---|---|
| 디스플레이 = 세리프 전용 | h1~h3, 히어로 디스플레이는 반드시 `--font-display`. Inter로 디스플레이 쓰지 않는다. |
| 네거티브 레터스페이싱 필수 | 디스플레이 사이즈에 -0.3px ~ -1.5px 적용. 없으면 브랜드 느낌이 깨진다. |
| 세리프 weight 400~500만 | 볼드(700) 금지. 400에서 강조는 사이즈를 키운다. |
| 바디 = 산세리프 전용 | 본문, 네비게이션, 버튼, 캡션은 `--font-body`. |
| 코드 = 모노스페이스 | 코드 블록, 터미널은 `--font-code`. |

---

## Layout

### 스페이싱 시스템

```css
:root {
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-section: 96px;
}
```

### 그리드 & 컨테이너

- **최대 콘텐츠 너비:** ~1200px 중앙 정렬
- **12컬럼 그리드:** 히어로는 6/6 분할 (좌 h1, 우 일러스트)
- **피처 카드:** 데스크톱 3열, 태블릿 2열, 모바일 1열
- **프라이싱:** 데스크톱 3열, 모바일 1열

### 여백 철학

크림 캔버스 + 세리프 디스플레이 + 넉넉한 내부 패딩 → 에디토리얼 페이싱. 밴드 사이 여백은 `--space-section`(96px)으로 통일. 카드 내부 패딩은 `--space-xl`(32px)로 여유롭게.

---

## Elevation & Depth

| 레벨 | 처리 | 용도 |
|---|---|---|
| Flat | 그림자/보더 없음 | 바디 섹션, 탑 네비, 히어로 밴드 |
| Soft hairline | 1px `--color-hairline` 보더 | 인풋, 서브네비, 가끔 카드 |
| Cream card | `--color-surface-card` 배경 (그림자 없음) | 피처 카드, 콘텐츠 카드 |
| Dark surface | `--color-surface-dark` 배경 (그림자 없음) | 코드 에디터, 모델 쇼케이스 |
| Subtle shadow | `0 1px 3px rgba(20,20,19,0.08)` | 호버 상승 상태 (드물게) |

**원칙:** 색상 블록 우선, 그림자 최소. 대부분의 깊이감은 크림↔다크 서피스 대비로 표현.

---

## Shapes

### 보더 레디우스

```css
:root {
  --rounded-xs: 4px;
  --rounded-sm: 6px;
  --rounded-md: 8px;    /* 버튼, 인풋 */
  --rounded-lg: 12px;   /* 콘텐츠 카드, 프라이싱 카드 */
  --rounded-xl: 16px;   /* 히어로 일러스트 컨테이너 */
  --rounded-pill: 9999px; /* 배지, 태그 */
  --rounded-full: 50%;    /* 아바타, 아이콘 버튼 */
}
```

---

## Components

### 버튼

| 컴포넌트 | 배경 | 텍스트 | 보더 | 라운딩 | 패딩 | 높이 |
|---|---|---|---|---|---|---|
| `button-primary` | `--color-primary` | `--color-on-primary` | 없음 | `--rounded-md` | 12px × 20px | 40px |
| `button-primary-active` | `--color-primary-active` | `--color-on-primary` | 없음 | `--rounded-md` | 12px × 20px | 40px |
| `button-secondary` | `--color-canvas` | `--color-ink` | 1px `--color-hairline` | `--rounded-md` | 12px × 20px | 40px |
| `button-secondary-on-dark` | `--color-surface-dark-elevated` | `--color-on-dark` | 없음 | `--rounded-md` | 12px × 20px | 40px |
| `button-text-link` | 없음 | `--color-primary` | 없음 | — | — | — |

### 카드

| 컴포넌트 | 배경 | 라운딩 | 패딩 |
|---|---|---|---|
| `feature-card` | `--color-surface-card` | `--rounded-lg` | `--space-xl` |
| `product-mockup-card-dark` | `--color-surface-dark` | `--rounded-lg` | `--space-xl` |
| `code-window-card` | `--color-surface-dark` | `--rounded-lg` | `--space-lg` |
| `pricing-tier-card` | `--color-canvas` + hairline | `--rounded-lg` | `--space-xl` |
| `pricing-tier-card-featured` | `--color-surface-dark` | `--rounded-lg` | `--space-xl` |
| `callout-card-coral` | `--color-primary` | `--rounded-lg` | `--space-xxl` |

### 인풋

| 컴포넌트 | 배경 | 보더 | 라운딩 | 높이 |
|---|---|---|---|---|
| `text-input` | `--color-canvas` | 1px `--color-hairline` | `--rounded-md` | 40px |
| `text-input-focused` | `--color-canvas` | 1px `--color-primary` + 3px coral ring | `--rounded-md` | 40px |

### 배지

| 컴포넌트 | 배경 | 텍스트 | 라운딩 | 패딩 |
|---|---|---|---|---|
| `badge-pill` | `--color-surface-card` | `--color-ink` | `--rounded-pill` | 4px × 12px |
| `badge-coral` | `--color-primary` | `--color-on-primary` | `--rounded-pill` | 4px × 12px |

### 네비게이션

- **Top Nav:** 64px 높이, `--color-canvas` 배경, 좌측 로고, 중앙-좌 메뉴, 우측 CTA
- **Category Tab:** 비활성 = 투명 + `--color-muted` / 활성 = `--color-surface-card` + `--color-ink`
- **Footer:** `--color-surface-dark` 배경, 4컬럼 링크, `--color-on-dark-soft` 텍스트

---

## Responsive Behavior

### 브레이크포인트

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) and (max-width: 1439px) { }

/* Wide */
@media (min-width: 1440px) { }
```

| 브레이크포인트 | 주요 변경 |
|---|---|
| Mobile (< 768px) | 햄버거 네비; h1 64→32px; 히어로 카드 아래로 스택; 피처 1열; 푸터 1열 |
| Tablet (768–1024px) | 네비 유지 but 축소; 피처 2열; 프라이싱 2열 |
| Desktop (1024–1440px) | 풀 네비; 피처 3열; 프라이싱 3열 |
| Wide (> 1440px) | 데스크톱과 동일, 외부 여백 증가; max-width 1200px 유지 |

### 터치 타겟

- 버튼 최소 40×40px
- 인풋 높이 40px
- 카드 전체 영역 탭 가능

### 이미지 동작

- 코드 블록: 고정 폰트 사이즈, 모바일에서 가로 스크롤 (줄바꿈 금지)
- 히어로 일러스트: 비례 축소
- 아바타: 모든 브레이크포인트에서 원형 크롭

---

## Do's and Don'ts

### ✅ Do

- 모든 페이지를 크림 캔버스에 앵커. 순백색은 "다른 AI 툴"처럼 보인다.
- 디스플레이 헤드라인은 반드시 세리프. 네거티브 레터스페이싱 필수.
- 코랄은 Primary CTA와 풀블리드 콜아웃에만 사용.
- 프로덕트 크롬을 보여줄 때 다크 서피스 카드 사용.
- 크림 피처 카드와 다크 목업 카드를 교대 배치 (페이싱 메커니즘).
- 밴드 사이 `--space-section`(96px) 적용.

### ❌ Don't

- 캔버스에 쿨 그레이/순백색 사용 금지.
- 세리프 디스플레이 볼드(700) 금지.
- 블루/시안 계열 브랜드 액센트 금지.
- 코랄 남용 금지 — 개별 요소에는 절제, 풀블리드 카드에만 풍부하게.
- 디스플레이 헤드라인에 Inter 사용 금지.
- 연속 밴드 같은 서피스 반복 금지.

---

## Iteration Guide

1. 한 번에 하나의 컴포넌트에 집중. YAML 키로 참조.
2. 변형(`-active`, `-disabled`, `-focused`)은 별도 항목.
3. 토큰 참조만 사용 — 인라인 hex 금지.
4. 호버 상태 문서화 금지. Default와 Active/Pressed만.
5. 디스플레이 = 세리프 400 + 네거티브 트래킹. 바디 = Inter 400. 이 분리는 깨지지 않는다.
6. 크림 + 코랄 + 다크 네이비 = 삼위일체. 네 번째 서피스 톤 도입 금지.
7. 강조가 필요하면: 볼드보다 더 큰 세리프.
