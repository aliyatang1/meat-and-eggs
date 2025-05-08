from flask import Flask, render_template, request, jsonify, session, redirect, url_for
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
    total_questions = len(quiz_data)
    
    if question_id < 1:
        return redirect(url_for('quiz_selection'))
    if question_id > total_questions:
        return redirect(url_for('show_results', topic=topic))
    
    question = quiz_data.get(str(question_id))
    
    # Initialize session data if not exists
    if 'quiz_answers' not in session:
        session['quiz_answers'] = {}
    if topic not in session['quiz_answers']:
        session['quiz_answers'][topic] = {}

    # ✅ Get current answer for this question
    qid_str = str(question_id)
    current_answer = session['quiz_answers'][topic].get(qid_str, '')

    return render_template('quiz.html',
                         topic=topic,
                         question_id=question_id,
                         question=question,
                         total_questions=total_questions,
                         current_answer=current_answer)  # ✅ pass to template


@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    topic = data['topic']
    question_id = str(data['question_id'])
    user_answer = data['answer']
    is_correct = data['correct']
    
    # Initialize session data if not exists
    if 'quiz_answers' not in session:
        session['quiz_answers'] = {}
    if topic not in session['quiz_answers']:
        session['quiz_answers'][topic] = {}
    
    # Save the answer
    session['quiz_answers'][topic][question_id] = user_answer
    session.modified = True
    
    # Update score if correct
    if is_correct:
        if f'{topic}_score' not in session:
            session[f'{topic}_score'] = 0
        session[f'{topic}_score'] += 1
    
    # Log the answer
    user_logs['quiz_answers'].append({
        'topic': topic,
        'question_id': question_id,
        'user_answer': user_answer,
        'correct': is_correct,
        'timestamp': datetime.now().isoformat()
    })
    save_user_logs()
    
    return jsonify(success=True)

@app.route('/results/<topic>')
def show_results(topic):
    # Get score from session
    correct_count = session.get(f'{topic}_score', 0)
    quiz_data = load_json(f'quiz_{topic}.json')
    total_questions = len(quiz_data)
    
    # Calculate percentage
    percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    # Clear the session data for this quiz
    if 'quiz_answers' in session and topic in session['quiz_answers']:
        session['quiz_answers'].pop(topic, None)
    session.pop(f'{topic}_score', None)
    session.modified = True
    
    return render_template('results.html',
                         topic=topic,
                         correct_count=correct_count,
                         total_questions=total_questions,
                         percentage=percentage)

if __name__ == '__main__':
    app.run(debug=True, port=5001)