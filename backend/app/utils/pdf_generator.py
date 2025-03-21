# backend/app/utils/pdf_generator.py

from fpdf import FPDF

def generate_pdf(text: str, output_filename: str = "output.pdf"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    # Split text into lines and add them to the PDF
    for line in text.split("\n"):
        pdf.cell(200, 10, txt=line, ln=True)
    pdf.output(output_filename)
    return output_filename
