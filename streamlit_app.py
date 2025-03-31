import streamlit as st
import requests
import openai
import os

# Load API key from environment variable or fallback
openai.api_key = os.getenv("OPENAI_API_KEY") or "sk-..."

API_BASE = "http://localhost:8000"

# Session State Initialization
if "dark_mode" not in st.session_state:
    st.session_state.dark_mode = True
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Sidebar - Theme Toggle
st.sidebar.title("⚙️ Settings")
dark_mode = st.sidebar.checkbox("🌙 Dark Mode", value=st.session_state.dark_mode)
st.session_state.dark_mode = dark_mode

# Apply Dark Theme Styles
if dark_mode:
    st.markdown("""
        <style>
        .main, .stApp {
            background-color: black;
            color: white;
        }
        </style>
    """, unsafe_allow_html=True)

st.title("🚀 AI-Edumate")

tabs = st.tabs(["🏗️ Course Outline", "📘 Lesson Generation", "📝 Quiz Generation", "🧠 Flashcards", "💬 AI Tutor"])

# --- Utility Functions ---
def get_courses():
    try:
        res = requests.get(f"{API_BASE}/course/list")
        return res.json() if res.status_code == 200 else []
    except:
        return []

def get_lessons():
    try:
        res = requests.get(f"{API_BASE}/lesson/list")
        return res.json() if res.status_code == 200 else []
    except:
        return []

# --- Tab 1: Course Outline ---
with tabs[0]:
    st.header("Generate Course Outline")
    topic = st.text_input("Course Topic")
    num_modules = st.number_input("Number of Modules", min_value=1, step=1)

    if st.button("Generate Outline"):
        if topic and num_modules:
            try:
                res = requests.post(f"{API_BASE}/course/generate-outline", json={
                    "topic": topic,
                    "num_modules": int(num_modules)
                })
                if res.status_code == 200:
                    st.success("✅ Course Outline Generated!")
                    st.json(res.json())
                else:
                    st.error("⚠️ Could not generate outline.")
            except Exception as e:
                st.error(f"Backend not reachable: {e}")
        else:
            st.warning("Please fill in all fields.")

# --- Tab 2: Lesson Generation ---
with tabs[1]:
    st.header("Generate Lesson Content")

    courses = get_courses()
    lessons = get_lessons()
    lesson_map = {}

    if not courses or not lessons:
        st.warning("Waiting for backend...")
    else:
        course_map = {c['course_name']: c['course_id'] for c in courses}
        selected_course = st.selectbox("Course", list(course_map.keys()))
        course_id = course_map[selected_course]

        filtered_modules = list({l['module_name'] for l in lessons if l['course_id'] == course_id})
        selected_module = st.selectbox("Module", filtered_modules)

        filtered_lessons = [l for l in lessons if l['course_id'] == course_id and l['module_name'] == selected_module]
        lesson_map = {l['lesson_name']: l['lesson_id'] for l in filtered_lessons}
        selected_lesson = st.selectbox("Lesson", list(lesson_map.keys()))

        if st.button("Generate Lesson"):
            try:
                payload = {
                    "course_name": selected_course,
                    "module_name": selected_module,
                    "lesson_name": selected_lesson
                }
                res = requests.post(f"{API_BASE}/lesson/generate", json=payload)
                if res.status_code == 200:
                    st.success("✅ Lesson Generated")
                    st.markdown(res.json()['generated_content'], unsafe_allow_html=True)
                else:
                    st.error("Lesson generation failed.")
            except Exception as e:
                st.error(f"Backend issue: {e}")

# --- Tab 3: Quiz Generation ---
with tabs[2]:
    st.header("Generate Quiz")
    if not lesson_map:
        st.info("No lessons found.")
    else:
        selected_quiz_lesson = st.selectbox("Select Lesson for Quiz", list(lesson_map.keys()))

        if st.button("Generate Quiz"):
            try:
                res = requests.post(f"{API_BASE}/quiz/generate", json={
                    "course_name": selected_course,
                    "lesson_name": selected_quiz_lesson
                })
                if res.status_code == 200:
                    quiz = res.json().get("quiz", [])
                    for q in quiz:
                        st.markdown(f"**Q:** {q['question']}")
                        for opt in q['options']:
                            st.markdown(f"- {opt}")
                else:
                    st.error("Quiz generation failed.")
            except Exception as e:
                st.error(f"Backend error: {e}")

# --- Tab 4: Flashcards ---
with tabs[3]:
    st.header("Generate Flashcards")
    if not lesson_map:
        st.info("No lessons found.")
    else:
        selected_flashcard_lesson = st.selectbox("Lesson for Flashcards", list(lesson_map.keys()))

        if st.button("Generate Flashcards"):
            try:
                res = requests.get(f"{API_BASE}/flashcards/generate", params={
                    "lesson_name": selected_flashcard_lesson
                })
                if res.status_code == 200:
                    flashcards = res.json().get("flashcards", [])
                    for i, card in enumerate(flashcards):
                        with st.expander(f"Card {i+1}"):
                            st.markdown(f"**Q:** {card['question']}")
                            st.markdown(f"**A:** {card['answer']}")
                else:
                    st.error("Flashcard generation failed.")
            except Exception as e:
                st.error(f"Error contacting backend: {e}")

# --- Tab 5: AI Tutor ---
with tabs[4]:
    st.header("Chat with AI Tutor")
    user_input = st.chat_input("Ask something...")

    if user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=st.session_state.chat_history
            )
            reply = response.choices[0].message.content
            st.session_state.chat_history.append({"role": "assistant", "content": reply})
        except Exception as e:
            reply = f"❌ OpenAI error: {e}"
            st.session_state.chat_history.append({"role": "assistant", "content": reply})

    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])