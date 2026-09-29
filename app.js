'use strict';
(() => {
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => typeof n === 'number' && Number.isFinite(n) ? n.toFixed(3) : '—';
const DATA = window.AIM_DATA;
if (!DATA) { $('round-content').textContent = 'Evidence data could not be loaded. Check that data/evidence.js is present.'; return; }
let task = 'data_select_ifeval', runNumber = 2, iteration = 3, cluster = null;
const currentRun = () => DATA.runs[`${task}-r${runNumber}`];
const accepted = r => r && r.success === true && !(r.audit_flags || []).some(f => f !== 'idea_mismatch') && typeof r.score === 'number';
function best(rows) { const scores = rows.filter(accepted).map(r => r.score); return scores.length ? Math.max(...scores) : null; }
function options() {
 $('task').innerHTML = DATA.tasks.map(t => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join(''); $('task').value = task;
 $('run').innerHTML = DATA.tasks.find(t => t.id === task).runs.map(r => `<option value="${r.number}">Run ${r.number}</option>`).join(''); $('run').value = runNumber;
}
function updateURL() {
 const hash = `#explorer?task=${task}&run=${runNumber}&iteration=${iteration}`;
 try { history.replaceState(null, '', hash); } catch (_) { /* Local file browsing may disallow history updates. */ }
}
function render() {
 const run = currentRun(); let round = run.rounds.find(r => r.iteration === iteration);
 if (!round) { round = run.rounds[0]; iteration = round.iteration; }
 $('rounds').innerHTML = run.rounds.map(r => `<button type="button" aria-label="Iteration ${r.iteration}" aria-pressed="${r.iteration === iteration}" data-round="${r.iteration}">${r.iteration}</button>`).join('');
 $('rounds').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { iteration = Number(b.dataset.round); cluster = null; render(); updateURL(); }));
 const clusters = round.organization.clusters || [];
 const ranks = new Map((round.ranking.cluster_ranks || []).map(r => [r.cluster_idx, r.rank]));
 const ordered = clusters.map((c,i) => ({...c,index:i})).sort((a,b) => (ranks.get(a.index) ?? 999) - (ranks.get(b.index) ?? 999));
 if (cluster === null || !clusters[cluster]) cluster = ordered[0]?.index ?? 0;
 const prior = run.history.filter(r => r.iteration < iteration);
 const soFar = best(run.history.filter(r => r.iteration <= iteration));
 const count = clusters.reduce((n,c) => n + (c.idea_ids || []).length, 0);
 const selected = clusters[cluster] || {};
 const ideaRanks = round.ideaRanks[String(cluster)] || {};
 const titleMap = new Map(run.pool.map(p => [p.id,p.title]));
 // Current branch proposals take precedence over final-pool titles in this round.
 round.branches.forEach(b => { if (b.selection && b.proposed.Title) titleMap.set(b.selection.idea_id,b.proposed.Title); });
 const cbuttons = ordered.map(c => {
  const rows = prior.filter(r => (c.idea_ids || []).includes(r.idea_id));
  return `<button class="cluster-button" data-cluster="${c.index}" aria-pressed="${c.index===cluster}" type="button"><span class="rank-num">${esc(ranks.get(c.index) ?? '—')}</span><span><strong>${esc(c.label)}</strong><small>Cluster ${c.index} · ${(c.idea_ids || []).length} ideas · ${rows.filter(accepted).length} prior eligible results</small></span><span class="cluster-score"><b>${fmt(best(rows))}</b><small>prior best</small></span></button>`;
 }).join('');
 $('round-content').innerHTML = `
 ${!run.historyAvailable ? '<p class="notice">Score summaries are unavailable for this run.</p>' : ''}
 <div class="round-top"><div><h3>${esc(DATA.tasks.find(t=>t.id===task).label)} <span style="color:var(--muted)">/ Iteration ${iteration}</span></h3><p>${count} clustered ideas · ${clusters.length} research directions · ${round.branches.length} dispatched branches</p></div><div class="round-stat"><strong>${fmt(soFar)}</strong>eligible best through this round</div></div>
 <div class="stage-title"><span class="step">1</span><h4>Surrogate: organize & estimate</h4><small>Select a cluster to inspect its ideas ↓</small></div>
 <div class="map-grid"><div class="cluster-list">${cbuttons || '<p>No organization record available.</p>'}</div><div class="rationale-box"><h5>Why this ranking?</h5><p>${esc(round.ranking.rationale || 'No ranking rationale recorded.')}</p>${round.ranking.fallback ? '<p class="record-note">The record marks this ranking as a fallback.</p>' : ''}</div></div>
 <details class="idea-detail"><summary>Inside cluster ${cluster}: ${esc(selected.label || 'unavailable')} · inspect idea ranks</summary><p>${esc(selected.theme || selected.rationale || '')}</p><p>${esc(ideaRanks.rationale || 'No idea-ranking rationale recorded.')}</p>${(ideaRanks.idea_ranks || []).map(r=>`<div class="idea-rank-row"><b>Rank ${esc(r.rank)}</b><span>${esc(titleMap.get(r.idea_id) || r.idea_id)}</span></div>`).join('') || '<p>No idea ranking available.</p>'}<p>Titles use the selected proposal where available, otherwise the final idea pool.</p></details>
 <div class="stage-title"><span class="step">2</span><h4>Acquisition: dispatch & observe</h4><small>Two levels of explore / exploit</small></div><p class="decision-summary">${esc(round.allocation.rationale_summary || 'No dispatch summary recorded.')}</p>
 <div class="branch-grid">${round.branches.map(b => branchCard(b,round)).join('')}</div>
 
`;
 $('round-content').querySelectorAll('[data-cluster]').forEach(b=>b.addEventListener('click',()=>{cluster=Number(b.dataset.cluster);render(); const detail=document.querySelector('.idea-detail');detail.open=true;const active=document.querySelector(`.cluster-button[data-cluster="${cluster}"]`);active?.focus({preventScroll:true});}));
}
function branchCard(b,round) {
 const s=b.selection, r=b.result, audit=b.audit;
 const ranking=s ? (round.ideaRanks[String(s.cluster_idx)]?.idea_ranks || []) : [];
 const rank=ranking.find(x=>x.idea_id===s?.idea_id)?.rank;
 const proposed=b.proposed.Title || r?.idea || s?.idea_id || 'Proposal unavailable';
 const reconstruction = audit?.reconstructed_idea;
 const reconstructedTitle = reconstruction?.title || reconstruction?.Title || '';
 const reconstructedHypothesis = reconstruction?.short_hypothesis || reconstruction?.['Short Hypothesis'] || '';
 const hasReconstruction = Boolean(reconstructedTitle || reconstructedHypothesis);
 const auditLabel = !audit ? 'Audit unavailable' : (audit.flags || []).includes('idea_mismatch') ? (hasReconstruction ? 'Idea mismatch → reconstructed' : 'Idea mismatch → reconstruction unavailable') : (audit.flags || []).length ? `Flagged: ${audit.flags.join(', ')}` : audit.legit ? 'Audit: no flags recorded' : 'Audit: not legitimate';
 return `<article class="branch"><div class="branch-head"><span>BRANCH ${b.branch}${s ? ` · CLUSTER ${s.cluster_idx}` : ''}</span><span>${rank != null ? `IDEA RANK ${rank}/${ranking.length}` : 'RANK UNAVAILABLE'}</span></div><div class="chips">${s ? `<span class="chip ${esc(s.cluster_action)}">Cluster · ${esc(s.cluster_action)}</span><span class="chip ${esc(s.idea_action)}">Idea · ${esc(s.idea_action)}</span>` : '<span class="chip">Selection action unavailable</span>'}</div><h5>${esc(proposed)}</h5><p class="why">${esc(s?.rationale || b.proposed['Short Hypothesis'] || 'No selection rationale recorded.')}</p><div class="branch-score"><span>Recorded score<br>${r ? (accepted(r) ? 'Eligible in replay' : 'Excluded from replay best') : 'History unavailable'}</span><strong>${fmt(r?.score)}</strong></div>${r && !accepted(r) ? `<div class="record-note">${r.success ? 'Audit flags: '+esc((r.audit_flags || []).join(', ')) : 'Evaluation unsuccessful'}; the recorded value is shown for transparency.</div>` : ''}${(audit?.flags || []).includes('idea_mismatch') ? `<details class="audit flag"><summary>${esc(auditLabel)}</summary><p>${esc(audit?.reasoning || 'No audit explanation recorded.')}</p>${hasReconstruction ? `<div class="reconstructed"><b>Reconstructed idea</b>${reconstructedTitle ? `<p>${esc(reconstructedTitle)}</p>` : ''}${reconstructedHypothesis ? `<p>${esc(reconstructedHypothesis)}</p>` : ''}</div>` : '<p>No reconstructed idea was recorded in this audit artifact.</p>'}${r?.idea && r.idea!==proposed ? `<p><b>Audited idea:</b> ${esc(r.idea)}</p>` : ''}</details>` : `<div class="audit ${(audit?.flags || []).length ? 'flag' : ''}"><strong>${esc(auditLabel)}</strong></div>`}</article>`;
}
$('task').addEventListener('change',()=>{task=$('task').value;runNumber=1;iteration=1;cluster=null;options();render();updateURL();});
$('run').addEventListener('change',()=>{runNumber=Number($('run').value);iteration=1;cluster=null;render();updateURL();});
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>{const parts=b.dataset.case.split(',');task=parts[0];runNumber=Number(parts[1]);iteration=Number(parts[2]);cluster=null;options();render();updateURL();document.querySelector('.explorer-shell').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
function readHash(){if(!location.hash.startsWith('#explorer?'))return;const q=new URLSearchParams(location.hash.split('?')[1]);const t=q.get('task'),r=Number(q.get('run')),i=Number(q.get('iteration'));if(DATA.runs[`${t}-r${r}`]){task=t;runNumber=r;iteration=i;cluster=null;}}
readHash();options();render();window.addEventListener('hashchange',()=>{readHash();options();render();});
const results=[['Flash Attention','86.2 ± 3.1','90.5 ± 0.8','+4.3'],['Radix Sort','68.7 ± 1.6','69.5 ± 2.3','+0.8'],['FFT Rust','55.9 ± 0.4','56.5 ± 0.5','+0.6'],['AES-128 CTR','65.3 ± 0.2','66.4 ± 0.4','+1.1'],['Z-order Range Scan','50.9 ± 1.2','52.1 ± 1.1','+1.2'],['Moving MNIST World Model','57.3 ± 6.3','61.5 ± 0.9','+4.2'],['Data Selection IFEval','45.1 ± 1.1','61.8 ± 3.2','+16.7'],['Huffman Decode','43.0 ± 2.6','43.4 ± 1.3','+0.4'],['NTT Butterfly','56.9 ± 1.3','59.0 ± 1.3','+2.1'],['ICP Correspondence','52.1 ± 1.0','53.5 ± 0.5','+1.4']];
$('results-body').innerHTML=results.map(r=>`<tr><th scope="row">${r[0]}</th>${r.slice(1).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');
const timingTasks = [
 ['flash_attention','Flash Attention'],['radix_sort','Radix Sort'],['fft_rust','FFT Rust'],['aes128_ctr','AES-128 CTR'],['z_order_range_scan','Z-order Range Scan'],['moving_mnist_world_model','Moving MNIST World Model'],['data_select_ifeval','Data Selection IFEval'],['huffman_canonical_decode_cuda','Huffman Decode'],['ntt_butterfly_cuda','NTT Butterfly'],['icp_correspondence_step_cuda','ICP Correspondence']
];
$('time-task').innerHTML=timingTasks.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
function renderTiming(){const [id,label]=timingTasks.find(([id])=>id===$('time-task').value)||timingTasks[0];$('time-image').src=`assets/${id}_combined.png`;$('time-image').alt=`${label}: mean best-so-far score versus wall-clock time, alongside final scores and their attainment times.`;$('time-pdf').href=`assets/${id}_combined.pdf`;$('time-caption').textContent=`${label} · Mean best-so-far score (%) versus wall-clock time (hours).`;}
$('time-task').addEventListener('change',renderTiming);renderTiming();
})();
