import codecs
import re
import os

target_file = r'h:\HPE VME\Editor\HPE_VME_Editor.html'
with codecs.open(target_file, 'r', 'utf-8') as f:
    text = f.read()

# Make src directory
os.makedirs(r'h:\HPE VME\Editor\src', exist_ok=True)

# 1. Extract CSS
style_pattern = re.compile(r'<style>(.*?)</style>', re.DOTALL | re.IGNORECASE)
style_match = next(style_pattern.finditer(text))

css_content = style_match.group(1).strip()
with codecs.open(r'h:\HPE VME\Editor\src\style.css', 'w', 'utf-8') as f:
    f.write(css_content)

text = text[:style_match.start()] + '<link rel="stylesheet" href="src/style.css">' + text[style_match.end():]

# 2. Extract JS
script_pattern = re.compile(r'<script>(.*?)</script>', re.DOTALL | re.IGNORECASE)
script_match = next(script_pattern.finditer(text))

js_content = script_match.group(1).strip()
with codecs.open(r'h:\HPE VME\Editor\src\app.js', 'w', 'utf-8') as f:
    f.write(js_content)

text = text[:script_match.start()] + '<script src="src/app.js"></script>' + text[script_match.end():]

with codecs.open(target_file, 'w', 'utf-8') as f:
    f.write(text)

print("Split completed successfully.")
