from pathlib import Path
import hashlib
expected=[
'361af0481e55e64879c488eb55aadc8c16c4d74b4b00486f6c3a2bd84fa850fc',
'acb179c230dd02b1d4fbf1ca87ebb56ef01fbc4fb9e4a7664d528b1234ae8fff',
'8c4d61f0b94e9de0637c8389346bd9f474e8683ceecd87185333bd5b40b88c99',
'01dad7ab1c27a98ac50d6f3704dce8c889e6332f081501bb4c917751710504f9',
'e1deb4cbdd68226aed89808411a7f84cc233f97c3a0e606a83a447612afd5891',
'2eca49279fd995be1e5fbeadbf9858c4c32aff50c5dddd2da5c89a793ebfaba7',
]
parts=sorted(Path('scripts').glob('frame-v661-part*.b64'))
failed=False
for i,(p,e) in enumerate(zip(parts,expected),1):
    a=hashlib.sha256(p.read_bytes()).hexdigest()
    ok=a==e
    print(f'part{i:02d} bytes={p.stat().st_size} sha={a} expected={e} ok={ok}')
    failed|=not ok
if len(parts)!=6: print('wrong part count',len(parts));failed=True
raise SystemExit(1 if failed else 0)
