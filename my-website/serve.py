#!/usr/bin/env python3
"""
Lightweight multi-threaded preview server for KTPM JAMstack Studio.
Serves Markdown files rendered through _layouts/default.html and static assets.
Usage: python3 serve.py [port]
"""

import http.server
import socketserver
import os
import re
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def parse_markdown(text):
    """Simple regex-based markdown to HTML parser without external dependencies."""
    if text.startswith('---'):
        parts = text.split('---', 2)
        if len(parts) >= 3:
            text = parts[2]
            
    lines = text.strip().split('\n')
    html_lines = []
    in_list = False
    in_code = False
    
    for line in lines:
        stripped = line.strip()
        
        if stripped.startswith('```'):
            if in_code:
                html_lines.append('</code></pre>')
                in_code = False
            else:
                html_lines.append('<pre><code>')
                in_code = True
            continue
            
        if in_code:
            html_lines.append(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            continue

        if stripped.startswith('### '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h3>{stripped[4:]}</h3>')
            continue
        elif stripped.startswith('## '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h2>{stripped[3:]}</h2>')
            continue
        elif stripped.startswith('# '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h1>{stripped[2:]}</h1>')
            continue
            
        if stripped.startswith('- ') or stripped.startswith('* '):
            if not in_list:
                html_lines.append('<ul>')
                in_list = True
            item_text = stripped[2:]
            item_text = format_inline(item_text)
            html_lines.append(f'<li>{item_text}</li>')
            continue
        else:
            if in_list:
                html_lines.append('</ul>')
                in_list = False
                
        if not stripped:
            continue
            
        p_text = format_inline(stripped)
        html_lines.append(f'<p>{p_text}</p>')
        
    if in_list:
        html_lines.append('</ul>')
    if in_code:
        html_lines.append('</code></pre>')
        
    return '\n'.join(html_lines)

def format_inline(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text

def parse_frontmatter(text):
    meta = {}
    if text.startswith('---'):
        parts = text.split('---', 2)
        if len(parts) >= 3:
            for line in parts[1].strip().split('\n'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    meta[key.strip()] = val.strip().strip('"\'')
    return meta

class JamstackHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        rel_path = path.lstrip('/')
        return os.path.join(BASE_DIR, rel_path)

    def do_GET(self):
        req_path = self.path.split('?', 1)[0].rstrip('/')
        if not req_path:
            req_path = '/'

        md_file = None
        if req_path == '/' or req_path == '/index.html':
            md_file = os.path.join(BASE_DIR, 'index.md')
        else:
            cand = os.path.join(BASE_DIR, req_path.lstrip('/') + '.md')
            if os.path.exists(cand):
                md_file = cand
            elif os.path.exists(os.path.join(BASE_DIR, req_path.lstrip('/'), 'index.md')):
                md_file = os.path.join(BASE_DIR, req_path.lstrip('/'), 'index.md')

        if md_file and os.path.exists(md_file):
            with open(md_file, 'r', encoding='utf-8') as f:
                md_content = f.read()

            meta = parse_frontmatter(md_content)
            rendered_body = parse_markdown(md_content)

            layout_file = os.path.join(BASE_DIR, '_layouts', 'default.html')
            if os.path.exists(layout_file):
                with open(layout_file, 'r', encoding='utf-8') as lf:
                    layout_template = lf.read()

                title = meta.get('title', 'KTPM — JAMstack Studio')
                page_path = os.path.basename(md_file)
                is_home = meta.get('is_home', '').lower() == 'true' or req_path in ('/', '/index.html')

                rendered_page = layout_template
                rendered_page = re.sub(r'\{\{\s*[\'"]([^\'"]+)[\'"]\s*\|\s*relative_url\s*\}\}', r'\1', rendered_page)
                rendered_page = rendered_page.replace('{{ page.title | default: "KTPM — JAMstack Studio" }}', title)
                rendered_page = rendered_page.replace('{{ site.description }}', 'Trang web kiến trúc JAMstack - Môn KTPM')
                rendered_page = rendered_page.replace('{{ page.path | default: "Markdown" }}', page_path)
                rendered_page = rendered_page.replace('{{ content }}', rendered_body)

                if is_home:
                    rendered_page = re.sub(r'\{%\s*if\s+page\.url.*?%\}(.*?)\{%\s*else\s*%\}.*?\{%\s*endif\s*%\}', r'\1', rendered_page, flags=re.DOTALL)
                else:
                    rendered_page = re.sub(r'\{%\s*if\s+page\.url.*?%\}.*?\{%\s*else\s*%\}(.*?)\{%\s*endif\s*%\}', r'\1', rendered_page, flags=re.DOTALL)

                rendered_page = re.sub(r'\{%.*?%\}', '', rendered_page)

                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(rendered_page.encode('utf-8'))))
                self.end_headers()
                self.wfile.write(rendered_page.encode('utf-8'))
                return

        return super().do_GET()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    with ThreadedHTTPServer(("", PORT), JamstackHandler) as httpd:
        print(f"🚀 JAMstack Studio Server đang chạy tại: http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐã dừng server.")
