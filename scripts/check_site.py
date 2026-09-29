#!/usr/bin/env python3
"""Check packaged evidence, local links, and the featured scientific examples."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.ids=set(); self.links=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:
   assert attrs['id'] not in self.ids, f'Duplicate id: {attrs["id"]}'
   self.ids.add(attrs['id'])
  for key in ['href','src']:
   if key in attrs:self.links.append(attrs[key])
p=Page();p.feed((ROOT/'index.html').read_text())
for link in p.links:
 parsed=urlsplit(link)
 if parsed.scheme or parsed.netloc: continue
 if parsed.path: assert (ROOT/unquote(parsed.path)).is_file(), f'Missing link: {link}'
 elif parsed.fragment: assert parsed.fragment in p.ids, f'Missing anchor: {link}'
bundle=json.loads((ROOT/'data/evidence.js').read_text().removeprefix('window.AIM_DATA = ').rstrip().removesuffix(';'))
tasks=bundle['tasks'];assert len(tasks)==9
runs=bundle['runs'];assert len(runs)==27
assert all(t['id']!='aes128_ctr' for t in tasks)
assert not list((ROOT/'data').glob('*.json'))
for t in tasks:
 assert len(t['runs'])==3
 for r in t['runs']:
  d=runs[r['id']]
  assert d['rounds']
  for it in d['rounds']:
   clusters=it['organization']['clusters']
   for b in it['branches']:
    s=b['selection']
    if s:
     assert 0<=s['cluster_idx']<len(clusters)
     assert s['idea_id'] in clusters[s['cluster_idx']]['idea_ids'], (d['id'],it['iteration'],s)
    if b['result']:assert b['result']['branch']==b['branch'] and b['result']['iteration']==it['iteration']
assert sum(len(r['rounds']) for r in runs.values())==171
r=runs['data_select_ifeval-r2']['rounds'][2]
assert [b['result']['score'] for b in r['branches']]==[.119,.377,.23]
assert r['branches'][0]['selection']['idea_action']=='exploit'
assert r['branches'][1]['selection']['idea_action']=='explore'
r=runs['data_select_ifeval-r1']['rounds'][2]
assert r['branches'][1]['result']['score']==.470
r=runs['data_select_ifeval-r1']['rounds'][0]['branches'][0]
assert 'idea_mismatch' in r['audit']['flags']
assert r['audit']['reconstructed_idea']['title']==r['result']['idea']
assert len(list((ROOT/'assets').glob('*_combined.png')))==10
for f in (ROOT/'assets').glob('*_combined.pdf'):assert f.with_suffix('.png').is_file()
assert 'download' not in (ROOT/'index.html').read_text().lower()
assert 'Source:' not in (ROOT/'app.js').read_text()
print('PASS: local links, 27 runs, 171 rounds, branch-cluster joins, ten timing figures, removed downloads, and featured examples.')
