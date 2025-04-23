from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Needed for session

user_logs = {
    "lessons": [],
    "quiz_answers": [],
    "simulator_actions": []
}

def load_json(filename):
    with open(os.path.join('static', 'json', filename), 'r') as f:
        return json.load(f)

def save_user_logs():
    with open('log.json', 'w') as f:
        json.dump(user_logs, f, indent=4)

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    lessons = load_json('lessons.json')
    lesson = lessons.get(str(lesson_id))
    return render_template('learn.html', lesson=lesson)

# Quiz selection page
@app.route('/quiz')
def quiz_selection():
    return render_template('quiz_selection.html')

# Individual quiz questions
@app.route('/quiz/<topic>/<int:question_id>')
def quiz(topic, question_id):
    quiz_data = load_json(f'quiz_{topic}.json')
    question = quiz_data.get(str(question_id))
    
    if not question:
        return render_template('results.html', topic=topic)
    
    return render_template('quiz.html',
                         topic=topic,
                         question_id=question_id,
                         question=question,
                         total_questions=len(quiz_data))

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    user_logs['quiz_answers'].append(data)
    save_user_logs()
    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001)