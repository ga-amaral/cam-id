/* 
  Project: Product ID - AI Product Identification
  Author: Gabriel Amaral (https://instagram.com/sougabrielamaral)
  Date: 11/05/2026
*/

// ========== STATE ==========
const state = {
  cameraActive: false,
  stream: null,
  apiKey: '',
  language: 'pt',
  detailLevel: 'detailed',
  autoScan: false,
  autoScanInterval: 5,
  autoScanTimer: null,
  history: [],
  isAnalyzing: false,
  darkMode: true
};

// ========== DOM REFS ==========
const $ = id => document.getElementById(id);

const els = {
  language: $('language'),
  detailLevel: $('detailLevel'),
  themeToggle: $('themeToggle'),
  themeIcon: $('themeIcon'),
  themeText: $('themeText'),
  videoFeed: $('videoFeed'),
  cameraPlaceholder: $('cameraPlaceholder'),
  cameraContainer: $('cameraContainer'),
  scannerOverlay: $('scannerOverlay'),
  loadingOverlay: $('loadingOverlay'),
  loadingText: $('loadingText'),
  btnToggleCamera: $('btnToggleCamera'),
  cameraBtnIcon: $('cameraBtnIcon'),
  cameraBtnText: $('cameraBtnText'),
  btnIdentify: $('btnIdentify'),
  identifyBtnText: $('identifyBtnText'),
  autoScanToggle: $('autoScanToggle'),
  autoScanLabel: $('autoScanLabel'),
  intervalSlider: $('intervalSlider'),
  intervalValue: $('intervalValue'),
  statusDot: $('statusDot'),
  statusText: $('statusText'),
  placeholderText: $('placeholderText'),
  resultEmpty: $('resultEmpty'),
  resultContent: $('resultContent'),
  resultThumbnail: $('resultThumbnail'),
  resultName: $('resultName'),
  resultCategory: $('resultCategory'),
  resultConfidence: $('resultConfidence'),
  resultColor: $('resultColor'),
  resultType: $('resultType'),
  resultMaterial: $('resultMaterial'),
  resultCondition: $('resultCondition'),
  resultDescription: $('resultDescription'),
  confidenceBarFill: $('confidenceBarFill'),
  historyList: $('historyList'),
  historyEmpty: $('historyEmpty'),
  historyCount: $('historyCount'),
  canvas: $('captureCanvas'),
  toastContainer: $('toastContainer')
};

// ========== TOAST ==========
function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========== THEME ==========
function updateTheme() {
  if (state.darkMode) {
    document.body.classList.remove('light-mode');
    els.themeIcon.textContent = '🌙';
    els.themeText.textContent = 'Escuro';
  } else {
    document.body.classList.add('light-mode');
    els.themeIcon.textContent = '☀️';
    els.themeText.textContent = 'Claro';
  }
}

els.themeToggle.addEventListener('click', () => {
  state.darkMode = !state.darkMode;
  updateTheme();
  saveSettings();
});

// ========== SETTINGS BINDINGS & PERSISTENCE ==========
function saveSettings() {
    const settings = {
        language: state.language,
        detailLevel: state.detailLevel,
        darkMode: state.darkMode
    };
    localStorage.setItem('productID_settings', JSON.stringify(settings));
}

function loadSavedSettings() {
    const saved = localStorage.getItem('productID_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.language = settings.language || state.language;
        state.detailLevel = settings.detailLevel || state.detailLevel;
        state.darkMode = settings.darkMode !== undefined ? settings.darkMode : state.darkMode;
        
        els.language.value = state.language;
        els.detailLevel.value = state.detailLevel;
        updateTheme();
        updateLabels();
    }
}

els.language.addEventListener('change', e => { state.language = e.target.value; updateLabels(); saveSettings(); });
els.detailLevel.addEventListener('change', e => { state.detailLevel = e.target.value; saveSettings(); });

// ========== LABELS (i18n) ==========
const labels = {
  pt: {
    category: 'Categoria', confidence: 'Confiança', color: 'Cor',
    type: 'Tipo', material: 'Material', condition: 'Estado',
    placeholder: 'Clique em "Iniciar Câmera" para começar',
    empty: 'Capture uma imagem para identificar um produto.<br>Os resultados aparecerão aqui.',
    analyzing: 'Analisando produto...',
    ready: 'Pronto',
    cameraOn: 'Câmera ativa',
    cameraOff: 'Câmera desligada',
    scanning: 'Escaneando...',
    historyEmpty: 'Nenhuma identificação ainda.',
    autoScan: 'Auto-scan',
    noApiKey: 'ERRO: API Key não detectada no .env. Use Live Server.',
    cameraError: 'Erro na câmera: ',
    apiError: 'Erro na API: '
  },
  en: {
    category: 'Category', confidence: 'Confidence', color: 'Color',
    type: 'Type', material: 'Material', condition: 'Condition',
    placeholder: 'Click "Start Camera" to begin',
    empty: 'Capture an image to identify a product.<br>Results will appear here.',
    analyzing: 'Analyzing product...',
    ready: 'Ready',
    cameraOn: 'Camera active',
    cameraOff: 'Camera off',
    scanning: 'Scanning...',
    historyEmpty: 'No identifications yet.',
    autoScan: 'Auto-scan',
    noApiKey: 'ERROR: API Key not detected in .env. Use Live Server.',
    cameraError: 'Camera error: ',
    apiError: 'API Error: '
  }
};

function t(key) { return labels[state.language][key] || key; }

function updateLabels() {
  $('labelCategory').textContent = t('category');
  $('labelConfidence').textContent = t('confidence');
  $('labelColor').textContent = t('color');
  $('labelType').textContent = t('type');
  $('labelMaterial').textContent = t('material');
  $('labelCondition').textContent = t('condition');
  els.placeholderText.textContent = t('placeholder');
  $('emptyText').innerHTML = t('empty');
  els.loadingText.textContent = t('analyzing');
  els.autoScanLabel.textContent = t('autoScan');
  if (!state.cameraActive) setStatus(t('ready'), '');
  $('historyEmpty').textContent = t('historyEmpty');
}

// ========== CAMERA ==========
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    state.stream = stream;
    els.videoFeed.srcObject = stream;
    els.videoFeed.classList.add('active');
    els.cameraPlaceholder.style.display = 'none';
    state.cameraActive = true;
    els.cameraBtnIcon.textContent = '⏹';
    els.cameraBtnText.textContent = state.language === 'pt' ? 'Parar Câmera' : 'Stop Camera';
    els.btnIdentify.disabled = false;
    setStatus(t('cameraOn'), 'active');
  } catch (err) {
    setStatus(t('cameraError') + err.message, 'error');
    showToast(t('cameraError') + err.message, 'error');
  }
}

function stopCamera() {
  if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
  els.videoFeed.classList.remove('active');
  els.videoFeed.srcObject = null;
  els.cameraPlaceholder.style.display = '';
  state.cameraActive = false;
  els.cameraBtnIcon.textContent = '▶';
  els.cameraBtnText.textContent = state.language === 'pt' ? 'Iniciar Câmera' : 'Start Camera';
  els.btnIdentify.disabled = true;
  setStatus(t('cameraOff'), '');
}

els.btnToggleCamera.addEventListener('click', () => state.cameraActive ? stopCamera() : startCamera());

// ========== IDENTIFY ==========
async function identifyProduct() {
  if (!state.apiKey || state.apiKey.trim() === '' || state.apiKey.includes('xxxx')) {
    showToast(t('noApiKey'), 'error');
    return;
  }
  
  if (!state.cameraActive || state.isAnalyzing) return;

  state.isAnalyzing = true;
  els.btnIdentify.disabled = true;
  els.scannerOverlay.classList.add('active');
  setStatus(t('scanning'), 'scanning');

  await new Promise(r => setTimeout(r, 1200));

  const canvas = els.canvas;
  const video = els.videoFeed;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const base64Image = canvas.toDataURL('image/jpeg', 0.85);

  els.scannerOverlay.classList.remove('active');
  els.loadingOverlay.classList.add('active');

  try {
    const result = await callVisionAPI(base64Image);
    displayResult(result, base64Image);
    addToHistory(result, base64Image);
    showToast(state.language === 'pt' ? 'Sucesso!' : 'Success!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    setStatus(err.message, 'error');
  } finally {
    els.loadingOverlay.classList.remove('active');
    state.isAnalyzing = false;
    els.btnIdentify.disabled = false;
    if (state.cameraActive) setStatus(t('cameraOn'), 'active');
  }
}

els.btnIdentify.addEventListener('click', identifyProduct);

async function callVisionAPI(base64Image) {
  const isPT = state.language === 'pt';
  const prompt = `Responda APENAS com JSON em ${isPT ? 'português' : 'english'}. Identifique o produto com campos: name, category, color, type, material, condition, confidence (High/Medium/Low), confidence_pct (0-100), description (1-2 frases).`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Especialista em identificação de produtos.' },
        { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: base64Image } }] }
      ]
    })
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.match(/\{[\s\S]*\}/)[0]);
}

function displayResult(data, thumb) {
  els.resultEmpty.style.display = 'none';
  els.resultContent.classList.add('active');
  els.resultThumbnail.src = thumb;
  els.resultName.textContent = data.name || '—';
  els.resultCategory.textContent = data.category || '—';
  els.resultColor.textContent = data.color || '—';
  els.resultType.textContent = data.type || '—';
  els.resultMaterial.textContent = data.material || '—';
  els.resultCondition.textContent = data.condition || '—';
  const pct = data.confidence_pct || 0;
  els.resultConfidence.textContent = `${data.confidence || '—'} (${pct}%)`;
  els.confidenceBarFill.style.width = `${pct}%`;
  els.resultDescription.textContent = data.description || '';
  els.confidenceBarFill.style.background = pct >= 70 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');
}

function addToHistory(data, thumbnail) {
  state.history.unshift({ name: data.name, category: data.category, time: new Date().toLocaleTimeString(), thumbnail, data });
  if (state.history.length > 20) state.history.pop();
  renderHistory();
}

function renderHistory() {
  els.historyCount.textContent = `${state.history.length}/20`;
  if (state.history.length === 0) return;
  els.historyEmpty.style.display = 'none';
  els.historyList.innerHTML = '';
  state.history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<img class="history-thumb" src="${item.thumbnail}"><div class="history-info"><div class="history-name">${item.name}</div><div class="history-meta"><span>${item.category}</span> • <span>${item.time}</span></div></div>`;
    div.addEventListener('click', () => displayResult(item.data, item.thumbnail));
    els.historyList.appendChild(div);
  });
}

els.autoScanToggle.addEventListener('change', e => {
  state.autoScan = e.target.checked;
  if (state.autoScan) {
    state.autoScanTimer = setInterval(() => { if (state.cameraActive && !state.isAnalyzing) identifyProduct(); }, 5000);
  } else {
    clearInterval(state.autoScanTimer);
  }
});

function setStatus(text, dotClass) {
  els.statusText.textContent = text;
  els.statusDot.className = 'status-dot ' + (dotClass || '');
}

async function loadEnv() {
    if (window.location.protocol === 'file:') return;
    try {
        const response = await fetch('.env?v=' + Math.random());
        if (!response.ok) return;
        const text = await response.text();
        text.split(/\r?\n/).forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine && !cleanLine.startsWith('#')) {
                const parts = cleanLine.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key === 'OPENAI_API_KEY') state.apiKey = value;
                    if (key === 'LANGUAGE') { state.language = value; els.language.value = value; }
                }
            }
        });
        updateLabels();
    } catch (err) {}
}

loadSavedSettings();
loadEnv();
updateTheme();
updateLabels();
