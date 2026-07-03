# Project Detective — 제품 기획서 v2.0

## 1. 제품 정의

**한 줄 정의**: IT 외주 컨설턴트가 프로젝트 자료(문서/링크)를 업로드하면,
AI가 이를 구조화된 Project Model로 변환하고, 부족한 정보만 골라 질문하여
견적/공고/리스크 산출물을 만드는 것을 돕는 에이전트.

**핵심 가치**: 사람이 문서를 읽고 질문을 만드는 대신,
AI가 문서를 읽고 사람은 AI의 이해를 "검토·승인"만 한다.

**타겟 사용자**: IT 외주 컨설턴트 / SI 영업 담당 / 프리랜서 PM
(1인 사용 우선, 추후 에이전시 팀 협업 지원)

---

## 2. 사용자 역할 (신규 정의 — 기존 문서에 누락)

| 역할 | 권한 |
|---|---|
| Owner | 프로젝트 생성/삭제, 견적 템플릿 설정, 팀원 초대 |
| Member | 프로젝트 조회/편집, 인터뷰 진행, 산출물 생성 |
| Viewer | 조회만 가능 (검수용) |

**인터뷰 응답 주체 2가지 모드**:
- 모드 A (대리 응답): 컨설턴트가 고객과 통화/미팅 후 AI 질문에 직접 답변 입력
- 모드 B (고객 직접 응답): 고객에게 인터뷰 링크를 전달, 고객이 직접 답변
  (이 경우 질문 톤/난이도를 비전문가용으로 자동 조정 필요)

이 두 모드 중 MVP는 **모드 A만 지원**. 모드 B는 2단계 이후.

---

## 3. Project Model 스키마 (구현용)

```json
{
  "project_id": "string",
  "org_id": "string",
  "status": "collecting | interviewing | ready_for_output",
  "overall_confidence": 0-100,
  "sections": {
    "purpose":            { "value": "", "confidence": 0-100, "source": "document|user|ai_inferred", "source_refs": [], "updated_at": "" },
    "current_operation":  { ... },
    "users":              { ... },
    "core_problem":       { ... },
    "success_criteria":   { ... },
    "features":           { ... },
    "data":               { ... },
    "admin":              { ... },
    "integrations":       { ... },
    "budget":             { ... },
    "timeline":           { ... }
  },
  "hypotheses": [
    { "id": "", "statement": "", "confidence": 0-100, "status": "unconfirmed|confirmed|rejected", "related_section": "" }
  ],
  "unconfirmed_items": [
    { "id": "", "section": "", "question": "", "priority_score": 0.0, "reason": "" }
  ],
  "source_documents": [
    { "doc_id": "", "type": "pdf|docx|pptx|xlsx|notion|figma|image", "status": "processed|failed|pending_auth" }
  ],
  "interview_log": [
    { "turn_id": "", "question": "", "answer": "", "affected_sections": [], "confidence_delta": 0 }
  ]
}
```

**섹션 가중치 (신뢰도 계산용, 기본값 — 추후 튜닝 가능하게 설정값으로 분리)**

| 섹션 | 가중치 |
|---|---|
| 목적 | 15% |
| 핵심 문제 | 15% |
| 기능 | 15% |
| 사용자 | 10% |
| 데이터 | 10% |
| 관리자 | 10% |
| 외부연동 | 10% |
| 현재 운영방식 | 5% |
| 성공기준 | 5% |
| 예산 | 2.5% |
| 일정 | 2.5% |

---

## 4. 핵심 알고리즘 명세

### 4-1. 전체 이해도 계산
