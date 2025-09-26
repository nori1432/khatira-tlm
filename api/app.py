from flask import Flask, jsonify, request, session, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import pymysql
pymysql.install_as_MySQLdb()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://avnadmin:AVNS_7S5Xekmr7eF-EA0hfvD@mysql-2c84ad79-norichaos1-1a72.g.aivencloud.com:27448/defaultdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Database Models
class Users13(db.Model):
    __tablename__ = 'users13'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Khawatir13(db.Model):
    __tablename__ = 'khawatir13'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users13.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    upvotes = db.Column(db.Integer, default=0)
    downvotes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('Users13', backref=db.backref('khawatir', lazy=True))

class Votes13(db.Model):
    __tablename__ = 'votes13'
    id = db.Column(db.Integer, primary_key=True)
    khatira_id = db.Column(db.Integer, db.ForeignKey('khawatir13.id'), nullable=False)
    cookie_id = db.Column(db.String(255), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)  # 'up' or 'down'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    khatira = db.relationship('Khawatir13', backref=db.backref('votes', lazy=True))

class Phases13(db.Model):
    __tablename__ = 'phases13'
    id = db.Column(db.Integer, primary_key=True)
    current_phase = db.Column(db.Integer, default=1)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

# API Routes
@app.route('/api/submit', methods=['POST'])
def submit_khatira():
    try:
        data = request.json
        name = data.get('name')
        content = data.get('content')
        
        if not name or not content:
            return jsonify({'error': 'Name and content are required'}), 400
        
        # Create or get user
        user = Users13.query.filter_by(name=name).first()
        if not user:
            user = Users13(name=name)
            db.session.add(user)
            db.session.commit()
        
        # Create khatira
        khatira = Khawatir13(user_id=user.id, content=content)
        db.session.add(khatira)
        db.session.commit()
        
        return jsonify({'message': 'Khatira submitted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/khawatir', methods=['GET'])
def get_khawatir():
    try:
        phase = get_current_phase()
        cookie_id = request.cookies.get('user_id', str(datetime.utcnow().timestamp()))
        
        if phase == 1:
            return jsonify({'khawatir': [], 'phase': phase})
        
        khawatir = Khawatir13.query.all()
        result = []
        
        for khatira in khawatir:
            khatira_data = {
                'id': khatira.id,
                'content': khatira.content,
                'upvotes': khatira.upvotes,
                'downvotes': khatira.downvotes,
                'created_at': khatira.created_at.isoformat()
            }
            
            if phase >= 2:
                if phase == 2:
                    # Phase 2: Show without names
                    pass
                elif phase == 3:
                    # Phase 3: Show with names and final rankings
                    khatira_data['author'] = khatira.user.name
            
            # Check if user has voted
            user_vote = Votes13.query.filter_by(
                khatira_id=khatira.id,
                cookie_id=cookie_id
            ).first()
            khatira_data['user_vote'] = user_vote.vote_type if user_vote else None
            
            result.append(khatira_data)
        
        # Sort by score for phase 3
        if phase == 3:
            result.sort(key=lambda x: x['upvotes'] - x['downvotes'], reverse=True)
        
        return jsonify({'khawatir': result, 'phase': phase})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vote', methods=['POST'])
def vote():
    try:
        data = request.json
        khatira_id = data.get('khatira_id')
        vote_type = data.get('vote_type')  # 'up' or 'down'
        
        phase = get_current_phase()
        if phase != 2:
            return jsonify({'error': 'Voting not allowed in current phase'}), 403
        
        cookie_id = request.cookies.get('user_id')
        if not cookie_id:
            cookie_id = str(datetime.utcnow().timestamp())
        
        # Check if user already voted
        existing_vote = Votes13.query.filter_by(
            khatira_id=khatira_id,
            cookie_id=cookie_id
        ).first()
        
        if existing_vote:
            return jsonify({'error': 'You have already voted on this khatira'}), 403
        
        # Create vote
        vote = Votes13(
            khatira_id=khatira_id,
            cookie_id=cookie_id,
            vote_type=vote_type
        )
        db.session.add(vote)
        
        # Update khatira vote count
        khatira = Khawatir13.query.get(khatira_id)
        if vote_type == 'up':
            khatira.upvotes += 1
        else:
            khatira.downvotes += 1
        
        db.session.commit()
        
        response = make_response(jsonify({'message': 'Vote recorded successfully'}))
        response.set_cookie('user_id', cookie_id, max_age=30*24*60*60)  # 30 days
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        password = data.get('password')
        
        if password == 'valar morghulis':
            session['admin'] = True
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/phase', methods=['GET', 'POST'])
def manage_phase():
    try:
        if not session.get('admin'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        if request.method == 'GET':
            phase = get_current_phase()
            return jsonify({'current_phase': phase})
        
        elif request.method == 'POST':
            data = request.json
            new_phase = data.get('phase')
            
            if new_phase not in [1, 2, 3]:
                return jsonify({'error': 'Invalid phase'}), 400
            
            phase_record = Phases13.query.first()
            if not phase_record:
                phase_record = Phases13(current_phase=new_phase)
                db.session.add(phase_record)
            else:
                phase_record.current_phase = new_phase
                phase_record.updated_at = datetime.utcnow()
            
            db.session.commit()
            return jsonify({'message': 'Phase updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/khawatir', methods=['GET'])
def admin_get_khawatir():
    try:
        if not session.get('admin'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        khawatir = Khawatir13.query.all()
        result = []
        
        for khatira in khawatir:
            result.append({
                'id': khatira.id,
                'author': khatira.user.name,
                'content': khatira.content,
                'upvotes': khatira.upvotes,
                'downvotes': khatira.downvotes,
                'score': khatira.upvotes - khatira.downvotes,
                'created_at': khatira.created_at.isoformat()
            })
        
        result.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'khawatir': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/khawatir/<int:khatira_id>', methods=['DELETE'])
def admin_delete_khatira(khatira_id):
    try:
        if not session.get('admin'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Find the khatira
        khatira = Khawatir13.query.get(khatira_id)
        if not khatira:
            return jsonify({'error': 'Khatira not found'}), 404
        
        # Delete associated votes first
        Votes13.query.filter_by(khatira_id=khatira_id).delete()
        
        # Delete the khatira
        db.session.delete(khatira)
        db.session.commit()
        
        return jsonify({'message': 'Khatira deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/khawatir/clear-all', methods=['DELETE'])
def admin_clear_all_khawatir():
    try:
        if not session.get('admin'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Delete all votes first
        Votes13.query.delete()
        
        # Delete all khawatir
        Khawatir13.query.delete()
        
        # Delete all users (since they might be orphaned)
        Users13.query.delete()
        
        db.session.commit()
        
        return jsonify({'message': 'All submissions cleared successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def get_current_phase():
    phase_record = Phases13.query.first()
    return phase_record.current_phase if phase_record else 1

# Initialize database
def create_tables():
    with app.app_context():
        db.create_all()
        # Initialize phase if not exists
        if not Phases13.query.first():
            phase = Phases13(current_phase=1)
            db.session.add(phase)
            db.session.commit()

if __name__ == '__main__':
    create_tables()
    app.run(debug=True)