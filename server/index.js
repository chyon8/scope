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
    if (req.file.mimetype === 'application/pdf') {
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
      newText = "Audio/Image file uploaded. (Transcription processing skipped in MVP backend)";
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

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
