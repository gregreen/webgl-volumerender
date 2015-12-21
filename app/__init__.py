from flask import Flask
from jinja2 import Environment, PackageLoader
from config import basedir

app = Flask(__name__)

from app import views
