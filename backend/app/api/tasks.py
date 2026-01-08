"""
Task status endpoints - Check local task queue status
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import task_queue

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('/<task_id>', methods=['GET'])
@jwt_required()
def get_task_status(task_id):
    """
    Obtiene el estado de una tarea en la cola local.

    Útil para verificar el progreso de generación de PDFs, envío de emails, etc.
    """
    task = task_queue.AsyncResult(task_id)

    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'status': 'Task is waiting to be executed'
        }
    elif task.state == 'STARTED':
        response = {
            'state': task.state,
            'status': 'Task is running'
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'status': 'Task completed successfully',
            'result': task.result
        }
    elif task.state == 'FAILURE':
        response = {
            'state': task.state,
            'status': 'Task failed',
            'error': str(task.info)
        }
    elif task.state == 'REVOKED':
        response = {
            'state': task.state,
            'status': 'Task cancelled'
        }
    elif task.state == 'RETRY':
        response = {
            'state': task.state,
            'status': 'Task is being retried',
            'info': str(task.info)
        }
    else:
        response = {
            'state': task.state,
            'status': str(task.info)
        }

    return jsonify(response), 200


@tasks_bp.route('/<task_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_task(task_id):
    """Cancela una tarea en ejecución"""
    task = task_queue.AsyncResult(task_id)

    if task.state in ['PENDING', 'STARTED']:
        task.revoke(terminate=True)
        return jsonify({
            'status': 'cancelled',
            'task_id': task_id
        }), 200
    else:
        return jsonify({
            'error': f'Cannot cancel task in state {task.state}'
        }), 400
