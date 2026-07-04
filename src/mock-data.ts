import type { ProjectModel, InterviewMessage } from './types'

export const mockProject: ProjectModel = {
  project_id: 'proj_001',
  org_id: 'org_001',
  status: 'interviewing',
  completion: 68,
  detected: {
    service: 'TM CRM',
    platform: '모바일 앱',
    projectType: '신규 구축',
    users: '250명',
    coreFeatures: [
      'CRM',
      'AI STT',
      '통화 녹취'
    ],
    admin: '필요 (추론)',
    currentOperation: '없음'
  },
  missing: [
    {
      title: '관리자 페이지 상세 범위',
      priority: 5
    },
    {
      title: '디자인 포함 여부',
      priority: 5
    },
    {
      title: '기존 시스템 존재 여부',
      priority: 4
    },
    {
      title: '예산',
      priority: 3
    },
    {
      title: '일정',
      priority: 3
    },
    {
      title: '클라이언트 준비 자료',
      priority: 2
    }
  ],
  recommendedQuestions: [
    {
      question: '관리자 페이지도 필요한가요?',
      reason: '개발 범위와 견적이 크게 달라집니다.',
      priority: 5
    },
    {
      question: '신규 구축인가요, 기존 시스템 개선인가요?',
      reason: '프로젝트 성격이 결정됩니다.',
      priority: 5
    },
    {
      question: '디자인도 함께 진행하시나요?',
      reason: '수행 범위와 투입 인력이 달라집니다.',
      priority: 5
    }
  ],
  source_documents: [
    { doc_id: 'doc_001', name: 'TM_CRM_요구사항_초안.pdf', type: 'pdf', status: 'processed' }
  ],
  draft: `[프로젝트 개요]
250명 규모의 TM 조직에서 사용할 모바일 CRM 시스템 신규 구축

[프로젝트 배경 및 목표]
- 현재 운영 중인 시스템 없음
- 영업 생산성 향상 및 통화 품질 관리

[과업 범위]
- 플랫폼: 모바일 앱
- 핵심 기능: CRM, AI STT(음성인식), 통화 녹취
- 관리자 페이지: (상세 범위 확인 필요)
- 디자인: (포함 여부 확인 필요)

[기타]
- 기존 시스템: (존재 여부 확인 필요)
- 예산: (확인 필요)
- 일정: (확인 필요)`
}

export const mockMessages: InterviewMessage[] = [
  {
    id: 'msg_001',
    role: 'ai',
    content: '안녕하세요! 업로드해주신 TM CRM 요구사항 문서를 분석했습니다.\n\n현재 공고 작성 가능 수준은 **68%**입니다. 서비스 개요와 핵심 기능(CRM, AI STT, 통화 녹취 등)은 파악되었습니다.\n\n하지만 명확한 공고 작성을 위해 몇 가지 확인이 필요합니다.',
    timestamp: '2026-07-04T10:10:00Z',
  },
  {
    id: 'msg_002',
    role: 'ai',
    content: '**관리자 페이지도 함께 구축**해야 하나요?\n\n이 여부에 따라 전체적인 개발 범위와 견적이 크게 달라질 수 있습니다.',
    timestamp: '2026-07-04T10:10:05Z',
  },
]
