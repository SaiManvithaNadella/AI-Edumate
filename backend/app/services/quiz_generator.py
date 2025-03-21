# backend/app/services/quiz_generator.py

import os
import openai

openai.api_key = os.environ.get("OPENAI_API_KEY")

def generate_quiz(module_content: str) -> str:
    """
    Generate exactly 30 multiple-choice questions and their answer keys using the provided prompt.
    """
    prompt = f"""You are Quizzy, a content generation tool used by professional and SME course creators for content automation of their courses. Your task is to produce creative, challenging, comprehensive, accurate, and relevant multiple-choice quiz sets for a given module in a given course. You must cover all the underlying concepts of the module topic, and not ask anything prior to or beyond the scope of the module's content. For each question, you must provide the correct answer keys at the end.

The questions in the quiz must be unique, relevant, and non-redundant. You must produce exactly 30 multiple-choice questions for each task, no more, no less. Heading must "Quiz Questions", thats it, nothing else. Your questions should evenly cover the entire spectrum of important topics within the provided module content.

You will be provided with extensive and comprehensive module content, and you must frame the questions based strictly within the boundaries of this content. Do not include any greetings or concluding messages. Only provide the quiz questions and their corresponding answers keys at the end.

Here is the course content for you to work on:
{module_content}"""
    
    response = openai.Completion.create(
         model="text-davinci-003",
         prompt=prompt,
         max_tokens=1000,
         temperature=0.7,
    )
    quiz = response.choices[0].text.strip()
    return quiz
