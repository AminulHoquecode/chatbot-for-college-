# DCTM Enquiry Chatbot (Simple AI/ML Course Project)

This is a simple chatbot project for a college enquiry system (Delhi College of Technology and Management — DCTM). It demonstrates a lightweight ML approach (TF-IDF + cosine similarity) to answer FAQs, plus a clean web UI.


Features
- Rule-lite ML: TF-IDF vectorizer + cosine similarity to retrieve best FAQ answers.
- Improved UX: Header with logo, typing indicator, timestamps, and quick FAQs.
- Friendly fallback: backend returns a helpful fallback if confidence is low.
- Clean responsive frontend: static HTML/CSS/JS chat UI.
- Easy to extend: add more FAQs in `faqs.json`.

Files
- `app.py` — Flask backend that serves the frontend and the `/api/chat` endpoint. Returns `answer`, `score`, `suggestions`, `timestamp`.
- `faqs.json` — FAQ dataset (questions and answers).
- `static/` — Frontend files (`index.html`, `style.css`, `app.js`) and `assets/` (icons, logo).
- `requirements.txt` — Python dependencies.

Setup (Windows PowerShell)
1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the app:

```powershell
python app.py
```

4. Open your browser to `http://127.0.0.1:5000`

Notes on behavior
- The backend computes a TF-IDF similarity score. If the top match has a confidence score below ~0.25, the assistant returns a polite fallback message with related suggestions.
- To improve semantic understanding, consider swapping TF-IDF for sentence embeddings (`sentence-transformers`). This will yield better results for paraphrased or conversational queries.

Next steps / Ideas
- Replace TF-IDF with semantic embeddings (e.g., `sentence-transformers`) for better matching.
- Add an admin UI to edit/add FAQs and persist them to a small database.
- Add user analytics (query logs, accepted answer rates) to iterate on FAQ quality.

Using your attached official logo
- I added a fallback to use `static/assets/dctm_logo.png` if you place your provided logo image there. The frontend will automatically use `dctm_logo.png` and fall back to the project's `logo.svg` if the PNG is not present.

To use the attached logo: save the image file you provided as

```
static/assets/dctm_logo.png
```

If you prefer a different filename (e.g., `.jpg`), update the `src` in `static/index.html` accordingly.

