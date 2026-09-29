#!/usr/bin/env python3
"""Export public-facing evidence from AIM run artifacts. No solver code is executed.
Usage: python scripts/extract_artifacts.py /path/to/FINAL-OUTPUTS
Requires PyYAML only for reading selected idea descriptions.
"""
import argparse, json, re
from pathlib import Path
import yaml
OUT = Path(__file__).resolve().parents[1]
NAMES = {'data_select_ifeval':'Data Selection · IFEval','fft_rust':'FFT · Rust','flash_attention':'Flash Attention','huffman_canonical_decode':'Huffman Decode','icp_correspondence_step':'ICP Correspondence','moving_mnist_world_model':'Moving MNIST','ntt_butterfly':'NTT Butterfly','radix_sort':'Radix Sort','z_order_range_scan':'Z-order Range Scan'}
def public_run(run):
 """Retain only the records used by the public replay, without archive metadata."""
 run={k:v for k,v in run.items() if k not in ['name','source','sources']}
 run['pool']=[{k:p[k] for k in ['id','title'] if k in p} for p in run['pool']]
 run['history']=[{k:r[k] for k in ['iteration','branch','idea_id','score','success','audit_flags'] if k in r} for r in run['history']]
 for r in run['rounds']:
  for k in ['actions','lessons','plan']:r.pop(k,None)
  r['allocation']={'rationale_summary':r['allocation'].get('rationale_summary','')}
  for b in r['branches']:b['proposed'].pop('Abstract',None)
 return run

def main():
 parser=argparse.ArgumentParser(); parser.add_argument('source',type=Path); args=parser.parse_args()
 tasks=[]; bundle_runs={}
 for task,label in NAMES.items():
  runs=[]
  for number,root in enumerate(sorted((args.source/task/'0_ours').glob('*agentic*')),1):
   def read(path, default=None):
    if not path.exists(): return default
    raw=path.read_bytes()
    if path.suffix=='.jsonl': return [json.loads(l) for l in raw.decode().splitlines() if l.strip()]
    if path.suffix=='.yaml': return yaml.safe_load(raw)
    return json.loads(raw)
   history=read(root/'overview/score_history.json',[])
   pool=read(root/'overview/idea_pool.json',[])
   lessons=read(root/'overview/lessons.jsonl',[])
   plans=read(root/'overview/allocation_plan_history.jsonl',[])
   rounds=[]
   for orgpath in sorted(root.glob('trajectory/*organize/organization.json')):
    it=int(re.match(r'i(\d+)',orgpath.parent.name)[1]); prefix=f'i{it:02d}'
    def one(pattern,default=None):
     paths=sorted(root.glob('trajectory/'+pattern)); return read(paths[0],default) if paths else default
    organization=read(orgpath,{})
    ranking=one(prefix+'*estimate/cluster_ranks.json',{})
    allocation=one(prefix+'*allocate/allocation.json',{})
    actions=one(prefix+'*allocate/allocation_stage_a.json',{})
    idea_ranks={}
    for f in sorted(root.glob('trajectory/'+prefix+'*estimate/idea_ranks_cluster_*/idea_ranks.json')):
     idea_ranks[f.parent.name.rsplit('_',1)[-1]]=read(f)
    branches=[]
    allocated={x['branch']:x for x in allocation.get('allocations',[])}
    results={x['branch']:x for x in history if x['iteration']==it}
    audit_ids={int(re.match(r'i\d+\.b(\d+)',f.parent.name)[1]) for f in root.glob('trajectory/'+prefix+'*audit/audit_result.json')}
    for b in sorted(set(allocated)|set(results)|audit_ids):
     bp=f'{prefix}.b{b}.'
     selected=one(bp+'04_meta_allocate_assign/selected_idea.yaml',{}) or {}
     idea=selected.get('idea',{}) or {}
     branches.append({'branch':b,'selection':allocated.get(b),'result':results.get(b),'audit':one(bp+'*audit/audit_result.json'), 'proposed':{k:idea[k] for k in ['Title','Short Hypothesis','Abstract'] if k in idea}})
    rounds.append({'iteration':it,'organization':organization,'ranking':ranking,'ideaRanks':idea_ranks,'allocation':allocation,'actions':actions,'branches':branches,'lessons':[x for x in lessons if x.get('iter')==it], 'plan':next((x for x in plans if x.get('after_iter')==it),None)})
   key=f'{task}-r{number}'
   run={'id':key,'number':number,'historyAvailable':bool(history),'history':history,'pool':pool,'rounds':rounds}
   bundle_runs[key]=public_run(run)
   runs.append({'id':key,'number':number,'iterations':len(rounds),'ideas':len(pool),'branches':sum(len(r['branches']) for r in rounds),'historyAvailable':bool(history)})
  tasks.append({'id':task,'label':label,'runs':runs})
 # JS wrapper also permits opening index.html directly without a web server.
 bundled={'tasks':tasks,'runs':bundle_runs}
 (OUT/'data/evidence.js').write_text('window.AIM_DATA = '+json.dumps(bundled,ensure_ascii=False,separators=(',',':'))+';\n')
 print(f'Exported {sum(len(t["runs"]) for t in tasks)} runs, {sum(len(r["rounds"]) for r in bundled["runs"].values())} iterations.')
if __name__=='__main__': main()
