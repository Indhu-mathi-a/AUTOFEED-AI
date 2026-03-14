from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Route to serve the main index.html
@app.route("/")
def home():
    return send_from_directory('.', 'index.html')

# Route to serve all other static files (css, js, images, etc.)
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == "__main__":
    print("AutoFeed AI is running 🚀")
    app.run(host="0.0.0.0", port=7860)
