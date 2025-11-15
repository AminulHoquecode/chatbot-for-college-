from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app)

# Robustly load FAQs
FAQS = []
faq_path = os.path.join(ROOT, 'faqs.json')
if os.path.exists(faq_path):
    try:
        with open(faq_path, 'r', encoding='utf-8') as f:
            FAQS = json.load(f)
    except Exception:
        FAQS = []

# Build TF-IDF on startup (if we have FAQs)
if len(FAQS) > 0:
    corpus = [item.get('question', '') + ' ' + item.get('answer', '') for item in FAQS]
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1,3))
    faq_vectors = vectorizer.fit_transform(corpus)
else:
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1,3))
    faq_vectors = None


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/faqs.json')
def faqs_json():
    # Serve the faqs.json file from project root so frontend can fetch it directly
    faq_path = os.path.join(ROOT, 'faqs.json')
    if os.path.exists(faq_path):
        return send_from_directory(ROOT, 'faqs.json')
    return jsonify([])


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    question = data.get('question', '')
    if not question or not question.strip():
        return jsonify({'error': 'No question provided.'}), 400
    question = question.strip()

    if faq_vectors is None:
        return jsonify({'answer': "FAQ data not available. Please contact the admissions office.", 'score': 0.0, 'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'})

    # compute similarity
    q_vec = vectorizer.transform([question])
    sims = cosine_similarity(q_vec, faq_vectors).flatten()
    top_idx = int(np.argmax(sims))
    top_score = float(sims[top_idx])
    best = FAQS[top_idx]

    # return top 3 suggestions
    top_n = sims.argsort()[-3:][::-1]
    suggestions = []
    for i in top_n:
        suggestions.append({
            'question': FAQS[int(i)].get('question',''),
            'answer': FAQS[int(i)].get('answer',''),
            'score': float(sims[int(i)])
        })

    # If score is too low, return a friendly fallback
    threshold = 0.25
    if top_score < threshold:
        fallback = {
            'answer': "I'm not confident about that. Please check the FAQs below or contact admissions at the college website.",
            'question': None,
            'score': top_score,
            'suggestions': suggestions,
            'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
        }
        return jsonify(fallback)

    return jsonify({
        'answer': best.get('answer',''),
        'question': best.get('question',''),
        'score': top_score,
        'suggestions': suggestions,
        'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
    })


if __name__ == '__main__':
    # Run in debug mode for development; bind to localhost
    app.run(host='127.0.0.1', port=5000, debug=True)
