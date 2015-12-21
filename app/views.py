from app import app

from flask import render_template

@app.route('/')
def view_index():
    return render_template('volumerender.html')
