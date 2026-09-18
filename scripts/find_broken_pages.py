import os, re

app_dir = os.path.join(os.getcwd(), 'src', 'app')
routes = []

for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file in ('page.tsx', 'page.js'):
            rel = os.path.relpath(os.path.join(root, file), app_dir).replace('\\', '/')
            rel = re.sub(r'/page\.(tsx|js)$', '', rel)
            if rel in ('page.tsx', 'page.js'):
                rel = ''
            routes.append('/' + rel)

print(f'Known routes ({len(routes)}):')

broken = []
src_dir = os.path.join(os.getcwd(), 'src')

for root, dirs, files in os.walk(src_dir):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.next' in dirs: dirs.remove('.next')
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            matches = re.findall(r'(?:href=[\"\']|router\.push\([\'\"])(/[^\"\'?#\s]+)[\"\']', content)
            for href in matches:
                if href.startswith('/api') or href == '/' or href.startswith('/assets') or href.startswith('/favicon') or href.startswith('/manifest'):
                    continue
                matched = False
                for r in routes:
                    if r == href:
                        matched = True
                        break
                    pattern = '^' + re.sub(r'\[\w+\]', '[^/]+', r) + '$'
                    if re.match(pattern, href):
                        matched = True
                        break
                if not matched:
                    broken.append((os.path.relpath(path, os.getcwd()), href))

print(f'Total broken link occurrences: {len(broken)}')
for f, h in sorted(set(broken)):
    print(f'  {f} -> {h}')
