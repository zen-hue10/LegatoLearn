/* ═══════════════════════════════════════════════════════════════════
   PLANNER LOGIC  —  synced with Dashboard reflections
   ═══════════════════════════════════════════════════════════════════ */

const PLANNER_DATA = {
  warmup:     { name: 'Warm-up & Fundamentals',   icon: '🔥', weight: 0.15, tip: 'Start slow. Quality over speed in warm-ups.', prompt: 'Long tones → Scales → Articulation patterns' },
  technique:  { name: 'Technical Passages',       icon: '🎯', weight: 0.25, tip: 'Use the metronome. Increase by 4 BPM only when clean.', prompt: 'Isolate 2 bars → Slow metronome → Gradual build' },
  expression: { name: 'Expression & Phrasing',      icon: '🎭', weight: 0.20, tip: 'Sing the phrase first, then play it.', prompt: 'Mark phrases → Sing → Play with intent' },
  repertoire: { name: 'Repertoire Run-through',     icon: '🎼', weight: 0.25, tip: "Mark spots that break down — those become tomorrow's technique work.", prompt: 'Run full piece → Note breakdown spots → Isolate' },
  listening:  { name: 'Listening & Blending',       icon: '👂', weight: 0.20, tip: 'Record yourself playing with a reference track.', prompt: 'Play with recording → Match tone → Blend check' },
  recording:  { name: 'Record & Reflect',           icon: '🎙️', weight: 0.15, tip: 'Listen back once. Note one thing to fix, one thing that worked.', prompt: 'One take → Listen back → Journal reflection' }
};

let plannerDuration = 45;
let plannerSelected = new Set(['warmup', 'technique', 'expression']);
let plannerPlan = [];
let plannerCurrentItem = 0;
let plannerTimerInterval = null;
let plannerElapsed = 0;

function plannerGoToStep(stepId) {
  document.querySelectorAll('.planner-step').forEach(s => s.classList.remove('active'));
  document.getElementById('planner-step-' + stepId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function plannerSelectDuration(min, btn) {
  plannerDuration = min;
  document.querySelectorAll('.planner-duration-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function plannerToggleOption(card) {
  const id = card.dataset.id;
  if (plannerSelected.has(id)) {
    plannerSelected.delete(id);
    card.classList.remove('selected');
  } else {
    plannerSelected.add(id);
    card.classList.add('selected');
  }
}

function plannerGeneratePlan() {
  if (plannerSelected.size === 0) {
    showToast('Select at least one focus area.');
    return;
  }

  const items = Array.from(plannerSelected);
  const totalWeight = items.reduce((sum, id) => sum + PLANNER_DATA[id].weight, 0);

  plannerPlan = items.map(id => {
    const data = PLANNER_DATA[id];
    const mins = Math.round((data.weight / totalWeight) * plannerDuration);
    return { id, ...data, minutes: Math.max(5, mins) };
  });

  const currentTotal = plannerPlan.reduce((sum, p) => sum + p.minutes, 0);
  if (currentTotal !== plannerDuration && plannerPlan.length > 0) {
    plannerPlan[0].minutes += (plannerDuration - currentTotal);
  }

  document.getElementById('planner-summary').textContent =
    plannerDuration + ' minutes · ' + plannerPlan.length + ' focus area' + (plannerPlan.length > 1 ? 's' : '');

  const container = document.getElementById('planner-plan-items');
  container.innerHTML = plannerPlan.map(p => `
    <div class="planner-plan-item">
      <div class="planner-plan-time">${p.minutes}m</div>
      <div class="planner-plan-content">
        <div class="planner-plan-name">${p.icon} ${p.name}</div>
        <div class="planner-plan-prompt">${p.prompt}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('planner-pro-tip-text').textContent = plannerPlan[0].tip;
  document.getElementById('planner-progress-fill').style.width = '0%';
  document.getElementById('planner-progress-pct').textContent = '0%';

  plannerGoToStep('plan');
}

function plannerStartSession() {
  plannerCurrentItem = 0;
  plannerElapsed = 0;
  plannerRenderSessionItems();
  plannerUpdateSessionDisplay();
  plannerStartTimer();
  plannerGoToStep('session');
}

function plannerStartTimer() {
  if (plannerTimerInterval) clearInterval(plannerTimerInterval);
  plannerTimerInterval = setInterval(() => {
    plannerElapsed++;
    const m = Math.floor(plannerElapsed / 60).toString().padStart(2, '0');
    const s = (plannerElapsed % 60).toString().padStart(2, '0');
    document.getElementById('planner-session-timer').textContent = m + ':' + s;
  }, 1000);
}

function plannerRenderSessionItems() {
  const container = document.getElementById('planner-session-items');
  container.innerHTML = plannerPlan.map((p, i) => `
    <div class="planner-session-item ${i === plannerCurrentItem ? 'active' : ''} ${i < plannerCurrentItem ? 'completed' : ''}">
      <div class="planner-session-time">${p.minutes}m</div>
      <div class="planner-session-content">
        <div class="planner-session-name">${p.icon} ${p.name}</div>
        <div class="planner-session-prompt">${p.prompt}</div>
      </div>
      ${i < plannerCurrentItem ? '<div class="planner-session-check">✓</div>' : ''}
    </div>
  `).join('');
}

function plannerUpdateSessionDisplay() {
  if (plannerCurrentItem >= plannerPlan.length) return;
  const current = plannerPlan[plannerCurrentItem];
  document.getElementById('planner-session-current').textContent = current.name;

  const pct = Math.round((plannerCurrentItem / plannerPlan.length) * 100);
  document.getElementById('planner-session-progress').style.width = pct + '%';
  document.getElementById('planner-session-pct').textContent = pct + '%';
}

function plannerNextItem() {
  plannerCurrentItem++;
  plannerElapsed = 0;

  if (plannerCurrentItem >= plannerPlan.length) {
    clearInterval(plannerTimerInterval);
    document.getElementById('planner-session-timer').textContent = 'Done!';
    document.getElementById('planner-session-current').textContent = 'Great session! 🎉';
    document.getElementById('planner-session-next-btn').textContent = 'Finish →';
    document.getElementById('planner-session-next-btn').onclick = plannerFinishSession;
    plannerRenderSessionItems();
    return;
  }

  plannerRenderSessionItems();
  plannerUpdateSessionDisplay();
}

function plannerEndSession() {
  clearInterval(plannerTimerInterval);
  if (confirm('End this session? Your progress will not be saved.')) {
    plannerGoToStep('plan');
    plannerResetState();
  } else {
    plannerStartTimer();
  }
}

function plannerFinishSession() {
  clearInterval(plannerTimerInterval);
  plannerSaveSessionToHistory();
  plannerShowReflection();
}

function plannerShowReflection() {
  document.getElementById('planner-stat-duration').textContent = plannerDuration + ' min';
  document.getElementById('planner-stat-areas').textContent = plannerPlan.length;
  document.getElementById('planner-stat-streak').textContent = calculateStreak();

  document.getElementById('planner-reflection-clicked').value = '';
  document.getElementById('planner-reflection-didnt').value = '';
  document.getElementById('planner-reflection-carry').value = '';

  plannerGoToStep('reflection');
}

function plannerSkipReflection() {
  plannerGoToStep('duration');
  plannerResetState();
}

/* ════════ KEY CHANGE: Save to SAME key as Dashboard ════════ */
function plannerSaveReflection() {
  const text = [
    document.getElementById('planner-reflection-clicked').value,
    document.getElementById('planner-reflection-didnt').value,
    document.getElementById('planner-reflection-carry').value
  ].filter(Boolean).join('\n\n');

  const fullText = [
    document.getElementById('planner-reflection-clicked').value,
    document.getElementById('planner-reflection-didnt').value,
    document.getElementById('planner-reflection-carry').value
  ].map((t, i) => {
    const labels = ['What clicked', 'What didn\'t', 'Carry forward'];
    return t ? labels[i] + ': ' + t : '';
  }).filter(Boolean).join('\n\n');

  if (!fullText.trim()) {
    showToast('Reflection saved!');
    plannerGoToStep('duration');
    plannerResetState();
    return;
  }

  // Save to SAME key as dashboard — instant sync
  const reflections = storageGet('reflections', []);
  reflections.unshift({
    id: 'r_' + Date.now(),
    date: dateKey(0),
    text: fullText
  });
  storageSet('reflections', reflections);

  // Log practice time for streak
  logPracticeSession(plannerDuration * 60);

  showToast('Reflection saved to Dashboard!');
  plannerGoToStep('duration');
  plannerResetState();
  plannerLoadHistory();
  updateNavBadge();
}

function plannerResetState() {
  plannerCurrentItem = 0;
  plannerElapsed = 0;
  document.getElementById('planner-session-timer').textContent = '00:00';
  document.getElementById('planner-session-next-btn').textContent = 'Next →';
  document.getElementById('planner-session-next-btn').onclick = plannerNextItem;
}

/* ════════ History ════════ */
function plannerSaveSessionToHistory() {
  const session = {
    date: new Date().toISOString(),
    duration: plannerDuration,
    plan: plannerPlan.map(p => ({ id: p.id, name: p.name, minutes: p.minutes })),
    focusAreas: plannerPlan.map(p => p.id)
  };
  const history = storageGet('plannerSessions', []);
  history.unshift(session);
  storageSet('plannerSessions', history);
}

function plannerLoadHistory() {
  const history = storageGet('plannerSessions', []);
  const container = document.getElementById('planner-history-list');
  if (history.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;text-align:center;padding:2rem;">No sessions yet. Start your first practice above.</p>';
    return;
  }
  container.innerHTML = history.slice(0, 10).map(session => {
    const date = new Date(session.date);
    const dateStr = date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
    const focusNames = session.plan.map(p => PLANNER_DATA[p.id] ? PLANNER_DATA[p.id].icon : '').join(' ');
    return `
      <div class="planner-history-item">
        <div class="planner-history-date">${dateStr}</div>
        <div class="planner-history-focus">${focusNames} ${session.plan.map(p => p.name).join(', ')}</div>
        <div class="planner-history-duration">${session.duration} min</div>
      </div>
    `;
  }).join('');
}
