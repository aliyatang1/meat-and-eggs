from flask import Flask, render_template, request, jsonify, session
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

@app.route('/simulator/<type>')
def simulator(type):
    if type == 'steak':
        return render_template('steak_simulator.html')
    elif type == 'eggs':
        return render_template('egg_simulator.html')
    else:
        return "Simulator not found", 404


@app.route('/quiz')
def quiz_selection():
    return render_template('quiz_selection.html')

@app.route('/quiz/<topic>/<int:question_id>')
def quiz(topic, question_id):
    quiz_data = load_json(f'quiz_{topic}.json')
    question = quiz_data.get(str(question_id))
    
    if not question:
        # Calculate score when quiz is completed
        correct_count = session.get(f'{topic}_score', 0)
        total_questions = len(quiz_data)
        return render_template('results.html',
                            topic=topic,
                            correct_count=correct_count,
                            total_questions=total_questions)
    
    return render_template('quiz.html',
                         topic=topic,
                         question_id=question_id,
                         question=question,
                         total_questions=len(quiz_data))

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    topic = data['topic']
    question_id = str(data['question_id'])
    user_answer = data['answer']
    
    # Load quiz data and correct answer
    quiz_data = load_json(f'quiz_{topic}.json')
    correct_answer = quiz_data[question_id]['correct_answer']
    
    # Check if answer is correct
    is_correct = (user_answer == correct_answer)
    
    # Update session score
    if is_correct:
        session[f'{topic}_score'] = session.get(f'{topic}_score', 0) + 1
    
    # Log the answer
    user_logs['quiz_answers'].append({
        'topic': topic,
        'question_id': question_id,
        'user_answer': user_answer,
        'correct_answer': correct_answer,
        'correct': is_correct
    })
    save_user_logs()
    
    return jsonify(success=True, correct=is_correct)

@app.route('/results/<topic>')
def show_results(topic):
    # Get score from session
    correct_count = session.get(f'{topic}_score', 0)
    quiz_data = load_json(f'quiz_{topic}.json')
    total_questions = len(quiz_data)
    
    # Clear the session score
    session.pop(f'{topic}_score', None)
    
    return render_template('results.html',
                         topic=topic,
                         correct_count=correct_count,
                         total_questions=total_questions)

if __name__ == '__main__':
    app.run(debug=True, port=5001)