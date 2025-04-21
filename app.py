from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)

user_logs = {
    "lessons": [],
    "quiz_answers": [],
    "simulator_actions": []
}

#logs info about time, correctness, etc. onto log.json
def load_json(filename):
    with open(os.path.join('json', filename), 'r') as f:
        return json.load(f)

# Helper function to save logs to log.json
def save_user_logs():
    with open('log.json', 'w') as f:
        json.dump(user_logs, f, indent=4)

@app.route('/')
def welcome():
    return render_template('welcome.html')

#shows the specific lesson either meat or eggs
@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    lessons = load_json('lessons.json')
    lesson = lessons.get(str(lesson_id))

    timestamp = datetime.now().isoformat()
    user_logs['lessons'].append({'lesson_id': lesson_id, 'timestamp': timestamp})
    save_user_logs()

    return render_template('learn.html', lesson=lesson)

#quiz for either meat or eggs -> redirects the person's quiz topic
@app.route('/quiz/<topic>/<int:question_id>')
def quiz(topic, question_id):
    if topic not in ['meat', 'eggs']:
        return "Invalid quiz topic", 404

    quiz_data = load_json(f'quiz_{topic}.json')
    question = quiz_data.get(str(question_id))

    if not question:
        correct_count = len([
            q for q in user_logs['quiz_answers']
            if q['topic'] == topic and q['correct']
        ])
        return render_template('results.html', score=correct_count)

    return render_template('quiz.html', question=question, question_id=question_id, topic=topic)

#retrieves the quiz answers for the user
@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    topic = data.get('topic')
    question_id = data.get('question_id')
    answer = data.get('answer')
    correct = data.get('correct')

    user_logs['quiz_answers'].append({
        'topic': topic,
        'question_id': question_id,
        'answer': answer,
        'correct': correct
    })

    save_user_logs()
    return jsonify(success=True)

#retrieves info about simulator actions to save onto log.json
@app.route('/log_action', methods=['POST'])
def log_action():
    data = request.get_json()
    user_logs['simulator_actions'].append(data)
    save_user_logs()
    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
