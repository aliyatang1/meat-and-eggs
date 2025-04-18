from flask import Flask, render_template, request, jsonify, session
import os
from datetime import datetime

app = Flask(__name__, template_folder='.')

user_logs = {
    "lessons": [],
    "quiz_answers": [],
}

@app.route('/')
def welcome():
    return render_template('welcome.html')  

@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    timestamp = datetime.now().isoformat()
    user_logs['lessons'].append({'lesson_id': lesson_id, 'timestamp': timestamp})
    return render_template('learn.html', lesson_id=lesson_id)

@app.route('/quiz/<int:question_id>')
def quiz(question_id):
    return render_template('quiz.html', question_id=question_id)

@app.route('/results')
def quiz_results():
    score = session.get('score', 0)
    return render_template('results.html', score=score)

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    question_id = data.get('question_id')
    answer = data.get('answer')
    correct = data.get('correct')

    user_logs['quiz_answers'].append({'question_id': question_id, 'answer': answer, 'correct': correct})
    return jsonify(success=True)

@app.route('/log_action', methods=['POST'])
def log_action():
    data = request.get_json()
    print("LOG:", data) 
    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
