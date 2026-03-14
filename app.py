from flask import Flask, send_from_directory
import os
import sys

# Ensure logs appear immediately in Hugging Face console
print("--- STARTING AUTOFEED AI SERVER ---", flush=True)
print(f"WORKING DIR: {os.getcwd()}", flush=True)
print(f"FILES LIST: {os.listdir('.')}", flush=True)

app = Flask(__name__, static_url_path='', static_folder='.')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Log every request to help debug 404s
    print(f"DEBUG: Received request for path: '{path}'", flush=True)
    
    if path == "" or path == "/":
        path = "index.html"
    
    # Direct check before serving
    if os.path.exists(path):
        return send_from_directory('.', path)
    
    # If path isn't a file, maybe it's a sub-route (like /dashboard). 
    # Serve index.html and let JS handle routing.
    print(f"WARNING: '{path}' not found, falling back to index.html", flush=True)
    return send_from_directory('.', 'index.html')

if __name__ == "__main__":
    # Standard HF port
    app.run(host="0.0.0.0", port=7860)
