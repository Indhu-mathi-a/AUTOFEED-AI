from flask import Flask, send_from_directory
import os

print("--- Environment Debug ---")
print(f"Current Dir: {os.getcwd()}")
print(f"Files found: {os.listdir('.')}")

app = Flask(__name__, static_url_path='', static_folder='.')

@app.route("/")
def home():
    if os.path.exists("index.html"):
        return send_from_directory('.', 'index.html')
    return "Error: index.html not found", 404

@app.errorhandler(404)
def not_found(e):
    return send_from_directory('.', 'index.html') # Try to serve index as fallback

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)
