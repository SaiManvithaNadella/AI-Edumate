# backend/app/services/progress_tracker.py

# A simple in-memory dictionary for progress tracking (dummy implementation)
progress_db = {}

def update_progress(user_email: str, course_id: int, module_id: int, lesson_id: int, progress: float) -> bool:
    # Update progress in the dummy progress database.
    key = (user_email, course_id)
    if key not in progress_db:
        progress_db[key] = {}
    progress_db[key][(module_id, lesson_id)] = progress
    return True

def get_progress(user_email: str, course_id: int):
    # Retrieve progress for a specific user and course.
    key = (user_email, course_id)
    return progress_db.get(key, {})
