import pdfplumber

def extract_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text(x_tolerance=2, y_tolerance=3) + "\n"
    return text

if __name__ == '__main__':
    pdf_path = r"c:\Users\Lenovo\Downloads\simmam\pdf\list of events.pdf"
    text = extract_text(pdf_path)
    with open("parsed_events_plumber.txt", "w", encoding="utf-8") as out:
        out.write(text)
    print("Done")
