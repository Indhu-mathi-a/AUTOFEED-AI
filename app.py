from flask import Flask, send_from_directory
import os

# Serve all files from the current directory as static files
app = Flask(__name__, static_url_path='', static_folder='.')

@app.route("/")
def home():
    if os.path.exists("index.html"):
        return send_from_directory('.', 'index.html')
    else:
        return "Critical Error: index.html not found in root directory!", 404

if __name__ == "__main__":
    print("AutoFeed AI is starting... 🚀")
    print(f"Current Directory: {os.getcwd()}")
    print(f"Files in directory: {os.listdir('.')}")
    app.run(host="0.0.0.0", port=7860)
