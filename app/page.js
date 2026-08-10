'use client';

import { useEffect, useRef, useState } from 'react';

const FRAME_SIZE = 1024;
const FRAME_CX = 512, FRAME_CY = 512, FRAME_R = 242;

const CARD_W = 768, CARD_H = 1376;
// Photo slot is now a circle (previous rounded-square is gone with the new template)
const CARD_CX = 383.5, CARD_CY = 687.5, CARD_R = 162.5;
// Info panel — name / role / title live inside this pre-drawn dark green rounded rect
const PANEL_X0 = 144, PANEL_Y0 = 912, PANEL_X1 = 622, PANEL_Y1 = 1140;

const STAGE = 300; // internal drawing resolution of the positioner, independent of display size

const TITLE_POOL = {
  ai: ['Neural Tinkerer', 'Prompt Whisperer', 'Model Wrangler', 'Vector Space Explorer'],
  backend: ['API Whisperer', 'Backend Alchemist', 'Server Sorcerer', 'Uptime Guardian'],
  frontend: ['Pixel Sculptor', 'UI Alchemist', 'Component Wizard', 'Layout Poet'],
  embedded: ['Circuit Bender', 'Solder Sorcerer', 'Firmware Ninja', 'Byte Whisperer'],
  chain: ['Chain Wrangler', 'Block Whisperer', 'Gas Fee Negotiator'],
  design: ['Vibe Architect', 'Pixel Perfectionist'],
  default: ['Chaos Coordinator', 'Late-Night Shipper', 'Bug Whisperer', 'Idea-to-Prod Machine', 'Full-Stack Wave Rider', 'Deadline Surfer']
};

function generateTitle(roleText, avoid) {
  const text = (roleText || '').toLowerCase();
  let pool = [];
  if (/ai|ml|llm|model|neural/.test(text)) pool = pool.concat(TITLE_POOL.ai);
  if (/backend|api|server|node|django|flask/.test(text)) pool = pool.concat(TITLE_POOL.backend);
  if (/frontend|react|vue|ui|css|design/.test(text)) pool = pool.concat(TITLE_POOL.frontend);
  if (/embedded|hardware|esp32|arduino|pcb|firmware/.test(text)) pool = pool.concat(TITLE_POOL.embedded);
  if (/chain|solidity|web3|crypto|blockchain/.test(text)) pool = pool.concat(TITLE_POOL.chain);
  if (pool.length === 0) pool = TITLE_POOL.default.concat(TITLE_POOL.default);
  let pick = pool[Math.floor(Math.random() * pool.length)];
  let attempts = 0;
  while (pick === avoid && attempts < 5) {
    pick = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  }
  return pick;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function Home() {
  const [format, setFormatState] = useState('A');
  const [step, setStep] = useState('upload');
  const [uploadStatus, setUploadStatus] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [shareHint, setShareHint] = useState('');
  const [sharing, setSharing] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [assetError, setAssetError] = useState(false);

  const posCanvasRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);

  const frameImgRef = useRef(null);
  const cardImgRef = useRef(null);
  const uploadedImgRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const baseScaleRef = useRef(1);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef(null);

  // load brand assets once
  useEffect(() => {
    const f = new Image();
    f.onerror = () => setAssetError(true);
    f.src = '/frame.png';
    frameImgRef.current = f;

    const c = new Image();
    c.onerror = () => setAssetError(true);
    c.src = '/card.png';
    cardImgRef.current = c;
  }, []);

  function currentDrawSize() {
    const img = uploadedImgRef.current;
    const s = baseScaleRef.current * zoomRef.current;
    return { w: img.width * s, h: img.height * s };
  }

  function clampPan() {
    const { w, h } = currentDrawSize();
    const minX = STAGE - w, maxX = 0;
    const minY = STAGE - h, maxY = 0;
    const p = panRef.current;
    p.x = Math.min(maxX, Math.max(minX, p.x));
    p.y = Math.min(maxY, Math.max(minY, p.y));
  }

  function drawPositioner() {
    const canvas = posCanvasRef.current;
    if (!canvas || !uploadedImgRef.current) return;
    clampPan();
    const ctx = canvas.getContext('2d');
    const { w, h } = currentDrawSize();
    ctx.clearRect(0, 0, STAGE, STAGE);
    ctx.drawImage(uploadedImgRef.current, panRef.current.x, panRef.current.y, w, h);
  }

  function setupPositioner() {
    const img = uploadedImgRef.current;
    baseScaleRef.current = Math.max(STAGE / img.width, STAGE / img.height);
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    drawPositioner();
  }

  function pointerPos(e) {
    const stage = stageRef.current;
    const rect = stage.getBoundingClientRect();
    const scaleX = STAGE / rect.width;
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - rect.left) * scaleX, y: (p.clientY - rect.top) * scaleX };
  }

  function onPointerDown(e) {
    draggingRef.current = true;
    lastPointerRef.current = pointerPos(e);
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const p = pointerPos(e);
    panRef.current.x += (p.x - lastPointerRef.current.x);
    panRef.current.y += (p.y - lastPointerRef.current.y);
    lastPointerRef.current = p;
    drawPositioner();
  }
  function onPointerUp() { draggingRef.current = false; }

  function onZoomChange(e) {
    zoomRef.current = e.target.value / 100;
    drawPositioner();
  }

  async function ensureFontsReady() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  }

  function composeFrame() {
    const canvas = finalCanvasRef.current;
    canvas.width = FRAME_SIZE; canvas.height = FRAME_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);

    const factor = (FRAME_R * 2) / STAGE;
    const { w, h } = currentDrawSize();
    const dx = (FRAME_CX - FRAME_R) + panRef.current.x * factor;
    const dy = (FRAME_CY - FRAME_R) + panRef.current.y * factor;
    const dw = w * factor, dh = h * factor;

    ctx.save();
    ctx.beginPath();
    ctx.arc(FRAME_CX, FRAME_CY, FRAME_R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(uploadedImgRef.current, dx, dy, dw, dh);
    ctx.restore();

    ctx.drawImage(frameImgRef.current, 0, 0, FRAME_SIZE, FRAME_SIZE);
  }

  async function composeCard(titleForCard) {
    await ensureFontsReady();
    const canvas = finalCanvasRef.current;
    canvas.width = CARD_W; canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    ctx.drawImage(cardImgRef.current, 0, 0, CARD_W, CARD_H);

    // photo — circular slot, mapped from the shared 300px positioner stage
    const factor = (CARD_R * 2) / STAGE;
    const { w, h } = currentDrawSize();
    const dx = (CARD_CX - CARD_R) + panRef.current.x * factor;
    const dy = (CARD_CY - CARD_R) + panRef.current.y * factor;
    const dw = w * factor, dh = h * factor;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CARD_CX, CARD_CY, CARD_R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(uploadedImgRef.current, dx, dy, dw, dh);
    ctx.restore();

    // panel content — name / role / title, laid out inside the template's pre-drawn dark green panel
    const panelCx = (PANEL_X0 + PANEL_X1) / 2;
    const maxTextWidth = (PANEL_X1 - PANEL_X0) - 52;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const displayName = name.trim() || 'Builder';
    const nameY = PANEL_Y0 + 56;
    let nameSize = 32;
    do {
      ctx.font = `800 ${nameSize}px 'Baloo 2'`;
      if (ctx.measureText(displayName).width <= maxTextWidth || nameSize <= 18) break;
      nameSize -= 2;
    } while (true);
    ctx.fillStyle = '#eecb2b';
    ctx.fillText(displayName, panelCx, nameY);

    ctx.fillStyle = '#f4f2ea';
    ctx.font = "500 15px 'Poppins'";
    ctx.fillText(role.trim() || 'Builder at HH Goa', panelCx, nameY + 30);

    const label = titleForCard || currentTitle;
    if (label) {
      ctx.font = "700 16px 'Baloo 2'";
      const textW = ctx.measureText(label).width;
      const boltW = 14;
      const pillW = Math.min(textW + boltW + 50, maxTextWidth + 20), pillH = 40;
      const pillX = panelCx - pillW / 2, pillY = nameY + 46;
      ctx.fillStyle = '#eecb2b';
      ctx.strokeStyle = '#134e2e';
      ctx.lineWidth = 2;
      roundRectPath(ctx, pillX, pillY, pillW, pillH, 20);
      ctx.fill();
      ctx.stroke();

      const bx = pillX + 22, by = pillY + pillH / 2;
      ctx.fillStyle = '#134e2e';
      ctx.beginPath();
      ctx.moveTo(bx + 3, by - 9);
      ctx.lineTo(bx - 5, by + 2);
      ctx.lineTo(bx, by + 2);
      ctx.lineTo(bx - 3, by + 9);
      ctx.lineTo(bx + 6, by - 2);
      ctx.lineTo(bx + 1, by - 2);
      ctx.closePath();
      ctx.fill();

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx + 14, by + 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
    }

    ctx.fillStyle = 'rgba(244,242,234,0.7)';
    ctx.font = "500 13px 'Poppins'";
    ctx.fillText('#FrameInGoa', panelCx, PANEL_Y1 - 16);
  }

  async function composeAndShow(titleForCard) {
    if (format === 'A') composeFrame();
    else await composeCard(titleForCard);
  }

  function resetToUpload() {
    uploadedImgRef.current = null;
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadStatus('');
    setCurrentTitle('');
    setShareHint('');
    setStep('upload');
  }

  function setFormat(f) {
    if (f === format) return;
    resetToUpload();
    setFormatState(f);
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus('Processing photo…');
    try {
      let blob = file;
      const isHeic = /heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
      if (isHeic) {
        const heic2any = (await import('heic2any')).default;
        blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      }
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        uploadedImgRef.current = img;
        setUploadStatus('');
        setStep('position');
        requestAnimationFrame(setupPositioner);
      };
      img.onerror = () => setUploadStatus('Could not read that photo — try another.');
      img.src = url;
    } catch (err) {
      console.error(err);
      setUploadStatus("That photo format didn't work — try a JPG or PNG.");
    }
  }

  async function handleGenerate() {
    let title = '';
    if (format === 'B') {
      title = generateTitle(role, currentTitle);
      setCurrentTitle(title);
    }
    await composeAndShow(title);
    setStep('result');
  }

  async function handleReroll() {
    const title = generateTitle(role, currentTitle);
    setCurrentTitle(title);
    await composeAndShow(title);
  }

  function canvasToBlob() {
    return new Promise((resolve) => finalCanvasRef.current.toBlob(resolve, 'image/png', 0.95));
  }

  async function downloadCanvasImage() {
    const blob = await canvasToBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'A' ? 'hhgoa-frame.png' : 'hhgoa-builder-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function handleDownload() {
    await downloadCanvasImage();
  }

  async function handleSetProfilePhoto() {
    setSharing(true);
    setShareHint('');
    try {
      await downloadCanvasImage();
      // x.com/settings/profile deep-links straight into the X app on mobile if installed,
      // landing right on the screen where tapping the avatar lets them pick the file we just saved.
      setTimeout(() => {
        window.open('https://x.com/settings/profile', '_blank');
      }, 300);
      setShareHint('Image saved — tap your profile photo on the X page that just opened to upload it.');
    } catch (err) {
      console.error(err);
      setShareHint("Couldn't open X — try Download instead and update your profile photo manually in the app.");
    } finally {
      setSharing(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    setShareHint('');
    const caption = "Builder card, straight from Hacker House 'Goa' #FrameInGoa";

    try {
      await downloadCanvasImage();
      setTimeout(() => {
        window.open(`https://x.com/compose/post?text=${encodeURIComponent(caption)}`, '_blank');
      }, 300);
      setShareHint('Image saved — attach it in the post that just opened.');
    } catch (err) {
      console.error(err);
      setShareHint("Couldn't open X — try Download instead and post it manually.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <h1>Hacker House &apos;गोवा&apos;</h1>
        <p>HH Goa 2026 — frame &amp; builder card generator</p>
        <svg className="wave" viewBox="0 0 460 16" preserveAspectRatio="none">
          <path d="M0 8 Q 20 0, 40 8 T 80 8 T 120 8 T 160 8 T 200 8 T 240 8 T 280 8 T 320 8 T 360 8 T 400 8 T 440 8 T 480 8 V16 H0 Z" fill="#f4f2ea" />
          <path d="M0 8 Q 20 0, 40 8 T 80 8 T 120 8 T 160 8 T 200 8 T 240 8 T 280 8 T 320 8 T 360 8 T 400 8 T 440 8 T 480 8" fill="none" stroke="#eecb2b" strokeWidth="2.5" />
        </svg>
      </header>

      {assetError && (
        <p className="hint" style={{ background: '#fdecea', color: '#c0392b', padding: '10px 20px', margin: 0, fontWeight: 600 }}>
          Couldn&apos;t load the template graphics — try refreshing the page.
        </p>
      )}

      <div className="tabs">
        <button className={`tab ${format === 'A' ? 'active' : ''}`} onClick={() => setFormat('A')}>PFP frame</button>
        <button className={`tab ${format === 'B' ? 'active' : ''}`} onClick={() => setFormat('B')}>Builder ID card</button>
      </div>

      {/* STEP 1: upload + fields */}
      <div className={`step ${step !== 'upload' ? 'hidden' : ''}`}>
        <div className="panel">
          <div className={`panel-visual ${previewBroken ? 'hidden' : ''}`} id="uploadVisual">
            <div className="template-preview">
              <img
                src={format === 'A' ? '/frame.png' : '/card.png'}
                alt="Template preview"
                onLoad={() => setPreviewBroken(false)}
                onError={() => setPreviewBroken(true)}
              />
            </div>
            <p className="hint">What you&apos;re making</p>
          </div>
          <div className="panel-controls">
            {format === 'B' && (
              <>
                <div className="field">
                  <label>Your name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nandan Shirur" maxLength={28} />
                </div>
                <div className="field">
                  <label>Stack / role</label>
                  <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Full-stack + embedded" maxLength={34} />
                </div>
              </>
            )}
            <div className="upload-box" onClick={() => fileInputRef.current.click()}>
              <div className="icon-badge"><i className="ti ti-photo-plus" /></div>
              <p>{format === 'A' ? 'Tap to upload your photo' : 'Tap to upload your photo for the badge'}</p>
              <p className="sub">JPG, PNG or iPhone HEIC</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} />
            <p className="hint">{uploadStatus}</p>
          </div>
        </div>
      </div>

      {/* STEP 2: position photo */}
      <div className={`step ${step !== 'position' ? 'hidden' : ''}`}>
        <div className="panel">
          <div className="panel-visual position-wrap">
            <div
              className="position-stage"
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <canvas ref={posCanvasRef} width={300} height={300} />
              <div className="guide-circle" />
              <div className="guide-crosshair" />
            </div>
            <div className="zoom-row">
              <i className="ti ti-zoom-in" />
              <input type="range" min={100} max={300} defaultValue={100} onChange={onZoomChange} />
            </div>
            <p className="hint">Drag to reposition · slide to zoom</p>
          </div>
          <div className="panel-controls">
            <button className="btn btn-primary" onClick={handleGenerate}><i className="ti ti-sparkles" /> Generate</button>
            <button className="btn btn-ghost" onClick={resetToUpload}>Back</button>
          </div>
        </div>
      </div>

      {/* STEP 3: result */}
      <div className={`step ${step !== 'result' ? 'hidden' : ''}`}>
        <div className="panel">
          <div className="panel-visual result-wrap">
            <canvas ref={finalCanvasRef} />
            {format === 'B' && currentTitle && (
              <div className="title-row">
                <div className="title-pill"><i className="ti ti-bolt" /> {currentTitle}</div>
                <button className="icon-btn" onClick={handleReroll} title="Generate another title"><i className="ti ti-dice-5" /></button>
              </div>
            )}
          </div>
          <div className="panel-controls">
            <button className="btn btn-accent" onClick={handleDownload}><i className="ti ti-download" /> Download image</button>
            {format === 'A' ? (
              <button className="btn btn-primary" onClick={handleSetProfilePhoto} disabled={sharing}>
                {sharing ? <span className="spinner" /> : <i className="ti ti-user-circle" />} Set as X profile photo
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleShare} disabled={sharing}>
                {sharing ? <span className="spinner" /> : <i className="ti ti-brand-x" />} Post to X
              </button>
            )}
            <button className="btn btn-ghost" onClick={resetToUpload}>Start over</button>
            <p className="hint">{shareHint}</p>
          </div>
        </div>
      </div>

      <div className="footer-note">Built for #FrameInGoa · no signup, nothing stored beyond the image you share</div>
    </div>
  );
}
