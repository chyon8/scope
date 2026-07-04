# CLAUDE.md — CaseLab 개발 가이드라인

> Behavioral guidelines to reduce common LLM coding mistakes.
> Merge with project-specific instructions as needed.
>
> **Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## ✅ These guidelines are working if:

- Fewer unnecessary changes in diffs
- Fewer rewrites due to overcomplication
- Clarifying questions come before implementation rather than after mistakes

---

## 5. Project-Specific Rules (from PRD)

### 5-1. 프로젝트 개요

**CaseLab**는 IT 외주 컨설턴트가 프로젝트 자료(문서/링크)를 업로드하면, AI가 이를 구조화된 Project Model로 변환하고, 부족한 정보만 골라 질문하여 견적/공고/리스크 산출물을 만드는 에이전트.

- **핵심 가치:** AI가 문서를 읽고 사람은 AI의 이해를 "검토·승인"만 한다.
- **타겟 사용자:** IT 외주 컨설턴트 / SI 영업 담당 / 프리랜서 PM
- **MVP 범위:** 1인 사용, 모드 A(컨설턴트 대리 응답)만 지원

### 5-2. 개발 원칙

1. **디자인 시스템:** `STYLE.md`에 정의된 Claude.com 디자인 시스템을 따른다. 토큰 기반으로 색상/타이포/스페이싱 적용.
2. **Project Model 스키마:** PRD에 정의된 JSON 스키마를 그대로 사용. 임의로 필드를 추가/삭제하지 않는다.
3. **섹션 가중치:** 신뢰도 계산에 사용되는 가중치는 PRD 표 기준. 변경 시 반드시 확인.
4. **상태 관리:** `collecting | interviewing | ready_for_output` 3단계 상태만 존재.
5. **역할 기반 접근:** Owner / Member / Viewer 3가지 역할. MVP에서는 Owner만 구현 가능.
6. **인터뷰 모드:** MVP는 모드 A만. 모드 B(고객 직접 응답)는 2단계.

### 5-3. 코드 컨벤션

- **언어:** TypeScript (strict mode)
- **프레임워크:** Vite + React (SPA)
- **스타일링:** Vanilla CSS with CSS Custom Properties (STYLE.md 토큰 기반)
- **네이밍:** 컴포넌트는 PascalCase, 유틸/훅은 camelCase, CSS 클래스는 kebab-case
- **파일 구조:** feature-based (기능별 폴더 분리)
- **커밋 메시지:** conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `style:`)

### 5-4. 금지 사항

- ❌ TailwindCSS 사용 금지 (명시적 요청 없는 한)
- ❌ 불필요한 third-party 라이브러리 추가 금지 (추가 전 반드시 확인)
- ❌ PRD 스키마 임의 변경 금지
- ❌ `any` 타입 사용 금지
- ❌ 인라인 스타일 사용 금지 (CSS Custom Properties 사용)
- ❌ 하드코딩된 색상값 사용 금지 (토큰 참조만 허용)

### 5-5. 파일 참조

- 디자인 시스템: [`STYLE.md`](file:///Users/isangmin/Desktop/JS/scope/STYLE.md)
- 제품 기획서: [`PRD.md`](file:///Users/isangmin/Desktop/JS/scope/PRD.md)

---

## 6. Git 워크플로우 (필수 준수)

> **절대 규칙:** AI는 터미널에서 git 명령어를 직접 실행하지 않는다.
> 사용자가 복사-붙여넣기 할 수 있는 명령어만 제공한다.

### 파일 변경 시 프로세스

코드 변경이 발생하면 반드시 아래 순서를 따른다:

#### Step 1: 변경 리포트

변경된 파일 목록과 각 파일의 변경 내용을 설명한다.

```
📁 변경된 파일:
- src/Workspace.tsx — [무엇을 왜 변경했는지]
- src/Workspace.css — [무엇을 왜 변경했는지]

📝 변경 요약:
[전체적으로 어떤 기능이 바뀌었는지 한 줄 설명]
```

#### Step 2: 검토 체크리스트

사용자가 변경 사항을 확인할 수 있는 구체적인 체크리스트를 제공한다.

```
✅ 검토 체크리스트:
- [ ] 브라우저에서 [특정 화면]을 열어 [특정 동작] 확인
- [ ] [특정 입력]을 해보면 [기대 결과]가 나와야 함
- [ ] [특정 상태]에서 [특정 UI]가 올바르게 표시되는지 확인
```

#### Step 3: 사용자 컨펌 대기

사용자가 "확인" 또는 "컨펌"이라고 할 때까지 대기한다.

#### Step 4: Git 명령어 제공

사용자가 컨펌하면, 복사-붙여넣기용 git 명령어를 제공한다.

````
```bash
git add -A
git commit -m "feat: [변경 내용 요약]"
git push origin main
```
````

### 커밋 메시지 규칙

- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 리팩토링 (기능 변경 없음)
- `style:` 스타일/UI 변경
- `docs:` 문서 변경
- `chore:` 설정, 의존성 등

### 금지 사항

- ❌ AI가 `git add`, `git commit`, `git push` 등을 터미널에서 직접 실행하는 것
- ❌ 사용자 컨펌 없이 커밋 명령어를 제공하는 것
- ❌ 변경 리포트 없이 바로 커밋을 제안하는 것
