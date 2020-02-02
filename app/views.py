from __future__ import print_function, division

from app import app
from flask import render_template, g, request, Response
from cerberus import Validator
import json
import functools


def validate_qstring(schema, **kw):
    v = Validator(schema, **kw)

    def json_parse_error(e):
        raise BadRequest(description=str(e))

    def decorator(f):
        @functools.wraps(f)
        def validated(*args, **kwargs):
            # print('validating query string...')
            if not v.validate(request.args.to_dict()):
                resp = {
                    'input_errors': v.errors,
                    'expected_schema': schema
                }
                return Response(
                    json.dumps(resp, indent=2, default=lambda o: str(o)),
                    mimetype='application/json',
                    status=400)

            if not hasattr(g, 'args'):
                g.args = {}
            g.args.update(v.document)

            return f(*args, **kwargs)
        return validated

    return decorator


volumerender_schema = {
    'fov': {
        'type': 'float',
        'coerce': float,
        'min': 0.0,
        'max': 180.0,
        'default': 90.0
    },
    'tau_max': {
        'type': 'float',
        'coerce': float,
        'min': 0.0,
        'max': 100.0,
        'default': 5.0
    },
    'n_steps_max': {
        'type': 'integer',
        'coerce': int,
        'min': 0,
        'max': 10000,
        'default': 150
    },
    'xi': {
        'type': 'float',
        'coerce': float,
        'min': 0.0,
        'max': 1000.0,
        'default': 25.0
    },
    'n_samples': {
        'type': 'integer',
        'coerce': int,
        'min': 1,
        'max': 100,
        'default': 1
    },
    'x': {
        'type': 'float',
        'coerce': float
    },
    'y': {
        'type': 'float',
        'coerce': float
    },
    'z': {
        'type': 'float',
        'coerce': float
    },
    'alpha': {
        'type': 'float',
        'coerce': float
    },
    'beta': {
        'type': 'float',
        'coerce': float
    },
    'ver': {
        'type': 'string',
        'default': 'b15'
    },
    'color': {
        'type': 'integer',
        'coerce': int,
        'default': 0
    }
}

@app.route('/')
@validate_qstring(volumerender_schema)
def view_index():
    print('Parsed the following arguments:')
    print(g.args)
    ver_props = {
        'b15': {
            'n_textures': 4,
            'dm_0': 4.0,
            'dm_1': 19.0,
            'n_dm': 31
        },
        'b19': {
            'n_textures': 15,
            'dm_0': 4.0,
            'dm_1': 18.875,
            'n_dm': 120
        }
    }[g.args['ver']]
    g.args.update(ver_props)
    return render_template('volumerender.html', **g.args)
