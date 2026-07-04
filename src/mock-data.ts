import type { ProjectModel, TimelineEvent } from './types'

export const mockProject: ProjectModel = {
  project_id: '111111',
  org_id: 'org_01',
  title: 'TM CRM 앱 및 관리자 웹 신규 구축',
  client: '(주)한국통신영업',
  assignee: '장수룡',
  updatedAt: '2026-07-04T10:16:30Z',
  status: 'inspection',
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

export const mockProjects: ProjectModel[] = [
  mockProject,
  {
    project_id: '222222',
    org_id: 'org_01',
    title: '아이허브 제휴 연동 쿠폰 시스템',
    client: '약알(Yak-al)',
    assignee: '이상민',
    updatedAt: '2026-07-03T15:20:00Z',
    status: 'recruiting',
    completion: 100,
    detected: { service: '커머스', 플랫폼: '웹' },
    missing: [],
    recommendedQuestions: [],
    source_documents: []
  },
  {
    project_id: '333333',
    org_id: 'org_01',
    title: '유저 테스트용 웹앱 프로토타입 제작',
    client: '스타트업 A',
    assignee: '김세민',
    updatedAt: '2026-07-04T09:00:00Z',
    status: 'inspection',
    completion: 0,
    detected: {},
    missing: [],
    recommendedQuestions: [],
    source_documents: []
  },
  {
    project_id: '444444',
    org_id: 'org_01',
    title: '요양병원 B2B 커머스 플랫폼',
    client: '(주)휴먼스코리아',
    assignee: '김세민',
    updatedAt: '2026-06-25T11:00:00Z',
    status: 'completed',
    completion: 100,
    detected: { service: 'B2B 커머스' },
    missing: [],
    recommendedQuestions: [],
    source_documents: []
  },
  {
    project_id: '555555',
    org_id: 'org_01',
    title: '쇼핑몰 리뉴얼',
    client: '스타일브랜드',
    assignee: '장수룡',
    updatedAt: '2026-06-20T14:30:00Z',
    status: 'cancelled',
    completion: 80,
    detected: { service: '쇼핑몰' },
    missing: [],
    recommendedQuestions: [],
    source_documents: []
  }
]

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'evt_001',
    type: 'document_upload',
    title: 'TM_CRM_요구사항_초안.pdf 업로드 됨',
    description: '초기 요구사항 문서가 시스템에 등록되었습니다.',
    timestamp: '2026-07-04T09:00:00Z',
  },
  {
    id: 'evt_002',
    type: 'ai_analysis',
    title: 'AI 초기 문서 분석 완료',
    description: '핵심 기능(CRM, AI STT, 통화 녹취)을 파악했습니다. 누락된 필수 정보 6건을 발견했습니다.',
    timestamp: '2026-07-04T09:00:15Z',
    impact: '진행도 40% 달성',
  },
  {
    id: 'evt_003',
    type: 'audio_upload',
    title: '1차 킥오프 통화.mp3 업로드 됨',
    description: '고객과의 1차 유선 미팅 녹취 파일이 등록되었습니다.',
    timestamp: '2026-07-04T10:15:00Z',
  },
  {
    id: 'evt_004',
    type: 'ai_analysis',
    title: '통화 녹취 분석 완료',
    description: '관리자 권한 상세 내용 및 기존 시스템 유무가 확인되어 공고문에 반영되었습니다.',
    timestamp: '2026-07-04T10:16:30Z',
    impact: '진행도 68% 달성',
  },
]
