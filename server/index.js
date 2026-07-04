const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { generateAnalysisPrompt } = require('./prompt');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const DATA_FILE = path.join(__dirname, 'data.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ projects: [] }, null, 2));
}

function readData() {
  const raw = fs.readFileSync(DATA_FILE);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all projects
app.get('/api/projects', (req, res) => {
  const data = readData();
  res.json(data.projects);
});

// GET a single project
app.get('/api/projects/:id', (req, res) => {
  const data = readData();
  const project = data.projects.find(p => p.project_id === req.params.id);
  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

// POST a new project
app.post('/api/projects', (req, res) => {
  const { project_id, title, client, assignee } = req.body;
  const data = readData();
  
  if (data.projects.some(p => p.project_id === project_id)) {
    return res.status(400).json({ error: '이미 존재하는 프로젝트 아이디입니다.' });
  }

  const newProject = {
    project_id: project_id,
    org_id: 'org_01',
    title: title || '새 프로젝트',
    client: client || '미정',
    assignee: assignee || '미지정',
    updatedAt: new Date().toISOString(),
    status: 'new',
    completion: 0,
    detected: {},
    missing: [],
    recommendedQuestions: [],
    source_documents: [],
    events: [],
    draft: ''
  };
  data.projects.unshift(newProject);
  writeData(data);
  res.json(newProject);
});

// AI setup
console.log('OPENAI_API_KEY detected:', !!process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// POST upload file/text to a project
app.post('/api/projects/:id/upload', upload.single('file'), async (req, res) => {
  const projectId = req.params.id;
  const data = readData();
  const projectIndex = data.projects.findIndex(p => p.project_id === projectId);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = data.projects[projectIndex];
  let newText = req.body.text || '';
  let eventType = req.body.text ? 'quick_memo' : 'document_upload';
  let eventTitle = req.body.text ? '텍스트 메모 추가됨' : '파일 업로드됨';

  if (req.file) {
    eventType = req.file.mimetype.includes('audio') ? 'audio_upload' : 'document_upload';
    eventTitle = `${req.file.originalname} 업로드됨`;
    
    // Basic PDF Parsing
    if (req.file.mimetype.includes('audio')) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: 'whisper-1',
        });
        newText = transcription.text;
      } catch (e) {
        console.error("Whisper API error", e);
        newText = "오디오 텍스트 변환에 실패했습니다.";
      }
    } else if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      try {
        const parsedData = await pdfParse(dataBuffer);
        newText = parsedData.text;
      } catch (e) {
        console.error("PDF Parse error", e);
      }
    } else if (req.file.mimetype.includes('text') || req.file.mimetype === 'application/json') {
      newText = fs.readFileSync(req.file.path, 'utf8');
    } else {
      newText = "지원하지 않는 파일 형식입니다.";
    }
    
    // cleanup temp file
    fs.unlinkSync(req.file.path);
  }

  const now = new Date().toISOString();
  
  // Add upload event
  project.events.push({
    id: `evt_${Date.now()}`,
    type: eventType,
    title: eventTitle,
    description: newText.substring(0, 100) + '...',
    timestamp: now
  });

  try {
    // Call AI
    const prompt = generateAnalysisPrompt(project, newText);
    
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" }
      });
      
      const aiResult = JSON.parse(completion.choices[0].message.content);
      
      project.completion = aiResult.completion || project.completion;
      project.detected = aiResult.detected || project.detected;
      project.missing = aiResult.missing || project.missing;
      project.recommendedQuestions = aiResult.recommendedQuestions || project.recommendedQuestions;
      project.draft = aiResult.draft || project.draft;
      if (project.completion >= 100) project.status = 'ready';
      else if (project.status === 'new') project.status = 'interviewing';

      project.events.push({
        id: `evt_ai_${Date.now()}`,
        type: 'ai_analysis',
        title: 'AI 분석 완료',
        description: '새로운 소스를 바탕으로 대시보드와 공고문이 업데이트되었습니다.',
        timestamp: new Date().toISOString(),
        impact: `진행도 ${project.completion}%`
      });
    } else {
      // Mock logic if no API key
      project.events.push({
        id: `evt_ai_${Date.now()}`,
        type: 'ai_analysis',
        title: 'AI 분석 시뮬레이션',
        description: 'OPENAI_API_KEY가 없어 Mock 업데이트 되었습니다.',
        timestamp: new Date().toISOString(),
      });
      project.completion = Math.min(100, project.completion + 15);
      if (project.completion >= 100) project.status = 'ready';
    }

  } catch (error) {
    console.error("AI API Error", error);
    project.events.push({
      id: `evt_err_${Date.now()}`,
      type: 'ai_analysis',
      title: 'AI 분석 에러',
      description: 'API 호출 중 에러가 발생했습니다.',
      timestamp: new Date().toISOString(),
    });
  }

  project.updatedAt = new Date().toISOString();
  data.projects[projectIndex] = project;
  writeData(data);
  
  res.json(project);
});

// DELETE a project
app.delete('/api/projects/:id', (req, res) => {
  const data = readData();
  const idx = data.projects.findIndex(p => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.projects.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// UPDATE status
app.patch('/api/projects/:id/status', (req, res) => {
  const data = readData();
  const project = data.projects.find(p => p.project_id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  
  const oldStatus = project.status;
  project.status = req.body.status;
  project.updatedAt = new Date().toISOString();
  
  project.events.push({
    id: `evt_status_${Date.now()}`,
    type: 'status_change',
    title: `상태 변경: ${req.body.status}`,
    description: `상태가 ${oldStatus}에서 ${req.body.status}(으)로 변경되었습니다.`,
    timestamp: project.updatedAt
  });
  
  writeData(data);
  res.json(project);
});

// --- MOCK MEETING APIs ---

// 1. GET Meeting List by Project ID
app.get('/api/projects/:id/meetings', (req, res) => {
  const projectId = parseInt(req.params.id, 10) || req.params.id;
  res.json({
    project_id: projectId,
    total: 2,
    results: [
      {
        id: 16, title: "260623_155820_izensoft", partner_slug: "izensoft", member_name: "이문식", duration_secs: 4009, 
        project_title: "무인 키오스크 시스템 구축", summary: "핵심 논의는 예산 및 서버 인프라에 대한 협의였습니다.", created_at: "2026-06-23 00:00:00"
      },
      {
        id: 15, title: "260623_155820_dxplayground", partner_slug: "dxplayground", member_name: "이문식", duration_secs: 2800, 
        project_title: "무인 키오스크 시스템 구축", summary: "UI/UX 커스텀 범위에 대한 1차 논의 완료.", created_at: "2026-06-23 14:00:00"
      }
    ]
  });
});

// 2. GET Meeting Detail (Transcript)
app.get('/api/meetings/:meetingId', (req, res) => {
  const meetingId = parseInt(req.params.meetingId, 10);
  res.json({
    id: meetingId, project_id: 155820, partner_slug: meetingId === 16 ? "izensoft" : "dxplayground",
    summary: "핵심 논의는...",
    transcript: `## 요약\n서버 증설 및 데이터 이관 비용에 대한 이견 존재\n\n## 전문\n[00:01] 매니저: 안녕하세요, 프로젝트 예산 관련해서 질문 주셨는데 답변 가능하실까요?\n[00:15] 파트너: 네, 현재 제시된 5천만 원으로는 기존 데이터 이관 리스크가 있어서 1천만 원 정도 추가 증액이 필요할 것 같습니다.\n[01:40] 클라이언트: 데이터 이관이 왜 그렇게 비용이 많이 드는지 설명 부탁드립니다.\n[02:10] 파트너: 현재 쓰고 계신 레거시 DB 구조가 비정형이라 매핑 로직을 다 새로 짜야 합니다.\n[03:00] 매니저: 그럼 일정은 3개월 안에 가능한가요?\n[03:15] 파트너: 네 일정은 맞출 수 있습니다.`
  });
});

// 3. POST Analyze Meeting (OpenAI)
app.post('/api/meetings/:meetingId/analyze', async (req, res) => {
  const meetingId = req.params.meetingId;
  const data = readData();
  
  if (!data.meetingSummaries) data.meetingSummaries = {};
  
  // Return cached if exists
  if (data.meetingSummaries[meetingId]) {
    return res.json(data.meetingSummaries[meetingId]);
  }

  try {
    const transcript = req.body.transcript || "전문 없음";
    const prompt = `
당신은 IT 외주 전문가입니다. 아래 미팅 대화 전문을 읽고, 개발사(파트너)가 제기한 리스크와 주요 Q&A를 추출하여 JSON 형식으로 반환하세요.
반드시 아래 JSON 스키마를 지키십시오. 마크다운 없이 순수 JSON만 출력하세요.
{
  "risks": [ "리스크 내용1", "리스크 내용2" ],
  "qna": [ { "question": "질문 내용", "answer": "답변 내용" } ],
  "fitScore": "높음"
}

[대화 전문]
${transcript}
    `.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(response.choices[0].message.content);
    data.meetingSummaries[meetingId] = aiResult;
    writeData(data);
    
    res.json(aiResult);
  } catch (error) {
    console.error("AI Analysis error", error);
    res.status(500).json({ error: "AI 분석 실패" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
